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
        Recognize speech from audio buffer.

        Args:
            audio_data: Raw audio data (16kHz, 16-bit, mono)

        Returns:
            Recognized text or None
        """
        try:
            # Create audio stream from buffer
            audio_format = speechsdk.audio.AudioStreamFormat(
                samples_per_second=16000,
                bits_per_sample=16,
                channels=1
            )

            # Create push stream
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
                return result.text.strip()
            elif result.reason == speechsdk.ResultReason.NoMatch:
                print(f"No speech recognized: {result.no_match_details}")
                return None
            elif result.reason == speechsdk.ResultReason.Canceled:
                cancellation = result.cancellation_details
                print(f"Recognition canceled: {cancellation.reason}")
                if cancellation.reason == speechsdk.CancellationReason.Error:
                    print(f"Error details: {cancellation.error_details}")
                return None

            return None

        except Exception as e:
            print(f"Error in speech recognition: {e}")
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
