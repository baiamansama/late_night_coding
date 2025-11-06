from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import json
import asyncio
import os
from dotenv import load_dotenv

from services.speech_recognition import SpeechRecognizer
from services.word_matcher import WordMatcher
from services.quiz_generator import QuizGenerator

load_dotenv()

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

speech_recognizer = SpeechRecognizer(
    subscription_key=azure_key,
    region=azure_region
)
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

    expected_words: List[str] = []
    current_index = 0
    audio_buffer = bytearray()

    try:
        while True:
            # Receive message
            try:
                message = await websocket.receive()
            except WebSocketDisconnect:
                break

            # Handle text messages (control messages)
            if "text" in message:
                data = json.loads(message["text"])
                print(f"📨 Received text message: {data.get('type', 'unknown')}")

                if data.get("type") == "start":
                    expected_words = data.get("expectedWords", [])
                    current_index = 0
                    audio_buffer.clear()
                    print(f"📚 Expected words count: {len(expected_words)}")
                    print(f"📝 First 5 words: {expected_words[:5]}")
                    await websocket.send_json({
                        "type": "ready",
                        "message": "Ready to receive audio"
                    })

                elif data.get("type") == "stop":
                    print("🛑 Stop message received")
                    break

            # Handle binary messages (audio data)
            elif "bytes" in message:
                audio_data = message["bytes"]
                audio_buffer.extend(audio_data)
                print(f"🎤 Received audio chunk, buffer size: {len(audio_buffer)} bytes")

                # Process audio when buffer reaches a certain size
                # Note: WebM chunks are variable size, process every ~10 chunks or 20KB
                if len(audio_buffer) >= 20000:
                    print(f"🔊 Processing audio buffer of {len(audio_buffer)} bytes...")
                    try:
                        # Recognize speech from audio buffer
                        recognized_text = await speech_recognizer.recognize_from_buffer(
                            bytes(audio_buffer)
                        )
                        print(f"🗣️ Azure recognized: '{recognized_text}'")

                        if recognized_text and current_index < len(expected_words):
                            # Split recognized text into words
                            recognized_words = recognized_text.lower().split()
                            print(f"📝 Recognized words: {recognized_words}")
                            print(f"📍 Current index: {current_index}, Expected word: '{expected_words[current_index] if current_index < len(expected_words) else 'N/A'}'")

                            # Try to match words
                            for recognized_word in recognized_words:
                                if current_index >= len(expected_words):
                                    break

                                expected_word = expected_words[current_index].lower()

                                # Use fuzzy matching
                                is_match, confidence = word_matcher.match(
                                    expected_word,
                                    recognized_word
                                )
                                print(f"🎯 Matching '{expected_word}' vs '{recognized_word}': Match={is_match}, Confidence={confidence:.2f}")

                                if is_match:
                                    # Send success response
                                    print(f"✅ Word matched! Sending recognition for word #{current_index}")
                                    await websocket.send_json({
                                        "type": "word_recognized",
                                        "word": recognized_word,
                                        "expected": expected_word,
                                        "index": current_index,
                                        "confidence": confidence
                                    })
                                    current_index += 1
                                else:
                                    print(f"❌ Word didn't match (confidence {confidence:.2f} < threshold {word_matcher.threshold})")
                        elif recognized_text:
                            print(f"⚠️ Recognized text but current_index ({current_index}) >= word count ({len(expected_words)})")
                        else:
                            print("❓ No text recognized from audio")

                        # Clear processed audio
                        audio_buffer.clear()
                        print("🧹 Audio buffer cleared")

                    except Exception as e:
                        print(f"❌ Error processing audio: {e}")
                        await websocket.send_json({
                            "type": "error",
                            "message": str(e)
                        })
                        audio_buffer.clear()

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"Server error: {str(e)}"
            })
        except:
            pass
    finally:
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
