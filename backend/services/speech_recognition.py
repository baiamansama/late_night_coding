"""
Speech Recognition Service using Azure Speech Services.
Configured for children's voices with lenient recognition.
"""

import azure.cognitiveservices.speech as speechsdk
from typing import Optional
import asyncio
import io


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

        # Configure for better children's voice recognition
        # Enable continuous recognition
        self.speech_config.set_property(
            speechsdk.PropertyId.Speech_SegmentationSilenceTimeoutMs,
            "500"  # Shorter silence timeout for kids
        )

    async def recognize_from_buffer(self, audio_data: bytes) -> Optional[str]:
        """
        Recognize speech from audio buffer (supports WebM format via GStreamer).

        Args:
            audio_data: Audio data (WebM, WAV, or raw PCM)

        Returns:
            Recognized text or None
        """
        print(f"🎙️ [Azure] Processing audio buffer of {len(audio_data)} bytes")
        try:
            # Use compressed stream format to handle WebM from browser
            # This tells Azure to use GStreamer to decode WebM to PCM
            audio_format = speechsdk.audio.AudioStreamFormat(
                compressed_stream_format=speechsdk.AudioStreamContainerFormat.ANY
            )

            # Create push stream with compressed format support
            push_stream = speechsdk.audio.PushAudioInputStream(audio_format)
            push_stream.write(audio_data)
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
