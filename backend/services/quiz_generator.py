"""
Quiz Generation Service using LLM APIs (OpenAI or Anthropic).
Generates age-appropriate comprehension questions for 11-13 year olds.
"""

from typing import List, Dict, Optional
import json
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic


class QuizGenerator:
    def __init__(self, openai_api_key: str = "", anthropic_api_key: str = ""):
        """
        Initialize Quiz Generator with API keys.

        Args:
            openai_api_key: OpenAI API key
            anthropic_api_key: Anthropic API key
        """
        self.openai_client = None
        self.anthropic_client = None

        if openai_api_key:
            self.openai_client = AsyncOpenAI(api_key=openai_api_key)

        if anthropic_api_key:
            self.anthropic_client = AsyncAnthropic(api_key=anthropic_api_key)

        if not self.openai_client and not self.anthropic_client:
            print("Warning: No LLM API keys provided. Quiz generation will not work.")

    async def generate_questions(
        self,
        text: str,
        num_questions: int = 5,
        age_group: str = "11-13"
    ) -> List[Dict]:
        """
        Generate comprehension questions for a given text.

        Args:
            text: The reading passage
            num_questions: Number of questions to generate
            age_group: Target age group (default: "11-13")

        Returns:
            List of question dictionaries with format:
            {
                "question": str,
                "options": [str, str, str, str],
                "correct_answer": int (0-3),
                "explanation": str
            }
        """
        # Try OpenAI first (GPT-4o), fall back to Anthropic
        if self.openai_client:
            return await self._generate_with_openai(text, num_questions, age_group)
        elif self.anthropic_client:
            return await self._generate_with_anthropic(text, num_questions, age_group)
        else:
            raise ValueError("No LLM API client available")

    async def _generate_with_openai(
        self,
        text: str,
        num_questions: int,
        age_group: str
    ) -> List[Dict]:
        """
        Generate questions using OpenAI GPT-4o.
        """
        system_prompt = f"""You are an educational content creator specializing in reading comprehension for children aged {age_group}.
Generate {num_questions} multiple-choice questions that test understanding of the given text.

Requirements:
- Questions should be appropriate for {age_group} year olds
- Mix of literal comprehension and inferential questions
- 4 answer options per question (A, B, C, D)
- Only one correct answer
- Distractors should be plausible but clearly incorrect
- Use clear, simple language
- Include a brief explanation for the correct answer

Return the response as a JSON array with this exact structure:
[
  {{
    "question": "What is the main idea of the story?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Brief explanation of why this is correct"
  }}
]"""

        user_prompt = f"""Text to analyze:
{text}

Generate {num_questions} comprehension questions."""

        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7
            )

            content = response.choices[0].message.content

            # Parse JSON response
            try:
                result = json.loads(content)
                # Handle both array and object with 'questions' key
                if isinstance(result, list):
                    questions = result
                elif isinstance(result, dict) and 'questions' in result:
                    questions = result['questions']
                else:
                    # Try to extract questions from nested structure
                    questions = list(result.values())[0] if result else []

                return questions[:num_questions]

            except json.JSONDecodeError:
                print(f"Error parsing JSON from OpenAI: {content}")
                return []

        except Exception as e:
            print(f"Error generating questions with OpenAI: {e}")
            return []

    async def _generate_with_anthropic(
        self,
        text: str,
        num_questions: int,
        age_group: str
    ) -> List[Dict]:
        """
        Generate questions using Anthropic Claude.
        """
        prompt = f"""You are an educational content creator specializing in reading comprehension for children aged {age_group}.

Text:
{text}

Generate {num_questions} multiple-choice questions that test understanding of this text.

Requirements:
- Questions appropriate for {age_group} year olds
- Mix of literal comprehension and inferential questions
- 4 answer options per question
- Only one correct answer
- Plausible but clearly incorrect distractors
- Clear, simple language
- Brief explanation for correct answer

Return ONLY a valid JSON array with this structure:
[
  {{
    "question": "What is the main idea?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Brief explanation"
  }}
]"""

        try:
            response = await self.anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                temperature=0.7,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            content = response.content[0].text

            # Extract JSON from response (Claude might wrap it in text)
            json_start = content.find('[')
            json_end = content.rfind(']') + 1

            if json_start != -1 and json_end != 0:
                json_str = content[json_start:json_end]
                questions = json.loads(json_str)
                return questions[:num_questions]
            else:
                print(f"Could not find JSON in Claude response: {content}")
                return []

        except Exception as e:
            print(f"Error generating questions with Anthropic: {e}")
            return []

    def validate_questions(self, questions: List[Dict]) -> bool:
        """
        Validate that questions have the correct structure.
        """
        required_keys = ['question', 'options', 'correct_answer']

        for q in questions:
            # Check required keys
            if not all(key in q for key in required_keys):
                return False

            # Check options is a list of 4 items
            if not isinstance(q['options'], list) or len(q['options']) != 4:
                return False

            # Check correct_answer is valid index
            if not isinstance(q['correct_answer'], int) or q['correct_answer'] not in [0, 1, 2, 3]:
                return False

        return True
