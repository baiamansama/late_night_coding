/**
 * Encouraging messages for kids aged 11-13
 * Focuses on mastery, progress, and effort (not just completion)
 */

export const MILESTONE_MESSAGES = {
  start: [
    "Let's go! You've got this! 📚",
    "Ready to read? Let's do this! 🌟",
    "Time to shine! Start reading! ✨",
  ],
  quarter: [
    "Great start! Keep going! 🚀",
    "You're doing awesome! 💪",
    "Nice progress! Keep it up! ⭐",
    "You're on fire! 🔥",
  ],
  half: [
    "Halfway there! You're crushing it! 🎯",
    "Amazing! You're doing so well! 🌟",
    "Halfway done! Keep up the great work! 💫",
    "Wow! You're halfway through! 🎉",
  ],
  threeQuarters: [
    "Almost there! You're so close! 🏆",
    "Nearly done! You've got this! ⭐",
    "Just a little more! Keep going! 💪",
    "So close! Finish strong! 🚀",
  ],
  complete: [
    "You did it! Amazing job! 🎉",
    "Fantastic! You finished! 🌟",
    "Incredible work! You're a star! ⭐",
    "Perfect! You crushed it! 🏆",
  ],
}

export const WORD_RECOGNITION_MESSAGES = [
  "Perfect! ✓",
  "Great! ✓",
  "Nice! ✓",
  "Excellent! ✓",
  "Well done! ✓",
  "Awesome! ✓",
]

export const STREAK_MESSAGES = {
  3: "3 words in a row! You're on fire! 🔥",
  5: "5 in a row! Incredible! ⭐",
  10: "10 words straight! Unstoppable! 🚀",
  20: "20 words! You're a reading champion! 🏆",
}

export const QUIZ_MESSAGES = {
  correct: [
    "That's right! 🎯",
    "Excellent thinking! 🧠",
    "You got it! ⭐",
    "Perfect answer! ✓",
    "Great job! 💡",
  ],
  complete: [
    "Quiz complete! Way to go! 🎉",
    "You finished! Awesome work! 🌟",
    "All done! Great effort! 💪",
  ],
}

export const ACHIEVEMENT_MESSAGES = {
  firstStory: "First story completed! You're a reader! 📚",
  perfectReading: "Perfect reading! Every word correct! 🏆",
  speedReader: "You're getting faster! Keep it up! 🚀",
  consistent: "3 days in a row! Building great habits! ⭐",
  comprehension: "Great comprehension! You really understood! 🧠",
}

/**
 * Get a random message from an array
 */
export function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)]
}

/**
 * Get milestone message based on progress percentage
 */
export function getMilestoneMessage(progress: number): string | null {
  if (progress === 0) {
    return getRandomMessage(MILESTONE_MESSAGES.start)
  } else if (progress >= 25 && progress < 26) {
    return getRandomMessage(MILESTONE_MESSAGES.quarter)
  } else if (progress >= 50 && progress < 51) {
    return getRandomMessage(MILESTONE_MESSAGES.half)
  } else if (progress >= 75 && progress < 76) {
    return getRandomMessage(MILESTONE_MESSAGES.threeQuarters)
  } else if (progress >= 100) {
    return getRandomMessage(MILESTONE_MESSAGES.complete)
  }
  return null
}

/**
 * Get streak message based on word count
 */
export function getStreakMessage(correctCount: number): string | null {
  if (correctCount in STREAK_MESSAGES) {
    return STREAK_MESSAGES[correctCount as keyof typeof STREAK_MESSAGES]
  }
  return null
}

/**
 * Get encouraging message for word recognition
 * Uses variable reinforcement (not every word)
 */
export function getWordMessage(correctCount: number): string | null {
  // Show message every 5 words (variable reinforcement)
  if (correctCount > 0 && correctCount % 5 === 0) {
    return getRandomMessage(WORD_RECOGNITION_MESSAGES)
  }
  return null
}
