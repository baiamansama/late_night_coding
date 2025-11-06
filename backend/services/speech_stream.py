from __future__ import annotations
import asyncio
import logging
from typing import Awaitable, Callable, Optional
import azure.cognitiveservices.speech as speechsdk

logger = logging.getLogger(__name__)

PartialCb = Callable[[str], Awaitable[None]]
FinalCb = Callable[[str], Awaitable[None]]

class AzureStreamingSession:
    """Continuous Azure STT on a PushAudioInputStream (expects raw PCM16 mono 16k)."""

    def __init__(
        self,
        speech_key: str,
        region: str,
        *,
        language: str = "en-US",
        loop: Optional[asyncio.AbstractEventLoop] = None,
        on_partial: Optional[PartialCb] = None,
        on_final: Optional[FinalCb] = None,
    ) -> None:
        if not speech_key or not region:
            raise ValueError("Azure Speech credentials required")

        self.loop = loop or asyncio.get_event_loop()
        self._on_partial = on_partial
        self._on_final = on_final

        cfg = speechsdk.SpeechConfig(subscription=speech_key, region=region)
        cfg.speech_recognition_language = language
        # Gentle segmentation that works well for kids' cadence
        cfg.set_property(speechsdk.PropertyId.Speech_SegmentationSilenceTimeoutMs, "650")
        cfg.set_property(speechsdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "2000")

        fmt = speechsdk.audio.AudioStreamFormat(samples_per_second=16000, bits_per_sample=16, channels=1)
        self.push_stream = speechsdk.audio.PushAudioInputStream(fmt)
        audio = speechsdk.audio.AudioConfig(stream=self.push_stream)
        self.recognizer = speechsdk.SpeechRecognizer(speech_config=cfg, audio_config=audio)

        def recognizing_cb(evt):
            if self._on_partial and evt.result:
                text = (evt.result.text or "").strip()
                if text:
                    asyncio.run_coroutine_threadsafe(self._on_partial(text), self.loop)

        def recognized_cb(evt):
            if self._on_final and evt.result and evt.result.reason == speechsdk.ResultReason.RecognizedSpeech:
                text = (evt.result.text or "").strip()
                if text:
                    asyncio.run_coroutine_threadsafe(self._on_final(text), self.loop)

        self.recognizer.recognizing.connect(recognizing_cb)
        self.recognizer.recognized.connect(recognized_cb)
        self.recognizer.start_continuous_recognition()
        logger.info("AzureStreamingSession started")

    def push_pcm16(self, pcm_bytes: bytes) -> None:
        if pcm_bytes:
            self.push_stream.write(pcm_bytes)

    def stop(self) -> None:
        try:
            self.push_stream.close()
        finally:
            try:
                self.recognizer.stop_continuous_recognition()
            finally:
                pass
