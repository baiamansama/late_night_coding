"""
Speech Recognition Service using Azure Speech Services.
Configured for children's voices with lenient recognition.
"""

import azure.cognitiveservices.speech as speechsdk
from typing import Optional
import struct
import asyncio


class SpeechRecognizer:
    def __init__(self, subscription_key: str, region: str):
        """
        Initialize Azure Speech Recognizer.

        Args:
            subscription_key: Azure Speech Services API key
            region: Azure region (e.g., 'eastus', 'westus')
        """
        self.subscription_key = subscription_key
        self.region = region

        if not subscription_key or not region:
            raise ValueError("Azure Speech Services credentials are required")

        # Configure speech recognizer
        self.speech_config = speechsdk.SpeechConfig(
            subscription=subscription_key,
            region=region
        )

        # Set recognition language to English (US)
        self.speech_config.speech_recognition_language = "en-US"

        # Silence/segmentation tuning
        # - Keep segmentation silence around default (~650ms) to avoid hallucinations.
        # - Allow a bit more initial silence before timing out for short chunks.
        self.speech_config.set_property(
            speechsdk.PropertyId.Speech_SegmentationSilenceTimeoutMs,
            "650"
        )
        self.speech_config.set_property(
            speechsdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
            "2000"
        )

    def _strip_wav_header(self, audio_data: bytes) -> bytes:
        """
        Return PCM payload by removing the WAV container header if present.

        Azure PushAudioInputStream expects headerless audio buffers.
        If the buffer does not look like a WAV file, return it unchanged.
        """
        try:
            if len(audio_data) < 12:
                return audio_data
            # RIFF .... WAVE
            if audio_data[0:4] != b"RIFF" or audio_data[8:12] != b"WAVE":
                return audio_data

            # Iterate chunks to find 'data'
            offset = 12
            while offset + 8 <= len(audio_data):
                chunk_id = audio_data[offset:offset+4]
                chunk_size = struct.unpack('<I', audio_data[offset+4:offset+8])[0]
                offset += 8
                if chunk_id == b"data":
                    # Return data payload from here
                    end = min(offset + chunk_size, len(audio_data))
                    return audio_data[offset:end]
                # Chunks are word aligned
                offset += chunk_size + (chunk_size % 2)
            # Fallback: typical PCM WAV header is 44 bytes
            return audio_data[44:] if len(audio_data) > 44 else b""
        except Exception:
            # On any parsing issue, fall back to raw buffer
            return audio_data

    async def recognize_from_buffer(self, audio_data: bytes) -> Optional[str]:
        """
        Recognize speech from audio buffer (WAV format from RecordRTC).

        Args:
            audio_data: Complete WAV audio chunk from RecordRTC

        Returns:
            Recognized text or None
        """
        print(f"🎙️ [Azure] Processing WAV audio of {len(audio_data)} bytes")
        try:
            # Create audio format for raw PCM (16kHz, 16-bit, mono)
            audio_format = speechsdk.audio.AudioStreamFormat(
                samples_per_second=16000,
                bits_per_sample=16,
                channels=1
            )

            # Remove WAV header; Azure push streams must be headerless
            pcm_payload = self._strip_wav_header(audio_data)

            # Create push stream and write PCM frames only
            push_stream = speechsdk.audio.PushAudioInputStream(audio_format)
            if pcm_payload:
                push_stream.write(pcm_payload)
            push_stream.close()

            # Create audio config from stream
            audio_config = speechsdk.audio.AudioConfig(stream=push_stream)

            # Create speech recognizer
            recognizer = speechsdk.SpeechRecognizer(
                speech_config=self.speech_config,
                audio_config=audio_config
            )

            # Perform one-shot recognition
            result = recognizer.recognize_once()

            if result.reason == speechsdk.ResultReason.RecognizedSpeech:
                recognized_text = result.text.strip()
                print(f"✅ [Azure] Recognized: '{recognized_text}'")
                return recognized_text
            elif result.reason == speechsdk.ResultReason.NoMatch:
                print(f"❓ [Azure] No speech recognized")
                if hasattr(result, 'no_match_details'):
                    print(f"   Details: {result.no_match_details}")
                return None
            elif result.reason == speechsdk.ResultReason.Canceled:
                cancellation = result.cancellation_details
                print(f"❌ [Azure] Recognition canceled: {cancellation.reason}")
                if cancellation.reason == speechsdk.CancellationReason.Error:
                    print(f"   ❌ Error details: {cancellation.error_details}")
                    print(f"   ❌ This might mean Azure credentials are invalid or expired")
                return None

            return None

        except Exception as e:
            print(f"❌ [Azure] Error in speech recognition: {e}")
            return None

    async def recognize_continuous(self, audio_stream, callback):
        """
        Recognize speech continuously from an audio stream.

        Args:
            audio_stream: Audio stream
            callback: Function to call with recognized text
        """
        try:
            audio_config = speechsdk.audio.AudioConfig(stream=audio_stream)

            recognizer = speechsdk.SpeechRecognizer(
                speech_config=self.speech_config,
                audio_config=audio_config
            )

            # Set up callbacks
            def recognized_cb(evt):
                if evt.result.reason == speechsdk.ResultReason.RecognizedSpeech:
                    asyncio.create_task(callback(evt.result.text))

            def canceled_cb(evt):
                print(f"Recognition canceled: {evt}")

            recognizer.recognized.connect(recognized_cb)
            recognizer.canceled.connect(canceled_cb)

            # Start continuous recognition
            recognizer.start_continuous_recognition()

            return recognizer

        except Exception as e:
            print(f"Error in continuous recognition: {e}")
            return None
