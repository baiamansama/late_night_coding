/**
 * Creative, age-appropriate encouraging messages for 11-13 year olds
 * Uses gaming language, humor, and personality
 */

export const MILESTONE_MESSAGES = {
  start: [
    "Story mode: ACTIVATED",
    "Your reading quest begins...",
    "Loading awesome... 99%... 100%",
    "Plot twist detector: ONLINE",
  ],
  quarter: [
    "25% cleared! The words didn't see that coming",
    "First checkpoint reached! Auto-save enabled",
    "Reading combo: x5! Chain activated",
    "Your brain just gained +25 XP",
    "Achievement unlocked: Quarter Master",
  ],
  half: [
    "HALFWAY BOSS DEFEATED! 50% complete",
    "Plot twist checkpoint! What happens next?",
    "Reading power level: OVER 9000!",
    "You're in the zone! Words demolished",
    "Midpoint reached. Second half loading...",
  ],
  threeQuarters: [
    "75% done! The ending is getting nervous",
    "Final boss approaching... You're ready!",
    "Speed boost activated! Turbo reading engaged",
    "Achievement incoming: Almost Legendary",
    "The words are running away! Chase them!",
  ],
  complete: [
    "VICTORY! Story conquered! Level up!",
    "100% COMPLETE! Achievement unlocked: Story Master",
    "YOU CRUSHED IT! Reading skills +100",
    "THE END... or is it? (Quiz incoming!)",
    "LEGENDARY! That story didn't stand a chance",
  ],
}

export const WORD_RECOGNITION_MESSAGES = [
  "Nailed it!",
  "Smooth!",
  "Clean read!",
  "Like a pro!",
  "Flawless!",
  "Boom!",
  "Slick!",
  "Crushed it!",
]

export const STREAK_MESSAGES = {
  3: "COMBO x3! You're heating up!",
  5: "5-WORD CHAIN! Electrifying!",
  10: "10-STREAK! Unstoppable reading force!",
  15: "15-COMBO! Diamond reading skills!",
  20: "20-STREAK! LEGENDARY STATUS ACHIEVED!",
  25: "25-WORD RAMPAGE! You're a reading BEAST!",
  30: "30-STREAK! THE WORDS FEAR YOU!",
}

export const QUIZ_MESSAGES = {
  correct: [
    "Brilliant thinking!",
    "You nailed it! 🎯",
    "Excellent choice!",
    "Spot on! 🌟",
    "High five! 🙌",
    "BIG BRAIN ENERGY!",
    "Correct! Your brain is flexing",
    "Nailed it! IQ +10",
    "CORRECT! You're too smart for this",
    "YES! Reading comprehension: LEGENDARY",
    "Boom! Your brain = supercomputer",
  ],
  encouragement: [
    "You're getting better every time!",
    "Keep going—you're learning fast!",
    "Great try! Let's tackle the next one!",
    "So close! You've got this!",
  ],
  complete: [
    "Quiz destroyed! Your brain is unstoppable!",
    "PERFECT! You didn't just read it, you OWNED it!",
    "Quiz conquered! Comprehension master!",
  ],
}

export const ACHIEVEMENT_MESSAGES = {
  firstStory: "FIRST VICTORY! Welcome to the reading squad!",
  perfectReading: "FLAWLESS! Not a single word escaped! PERFECT GAME!",
  speedReader: "SPEED DEMON! Your reading velocity = INSANE!",
  consistent: "3-DAY STREAK! You're building an empire of knowledge!",
  comprehension: "GALAXY BRAIN! You understood EVERYTHING!",
  fastFinish: "SPEED RUN COMPLETE! That was FAST!",
  nightReader: "NIGHT OWL! Late night reading sessions FTW!",
  earlyBird: "MORNING WARRIOR! Reading before sunrise? RESPECT!",
  weekendWarrior: "WEEKEND GRIND! No days off for you!",
  comebackKing: "COMEBACK! You came back and DOMINATED!",
}

// Fun power-up messages (random chance)
export const POWER_UP_MESSAGES = [
  "SPEED BOOST ACTIVATED!",
  "FOCUS MODE ENGAGED!",
  "READING RAGE UNLOCKED!",
  "TURBO MODE: ON!",
  "CONCENTRATION +50!",
  "BRAIN POWER DOUBLED!",
  "ACCURACY ENHANCED!",
  "SUPER READER MODE!",
]

// Fun stats that can be shown (gaming style)
export const STAT_MESSAGES = [
  "Reading Power: 9000+",
  "Comprehension: MAX LEVEL",
  "Speed: LEGENDARY",
  "Accuracy: 99.9%",
  "Brain Capacity: UNLIMITED",
  "Focus Level: DIAMOND TIER",
]

// Easter egg messages (rare, 5% chance)
export const EASTER_EGG_MESSAGES = [
  "Konami Code detected! Just kidding... or am I?",
  "RARE DROP! You found a unicorn message! (1 in 20 chance)",
  "Critical Hit! This message was super effective!",
  "Achievement: Found the secret message! 0.01% of readers see this!",
  "SHINY MESSAGE APPEARED! (Like a shiny Pokémon but for reading)",
  "You've unlocked: The Rare Message Collection!",
]

/**
 * Get a random message from an array
 */
export function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)]
}

/**
 * Get a power-up message (10% chance to show alongside regular messages)
 */
export function getPowerUpMessage(): string | null {
  if (Math.random() < 0.1) { // 10% chance
    return getRandomMessage(POWER_UP_MESSAGES)
  }
  return null
}

/**
 * Get an easter egg message (5% chance - rare!)
 */
export function getEasterEggMessage(): string | null {
  if (Math.random() < 0.05) { // 5% chance
    return getRandomMessage(EASTER_EGG_MESSAGES)
  }
  return null
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
