from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import json
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from services.speech_stream import AzureStreamingSession
from services.word_matcher import WordMatcher
from services.quiz_generator import QuizGenerator

app = FastAPI(title="Kids Reading Recognition API")

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
print("🔧 Initializing services...")
azure_key = os.getenv("AZURE_SPEECH_KEY", "")
azure_region = os.getenv("AZURE_SPEECH_REGION", "")

if azure_key and azure_region:
    print(f"✅ Azure credentials found - Region: {azure_region}")
else:
    print("❌ WARNING: Azure credentials missing!")
    if not azure_key:
        print("   - AZURE_SPEECH_KEY is not set")
    if not azure_region:
        print("   - AZURE_SPEECH_REGION is not set")

word_matcher = WordMatcher(
    threshold=float(os.getenv("WORD_MATCH_THRESHOLD", "0.70"))
)
print(f"📊 Word matching threshold: {word_matcher.threshold}")

quiz_generator = QuizGenerator(
    openai_api_key=os.getenv("OPENAI_API_KEY", ""),
    anthropic_api_key=os.getenv("ANTHROPIC_API_KEY", "")
)


class QuizRequest(BaseModel):
    text: str
    session_id: str


class QuizResponse(BaseModel):
    questions: List[Dict[str, Any]]


@app.get("/")
async def root():
    return {
        "message": "Kids Reading Recognition API",
        "version": "1.0.0",
        "endpoints": {
            "websocket": "/ws/recognize",
            "quiz": "/api/generate-quiz"
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.websocket("/ws/recognize")
async def websocket_recognize(websocket: WebSocket):
    """
    WebSocket endpoint for real-time speech recognition and word matching.

    Expected message format from client:
    {
        "type": "start",
        "expectedWords": ["word1", "word2", ...]
    }

    Or for audio data, send raw audio buffer

    Response format:
    {
        "type": "word_recognized",
        "word": "recognized_word",
        "index": 0,
        "confidence": 0.95
    }
    """
    await websocket.accept()
    print(f"✅ WebSocket connection accepted from {websocket.client}")

    # Per-connection state
    expected_words: List[str] = []
    current_index = 0
    session: AzureStreamingSession | None = None
    loop = asyncio.get_event_loop()

    # Helper to send JSON safely
    async def send_json(obj):
        try:
            await websocket.send_json(obj)
        except Exception as e:
            print(f"⚠️ Error sending JSON: {e}")

    # Azure callbacks: map recognized text into word-by-word matches
    async def on_partial(text: str):
        """Called by Azure when it recognizes speech (INSTANT!)"""
        nonlocal current_index
        if not expected_words:
            return

        print(f"🎙️ [Partial] Azure recognized: '{text}'")
        tokens = text.lower().split()

        for token in tokens:
            if current_index >= len(expected_words):
                return

            # Clean token (remove punctuation)
            token_clean = ''.join(c for c in token if c.isalnum() or c == "'")
            if not token_clean:
                continue

            expected_word = expected_words[current_index].lower()
            is_match, confidence = word_matcher.match(expected_word, token_clean)

            print(f"🎯 Matching '{expected_word}' vs '{token_clean}': Match={is_match}, Confidence={confidence:.2f}")

            if is_match:
                print(f"✅ Word matched! Sending recognition for word #{current_index}")
                await send_json({
                    "type": "word_recognized",
                    "word": token_clean,
                    "expected": expected_word,
                    "index": current_index,
                    "confidence": confidence,
                    "partial": True
                })
                current_index += 1

    async def on_final(text: str):
        """Called by Azure when it completes a phrase"""
        print(f"✅ [Final] Azure recognized: '{text}'")
        # Process same way as partial (words turn green immediately from partial anyway)
        await on_partial(text)

    try:
        while True:
            message = await websocket.receive()

            # Handle text messages (control)
            if "text" in message:
                data = json.loads(message["text"]) if message.get("text") else {}
                msg_type = data.get("type")

                if msg_type == "start":
                    expected_words = [w for w in data.get("expectedWords", []) if isinstance(w, str)]
                    current_index = 0
                    print(f"📚 Expected words count: {len(expected_words)}")
                    print(f"📝 First 5 words: {expected_words[:5]}")

                    # (Re)create streaming session
                    if session:
                        session.stop()
                        session = None

                    session = AzureStreamingSession(
                        azure_key,
                        azure_region,
                        loop=loop,
                        on_partial=on_partial,
                        on_final=on_final,
                    )
                    await send_json({"type": "ready", "message": "Ready to receive PCM16 audio"})

                elif msg_type == "stop":
                    print("🛑 Stop message received")
                    if session:
                        session.stop()
                        session = None
                    await send_json({"type": "stopped"})
                    break

            # Handle binary messages (raw PCM16 audio from AudioWorklet)
            elif "bytes" in message:
                # Push raw PCM16 into Azure stream (continuous recognition!)
                if session:
                    session.push_pcm16(message["bytes"])

    except WebSocketDisconnect:
        print("📡 WebSocket disconnected")
    except Exception as e:
        print(f"❌ Error: {e}")
        await send_json({"type": "error", "message": str(e)})
    finally:
        # Cleanup
        if session:
            session.stop()
        try:
            await websocket.close()
        except:
            pass


@app.post("/api/generate-quiz", response_model=QuizResponse)
async def generate_quiz(request: QuizRequest):
    """
    Generate comprehension quiz questions for a given text.
    """
    try:
        questions = await quiz_generator.generate_questions(
            text=request.text,
            num_questions=5,
            age_group="11-13"
        )

        return QuizResponse(questions=questions)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
