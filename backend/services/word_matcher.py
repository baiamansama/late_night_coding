"""
Word Matching Service with lenient fuzzy matching for kids.
Prioritizes recognition over pronunciation accuracy.
"""

from typing import Tuple
import jellyfish
from fuzzywuzzy import fuzz
import Levenshtein
import re


class WordMatcher:
    def __init__(self, threshold: float = 0.70):
        """
        Initialize Word Matcher with lenient threshold.

        Args:
            threshold: Minimum similarity score (0.0 to 1.0) for a match.
                      Default 0.70 means 70% similarity = pass
        """
        self.threshold = threshold

        # Common children mispronunciations and variations
        self.common_variants = {
            'the': ['da', 'duh', 'thee'],
            'a': ['uh', 'ay'],
            'said': ['sed', 'sayed'],
            'because': ['becuz', 'cuz', 'cause'],
            'through': ['thru', 'threw'],
            'though': ['tho', 'dough'],
            'laugh': ['laf'],
            'enough': ['enuf'],
        }

    def match(self, expected: str, spoken: str) -> Tuple[bool, float]:
        """
        Determine if spoken word matches expected word using multiple algorithms.

        Args:
            expected: The word that should be read
            spoken: The word that was actually spoken

        Returns:
            Tuple of (is_match, confidence_score)
        """
        # Normalize words (lowercase, strip punctuation)
        expected_clean = self._normalize(expected)
        spoken_clean = self._normalize(spoken)

        # 1. Exact match
        if expected_clean == spoken_clean:
            return (True, 1.0)

        # 2. Check common variants
        if self._is_common_variant(expected_clean, spoken_clean):
            return (True, 0.95)

        # 3. Phonetic similarity (Soundex and Metaphone)
        phonetic_score = self._phonetic_similarity(expected_clean, spoken_clean)
        if phonetic_score >= 0.85:
            return (True, phonetic_score)

        # 4. Edit distance (Levenshtein)
        edit_distance_score = self._levenshtein_similarity(expected_clean, spoken_clean)

        # 5. Fuzzy string matching
        fuzzy_score = self._fuzzy_similarity(expected_clean, spoken_clean)

        # Take the maximum score from all algorithms
        final_score = max(phonetic_score, edit_distance_score, fuzzy_score)

        # Apply lenient threshold
        is_match = final_score >= self.threshold

        return (is_match, final_score)

    def _normalize(self, word: str) -> str:
        """
        Normalize word by removing punctuation and converting to lowercase.
        """
        # Remove punctuation
        word = re.sub(r'[^\w\s]', '', word)
        return word.lower().strip()

    def _is_common_variant(self, expected: str, spoken: str) -> bool:
        """
        Check if spoken word is a known common mispronunciation.
        """
        if expected in self.common_variants:
            return spoken in self.common_variants[expected]
        return False

    def _phonetic_similarity(self, word1: str, word2: str) -> float:
        """
        Calculate phonetic similarity using multiple algorithms.
        """
        # Soundex - good for American English pronunciation
        try:
            soundex1 = jellyfish.soundex(word1)
            soundex2 = jellyfish.soundex(word2)
            soundex_match = 1.0 if soundex1 == soundex2 else 0.0
        except:
            soundex_match = 0.0

        # Metaphone - another phonetic algorithm
        try:
            metaphone1 = jellyfish.metaphone(word1)
            metaphone2 = jellyfish.metaphone(word2)
            metaphone_match = 1.0 if metaphone1 == metaphone2 else 0.0
        except:
            metaphone_match = 0.0

        # Match Rating Codex - comprehensive phonetic matching
        try:
            match_rating = jellyfish.match_rating_comparison(word1, word2)
            match_rating_score = 1.0 if match_rating else 0.0
        except:
            match_rating_score = 0.0

        # Return average of all phonetic algorithms
        return (soundex_match + metaphone_match + match_rating_score) / 3.0

    def _levenshtein_similarity(self, word1: str, word2: str) -> float:
        """
        Calculate similarity based on Levenshtein edit distance.
        Returns a score between 0 and 1.
        """
        if not word1 or not word2:
            return 0.0

        # Calculate edit distance
        distance = Levenshtein.distance(word1, word2)

        # Normalize by length of longer word
        max_len = max(len(word1), len(word2))

        if max_len == 0:
            return 1.0

        # Convert distance to similarity score
        similarity = 1.0 - (distance / max_len)

        return max(0.0, similarity)

    def _fuzzy_similarity(self, word1: str, word2: str) -> float:
        """
        Calculate fuzzy string similarity using fuzzywuzzy.
        Returns a score between 0 and 1.
        """
        # Use token sort ratio for better matching of words with different orderings
        score = fuzz.ratio(word1, word2) / 100.0

        return score

    def calculate_passage_accuracy(self, expected_words: list, recognized_words: list) -> dict:
        """
        Calculate overall accuracy for an entire passage.

        Args:
            expected_words: List of words that should have been read
            recognized_words: List of words that were actually spoken

        Returns:
            Dictionary with accuracy metrics
        """
        total_words = len(expected_words)
        matched_words = 0
        confidence_scores = []

        for i, expected in enumerate(expected_words):
            if i < len(recognized_words):
                is_match, confidence = self.match(expected, recognized_words[i])
                if is_match:
                    matched_words += 1
                    confidence_scores.append(confidence)

        accuracy = (matched_words / total_words * 100) if total_words > 0 else 0
        avg_confidence = (sum(confidence_scores) / len(confidence_scores)) if confidence_scores else 0

        return {
            'total_words': total_words,
            'matched_words': matched_words,
            'accuracy_percentage': round(accuracy, 2),
            'average_confidence': round(avg_confidence, 2),
            'rating': self._get_rating(accuracy)
        }

    def _get_rating(self, accuracy: float) -> str:
        """
        Get encouraging rating based on accuracy.
        """
        if accuracy >= 90:
            return "⭐⭐⭐ Excellent!"
        elif accuracy >= 80:
            return "⭐⭐ Great job!"
        elif accuracy >= 70:
            return "⭐ Good effort!"
        else:
            return "Keep practicing! You're improving!"
