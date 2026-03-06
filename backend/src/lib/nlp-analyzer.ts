/**
 * Simple NLP-based task analyzer using keyword/heuristic rules
 * Extracts estimated duration and difficulty from task title and description
 */

interface TaskAnalysis {
  estimatedDuration: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

// Duration estimation patterns (in minutes)
const durationPatterns = [
  { pattern: /(\d+)\s*(?:hours?|hrs?)/i, multiplier: 60 },
  { pattern: /(\d+)\s*(?:minutes?|mins?)/i, multiplier: 1 },
  { pattern: /(\d+)\s*(?:days?)/i, multiplier: 480 }, // 8-hour work day
];

// Difficulty level indicators
const difficultyKeywords = {
  easy: [
    'simple',
    'easy',
    'basic',
    'quick',
    'trivial',
    'straightforward',
    'routine',
    'minor',
  ],
  hard: [
    'complex',
    'difficult',
    'challenging',
    'research',
    'investigation',
    'design',
    'architect',
    'optimize',
    'refactor',
    'debug',
    'critical',
    'major',
    'implement',
    'build',
  ],
  medium: ['moderate', 'intermediate', 'standard', 'regular'],
};

// Category classification
const categoryKeywords: Record<string, string[]> = {
  work: ['work', 'project', 'meeting', 'deadline', 'deliverable', 'report'],
  personal: ['personal', 'home', 'family', 'errands', 'shopping'],
  learning: ['learn', 'study', 'course', 'tutorial', 'documentation', 'research'],
  health: ['exercise', 'workout', 'gym', 'doctor', 'health', 'meditation'],
  social: ['meet', 'call', 'chat', 'hangout', 'friend', 'family'],
};

/**
 * Extract time duration from text
 */
function extractDuration(text: string): number {
  const lowerText = text.toLowerCase();

  for (const { pattern, multiplier } of durationPatterns) {
    const match = lowerText.match(pattern);
    if (match && match[1]) {
      const amount = parseInt(match[1], 10);
      if (!isNaN(amount)) {
        return Math.max(5, Math.min(480, amount * multiplier)); // 5 min - 8 hours
      }
    }
  }

  // Default estimation based on text length
  const wordCount = text.split(/\s+/).length;
  if (wordCount < 5) return 15;
  if (wordCount < 20) return 30;
  if (wordCount < 50) return 60;
  return 120;
}

/**
 * Determine difficulty level from keywords
 */
function extractDifficulty(text: string): 'easy' | 'medium' | 'hard' {
  const lowerText = text.toLowerCase();

  let hardScore = 0;
  let easyScore = 0;
  let mediumScore = 0;

  // Count keyword matches
  for (const keyword of difficultyKeywords.hard) {
    if (lowerText.includes(keyword)) hardScore++;
  }

  for (const keyword of difficultyKeywords.easy) {
    if (lowerText.includes(keyword)) easyScore++;
  }

  for (const keyword of difficultyKeywords.medium) {
    if (lowerText.includes(keyword)) mediumScore++;
  }

  if (hardScore > easyScore && hardScore > mediumScore) return 'hard';
  if (easyScore > hardScore && easyScore > mediumScore) return 'easy';
  if (mediumScore > hardScore && mediumScore > easyScore) return 'medium';

  return 'medium'; // default
}

/**
 * Classify task category from keywords
 */
function extractCategory(text: string): string {
  const lowerText = text.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return category;
      }
    }
  }

  return 'general';
}

/**
 * Analyze task to extract metadata
 */
export function analyzeTask(title: string, description: string = ''): TaskAnalysis {
  const fullText = `${title} ${description}`;

  return {
    estimatedDuration: extractDuration(fullText),
    difficulty: extractDifficulty(fullText),
    category: extractCategory(fullText),
  };
}
