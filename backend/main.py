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
speech_recognizer = SpeechRecognizer(
    subscription_key=os.getenv("AZURE_SPEECH_KEY", ""),
    region=os.getenv("AZURE_SPEECH_REGION", "")
)
word_matcher = WordMatcher(
    threshold=float(os.getenv("WORD_MATCH_THRESHOLD", "0.70"))
)
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

                if data.get("type") == "start":
                    expected_words = data.get("expectedWords", [])
                    current_index = 0
                    audio_buffer.clear()
                    await websocket.send_json({
                        "type": "ready",
                        "message": "Ready to receive audio"
                    })

                elif data.get("type") == "stop":
                    break

            # Handle binary messages (audio data)
            elif "bytes" in message:
                audio_data = message["bytes"]
                audio_buffer.extend(audio_data)

                # Process audio when buffer reaches a certain size (e.g., 1 second of audio)
                # For 16kHz, 16-bit audio, 1 second = 32000 bytes
                if len(audio_buffer) >= 32000:
                    try:
                        # Recognize speech from audio buffer
                        recognized_text = await speech_recognizer.recognize_from_buffer(
                            bytes(audio_buffer)
                        )

                        if recognized_text and current_index < len(expected_words):
                            # Split recognized text into words
                            recognized_words = recognized_text.lower().split()

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

                                if is_match:
                                    # Send success response
                                    await websocket.send_json({
                                        "type": "word_recognized",
                                        "word": recognized_word,
                                        "expected": expected_word,
                                        "index": current_index,
                                        "confidence": confidence
                                    })
                                    current_index += 1

                        # Clear processed audio
                        audio_buffer.clear()

                    except Exception as e:
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
