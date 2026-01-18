import { Difficulty, Question } from './types';

export const QUESTION_DURATION = 180; // 3 minutes
export const ANSWER_DURATION = 5; // 5 seconds

// Generate 15 questions: 10 Easy (5pts), 5 Hard (10pts)
export const QUESTIONS: Question[] = [
  ...Array.from({ length: 10 }).map((_, i) => ({
    id: i + 1,
    difficulty: Difficulty.EASY,
    points: 5,
    imageUrl: `https://picsum.photos/800/600?random=${i + 1}`,
  })),
  ...Array.from({ length: 5 }).map((_, i) => ({
    id: i + 11,
    difficulty: Difficulty.HARD,
    points: 10,
    imageUrl: `https://picsum.photos/800/600?random=${i + 11}`,
  })),
];

// Cadangan soal jika terjadi undo (5 soal)
export const BACKUP_QUESTIONS: Question[] = Array.from({ length: 5 }).map((_, i) => ({
  id: 100 + i + 1,
  difficulty: Difficulty.EASY,
  points: 5,
  imageUrl: `https://picsum.photos/800/600?random=${100 + i + 1}`,
}));

export const INITIAL_TEAMS_COUNT = 10;