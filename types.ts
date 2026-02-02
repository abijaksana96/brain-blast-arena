export enum GamePhase {
  SETUP = 'SETUP',
  BRIEFING = 'BRIEFING', // Pre-round briefing slides
  INTRO = 'INTRO',
  QUESTION_DISPLAY = 'QUESTION_DISPLAY', // 3 minutes timer
  TEAM_ANSWERING = 'TEAM_ANSWERING', // 5 seconds timer
  FEEDBACK = 'FEEDBACK', // Result shown briefly
  GAME_FINISHED = 'GAME_FINISHED', // Game finished screen before leaderboard
  ROUND_OVER = 'ROUND_OVER',
}

export enum Difficulty {
  EASY = 'MUDAH',
  HARD = 'SULIT',
}

export interface Question {
  id: number;
  difficulty: Difficulty;
  points: number;
  imageUrl: string;
  correctAnswer?: string; // Optional for this demo
}

export interface Team {
  id: string;
  name: string;
  initialScore: number; // From previous round (Five Trials)
  roundScore: number; // Score earned in this round
  totalScore: number; // Combined score
  isEliminated?: boolean; // For visual cues if needed
}

export interface GameState {
  phase: GamePhase;
  currentQuestionIndex: number;
  activeTeamId: string | null;
  mainTimer: number; // Seconds (180s)
  answerTimer: number; // Seconds (5s)
}