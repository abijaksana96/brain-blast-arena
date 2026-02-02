import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GamePhase, Team, Difficulty, GameState, Question } from './types';
import { QUESTIONS as DEFAULT_QUESTIONS, BACKUP_QUESTIONS, QUESTION_DURATION, ANSWER_DURATION, INITIAL_TEAMS_COUNT } from './constants';
import { Button } from './components/Button';
import { Timer } from './components/Timer';
import { Leaderboard } from './components/Leaderboard';
import { BriefingSlides } from './components/BriefingSlides';
import { GameFinished } from './components/GameFinished';
import { Play, CheckCircle, XCircle, BrainCircuit, Users, SkipForward, TimerOff, Upload, FolderOpen, Image, Trash2, Shuffle } from 'lucide-react';

// Utility to shuffle array (Fisher-Yates algorithm)
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const App: React.FC = () => {
  // --- STATE ---
  const [teams, setTeams] = useState<Team[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.SETUP,
    currentQuestionIndex: 0,
    activeTeamId: null,
    mainTimer: QUESTION_DURATION,
    answerTimer: ANSWER_DURATION,
  });
  const [lastAnswerStatus, setLastAnswerStatus] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [lastScoreChange, setLastScoreChange] = useState<null | {
    teamId: string;
    prevRoundScore: number;
    prevTotalScore: number;
    delta: number;
  }>(null);
  const [backupQuestionIndex, setBackupQuestionIndex] = useState(0);
  const [useBackupQuestion, setUseBackupQuestion] = useState(false);
  const [countdownOverlay, setCountdownOverlay] = useState<number | null>(null);

  // Refs for intervals to clear them properly
  const mainTimerRef = useRef<number | null>(null);
  const answerTimerRef = useRef<number | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastBeepRef = useRef<number | null>(null);
  const lastBoomRef = useRef<boolean>(false);
  const bgVolumeRef = useRef<number | null>(null);

  // --- SLIDE AUDIO CONTROL ---
  const slideAudioStopperRef = useRef<null | (() => void)>(null);
  const QUESTIONS = questions.length > 0 ? questions : DEFAULT_QUESTIONS;
  const fallbackQuestion = QUESTIONS[gameState.currentQuestionIndex];
  const backupQuestion = BACKUP_QUESTIONS[backupQuestionIndex];
  const currentQuestion = useBackupQuestion && backupQuestion ? backupQuestion : fallbackQuestion;

  // --- INITIALIZATION ---
  const handleSetupComplete = (setupTeams: Team[], uploadedQuestions: Question[]) => {
    setTeams(setupTeams);
    // Shuffle questions when starting the game
    const shuffledQuestions = shuffleArray(uploadedQuestions.length > 0 ? uploadedQuestions : DEFAULT_QUESTIONS);
    setQuestions(shuffledQuestions);
    setGameState(prev => ({ ...prev, phase: GamePhase.BRIEFING }));
  };

  const handleBriefingComplete = () => {
    // Stop slide audio if still playing
    if (slideAudioStopperRef.current) slideAudioStopperRef.current();
    setGameState(prev => ({ ...prev, phase: GamePhase.INTRO }));
  };

  // --- GAME LOOP LOGIC ---

  const stopQuestionAudio = () => {
    // Background music disabled - only sound effects remain
    return;
  };

  const startQuestionAudio = (forceRestart: boolean = false) => {
    // Background music disabled - only sound effects remain
    return;
  };

  // Initialize AudioContext immediately to avoid browser autoplay policy
  const initAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => { });
    }
  };

  const playCountdownBeep = (count: number) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => { });
    }
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Higher pitch for "GO!", lower for countdown numbers
    const freq = count === 0 ? 880 : 440;
    const duration = count === 0 ? 0.4 : 0.15;

    osc.type = count === 0 ? 'square' : 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.9, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  };

  const runCountdownOverlay = (onComplete: () => void) => {
    setCountdownOverlay(3);
    playCountdownBeep(3);

    setTimeout(() => {
      setCountdownOverlay(2);
      playCountdownBeep(2);
    }, 1000);

    setTimeout(() => {
      setCountdownOverlay(1);
      playCountdownBeep(1);
    }, 2000);

    setTimeout(() => {
      setCountdownOverlay(0); // Show "GO!"
      playCountdownBeep(0);
    }, 3000);

    setTimeout(() => {
      setCountdownOverlay(null);
      onComplete();
    }, 3500);
  };

  // Play breaking-news effect using a transient Audio instance
  // NOTE: breaking-news sound removed to avoid replaying briefing audio here.

  const startRound = () => {
    // Initialize audio context early to allow beep sounds
    initAudioContext();

    // Stop slide audio if still playing (avoid overlap)
    if (slideAudioStopperRef.current) slideAudioStopperRef.current();
    // play dramatic breaking-news effect before countdown (removed - briefing audio must not restart)
    setLastAnswerStatus(null);
    setLastScoreChange(null);
    setUseBackupQuestion(false);

    runCountdownOverlay(() => {
      startQuestionAudio(true);
      setGameState(prev => ({ ...prev, phase: GamePhase.QUESTION_DISPLAY, mainTimer: QUESTION_DURATION }));
    });
  };

  const nextQuestion = useCallback(() => {
    if (gameState.currentQuestionIndex >= QUESTIONS.length - 1) {
      setGameState(prev => ({ ...prev, phase: GamePhase.GAME_FINISHED }));
      return;
    }

    // Initialize audio context early to allow beep sounds
    initAudioContext();

    setLastAnswerStatus(null);
    setLastScoreChange(null);
    setUseBackupQuestion(false);

    runCountdownOverlay(() => {
      setGameState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        phase: GamePhase.QUESTION_DISPLAY,
        mainTimer: QUESTION_DURATION,
        answerTimer: ANSWER_DURATION,
        activeTeamId: null,
      }));
    });
  }, [gameState.currentQuestionIndex]);

  const playFeedbackSound = (status: 'correct' | 'wrong' | 'timeout') => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => { });
    }
    const now = ctx.currentTime;

    if (status === 'correct') {
      // Victory fanfare - ascending arpeggio (LOUDER)
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.0001, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(1.5, now + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.35);
      });
      // Final chord
      const chordFreqs = [523.25, 659.25, 783.99];
      chordFreqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + 0.5);
        gain.gain.setValueAtTime(0.0001, now + 0.5);
        gain.gain.exponentialRampToValueAtTime(1.4, now + 0.52);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + 0.5);
        osc.stop(now + 1.3);
      });
    } else if (status === 'wrong') {
      // Buzzer sound - harsh descending (LOUDER)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(200, now);
      osc1.frequency.exponentialRampToValueAtTime(80, now + 0.5);
      osc2.frequency.setValueAtTime(205, now);
      osc2.frequency.exponentialRampToValueAtTime(75, now + 0.5);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(1.5, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.65);
      osc2.stop(now + 0.65);
    } else {
      // Timeout - descending womp womp (LOUDER)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
      osc.frequency.setValueAtTime(350, now + 0.4);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.8);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(1.5, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(1.0, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(1.2, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1);
    }
  };

  const enterFeedback = (status: 'correct' | 'wrong' | 'timeout') => {
    setLastAnswerStatus(status);
    playFeedbackSound(status);
    setGameState(prev => ({ ...prev, phase: GamePhase.FEEDBACK }));
  };

  const handleUndoLastChange = () => {
    if (!lastScoreChange) return;
    const hasBackup = backupQuestionIndex < BACKUP_QUESTIONS.length;
    setTeams(prevTeams => prevTeams.map(team => {
      if (team.id === lastScoreChange.teamId) {
        return {
          ...team,
          roundScore: lastScoreChange.prevRoundScore,
          totalScore: lastScoreChange.prevTotalScore,
        };
      }
      return team;
    }));
    setLastAnswerStatus(null);
    setGameState(prev => ({
      ...prev,
      phase: GamePhase.QUESTION_DISPLAY,
      activeTeamId: null,
      mainTimer: QUESTION_DURATION,
      answerTimer: ANSWER_DURATION,
    }));
    setUseBackupQuestion(hasBackup);
    if (hasBackup) {
      setBackupQuestionIndex(prev => prev + 1);
    }
    setLastScoreChange(null);
  };

  // --- TIMER LOGIC ---

  // Main Question Timer (3 Minutes)
  useEffect(() => {
    if (gameState.phase === GamePhase.QUESTION_DISPLAY) {
      mainTimerRef.current = window.setInterval(() => {
        setGameState(prev => {
          if (prev.mainTimer <= 0) {
            // Time ran out, question burns
            if (mainTimerRef.current) clearInterval(mainTimerRef.current);
            enterFeedback('timeout');
            return prev;
          }
          return { ...prev, mainTimer: prev.mainTimer - 1 };
        });
      }, 1000);
    } else {
      if (mainTimerRef.current) clearInterval(mainTimerRef.current);
    }
    return () => { if (mainTimerRef.current) clearInterval(mainTimerRef.current); };
  }, [gameState.phase]);

  // Answer Timer (5 Seconds)
  useEffect(() => {
    if (gameState.phase === GamePhase.TEAM_ANSWERING) {
      answerTimerRef.current = window.setInterval(() => {
        setGameState(prev => {
          if (prev.answerTimer <= 0) {
            if (answerTimerRef.current) clearInterval(answerTimerRef.current);
            // Timeout - Wait for manual action
            return prev;
          }
          return { ...prev, answerTimer: prev.answerTimer - 1 };
        });
      }, 1000);
    } else {
      if (answerTimerRef.current) clearInterval(answerTimerRef.current);
    }
    return () => { if (answerTimerRef.current) clearInterval(answerTimerRef.current); };
  }, [gameState.phase]); // Dependency handled via internal logic calling handleAnswerVerdict

  // Duck background audio volume during TEAM_ANSWERING (disabled - no background music)
  useEffect(() => {
    // Background music disabled - no volume ducking needed
    return;
  }, [gameState.phase]);

  // Beep countdown during TEAM_ANSWERING
  useEffect(() => {
    if (gameState.phase !== GamePhase.TEAM_ANSWERING) {
      lastBeepRef.current = null;
      lastBoomRef.current = false;
      return;
    }

    const current = gameState.answerTimer;
    if (current <= 0 || lastBeepRef.current === current) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
    }

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => { });
    }

    const now = ctx.currentTime;

    if (current <= 3 && current >= 1) {
      lastBeepRef.current = current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.95, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }, [gameState.answerTimer, gameState.phase]);

  // Stop audio when game finishes
  useEffect(() => {
    if (gameState.phase === GamePhase.GAME_FINISHED) {
      stopQuestionAudio();
    }
  }, [gameState.phase]);

  // No boom sound - removed per user request

  // --- ACTIONS ---

  const handleTeamBuzz = (teamId: string) => {
    // Only allow buzz during Question Display
    if (gameState.phase !== GamePhase.QUESTION_DISPLAY && gameState.phase !== GamePhase.TEAM_ANSWERING) return;

    setGameState(prev => ({
      ...prev,
      phase: GamePhase.TEAM_ANSWERING,
      activeTeamId: teamId,
      answerTimer: prev.activeTeamId === teamId ? prev.answerTimer : ANSWER_DURATION // Reset only when switching team
    }));
  };

  const handleAnswerVerdict = (isCorrect: boolean, isTimeout: boolean = false) => {
    // Determine point change
    const points = currentQuestion.points;
    const teamId = gameState.activeTeamId;

    if (!teamId) return; // Safety check

    setTeams(prevTeams => prevTeams.map(team => {
      if (team.id === teamId) {
        const pointChange = isCorrect ? points : -points;
        const nextRoundScore = team.roundScore + pointChange;
        const nextTotalScore = team.initialScore + nextRoundScore;
        setLastScoreChange({
          teamId,
          prevRoundScore: team.roundScore,
          prevTotalScore: team.totalScore,
          delta: pointChange,
        });
        return {
          ...team,
          roundScore: nextRoundScore,
          totalScore: nextTotalScore
        };
      }
      return team;
    }));

    // Logic: 
    // Correct -> Points -> Next Question
    // Wrong/Timeout -> Minus Points -> Burn Question -> Next Question
    // In both cases, we move to next question (per rule 7: "soal langsung hangus")

    // Show result and wait for manual continue
    if (isTimeout) {
      enterFeedback('timeout');
    } else {
      enterFeedback(isCorrect ? 'correct' : 'wrong');
    }
  };

  const handleSkip = () => {
    enterFeedback('timeout');
  };

  // --- KEYBOARD LISTENER ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setGameState(prev => ({
          ...prev,
          phase: GamePhase.ROUND_OVER,
          activeTeamId: null,
        }));
        return;
      }
      if ((e.key === 'l' || e.key === 'L') && gameState.phase === GamePhase.FEEDBACK) {
        nextQuestion();
        return;
      }
      if ((e.key === 'u' || e.key === 'U') && gameState.phase === GamePhase.FEEDBACK && lastScoreChange) {
        handleUndoLastChange();
        return;
      }
      if ((e.key === 'q' || e.key === 'Q') && gameState.phase === GamePhase.INTRO) {
        startRound();
        return;
      }
      if (gameState.phase === GamePhase.TEAM_ANSWERING) {
        if (e.key === 'b' || e.key === 'B') {
          handleAnswerVerdict(true);
          return;
        }
        if (e.key === 's' || e.key === 'S') {
          handleAnswerVerdict(false);
          return;
        }
        if (e.key === 't' || e.key === 'T') {
          handleAnswerVerdict(false, true);
          return;
        }
      }
      // Only allow buzz during QUESTION_DISPLAY or TEAM_ANSWERING
      if (gameState.phase !== GamePhase.QUESTION_DISPLAY && gameState.phase !== GamePhase.TEAM_ANSWERING) return;

      const key = e.key;
      let teamIndex = -1;

      if (key >= '1' && key <= '9') {
        teamIndex = parseInt(key) - 1;
      } else if (key === '0') {
        teamIndex = 9;
      }

      if (teamIndex !== -1 && teamIndex < teams.length) {
        handleTeamBuzz(teams[teamIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.phase, teams]);

  // --- AUDIO INIT ---
  useEffect(() => {
    bgAudioRef.current = document.getElementById('bg-audio') as HTMLAudioElement | null;
  }, []);

  // --- RENDER HELPERS ---

  if (gameState.phase === GamePhase.SETUP) {
    return <SetupScreen onComplete={handleSetupComplete} />;
  }

  if (gameState.phase === GamePhase.BRIEFING) {
    return <BriefingSlides onComplete={handleBriefingComplete} onStopAudioRef={fn => { slideAudioStopperRef.current = fn; }} />;
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden">

      {/* Countdown Overlay */}
      {countdownOverlay !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-sm">
          <div className="relative">
            {/* Animated rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`absolute w-64 h-64 lg:w-96 lg:h-96 rounded-full border-4 animate-ping ${countdownOverlay === 0 ? 'border-green-500/50' : 'border-blue-500/50'
                }`} style={{ animationDuration: '1s' }} />
              <div className={`absolute w-48 h-48 lg:w-72 lg:h-72 rounded-full border-2 animate-ping ${countdownOverlay === 0 ? 'border-green-400/30' : 'border-blue-400/30'
                }`} style={{ animationDuration: '0.8s', animationDelay: '0.2s' }} />
            </div>

            {/* Number/GO display */}
            <div className={`relative z-10 w-40 h-40 lg:w-56 lg:h-56 rounded-full flex items-center justify-center ${countdownOverlay === 0
              ? 'bg-gradient-to-br from-green-600 to-emerald-700 shadow-[0_0_60px_rgba(34,197,94,0.5)]'
              : 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-[0_0_60px_rgba(59,130,246,0.5)]'
              }`}>
              <span className={`font-display font-black text-white ${countdownOverlay === 0 ? 'text-5xl lg:text-7xl' : 'text-7xl lg:text-9xl'
                }`} style={{ textShadow: '0 0 30px rgba(255,255,255,0.5)' }}>
                {countdownOverlay === 0 ? 'GO!' : countdownOverlay}
              </span>
            </div>

            {/* Label */}
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center">
              <span className="text-slate-400 font-display text-sm lg:text-lg tracking-widest uppercase">
                {countdownOverlay === 0 ? 'Mulai!' : 'Bersiap...'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* LEFT (Desktop) / TOP (Mobile): Game Board */}
      <div className="flex-1 flex flex-col relative w-full min-h-0 overflow-hidden">

        {/* Header Bar - Hide during fullscreen phases */}
        {gameState.phase !== GamePhase.GAME_FINISHED && gameState.phase !== GamePhase.ROUND_OVER && (
          <div className="h-14 lg:h-16 flex-none border-b border-slate-800 bg-slate-900/80 flex items-center justify-between px-4 lg:px-6 backdrop-blur-sm z-20">
            <div className="flex items-center gap-2 lg:gap-3">
              <BrainCircuit className="text-blue-500 w-5 h-5 lg:w-7 lg:h-7" />
              <h1 className="font-display font-bold text-base lg:text-lg tracking-wider text-white">BRAIN BLAST</h1>
            </div>

            <div className="flex items-center gap-3 lg:gap-5">
              <div className="flex flex-col items-end">
                <span className="text-[8px] lg:text-[10px] uppercase text-slate-500 font-bold tracking-widest">Soal</span>
                <span className="font-display font-bold text-sm lg:text-lg leading-none">
                  {gameState.currentQuestionIndex + 1} <span className="text-slate-600 text-xs">/ {QUESTIONS.length}</span>
                </span>
              </div>
              <div className="h-5 lg:h-7 w-[1px] bg-slate-700"></div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] lg:text-[10px] uppercase text-slate-500 font-bold tracking-widest">Tipe</span>
                <span className={`font-display font-bold text-sm lg:text-base leading-none ${currentQuestion.difficulty === Difficulty.HARD ? 'text-red-400' : 'text-green-400'}`}>
                  {currentQuestion.difficulty}
                </span>
              </div>
              <div className="h-5 lg:h-7 w-[1px] bg-slate-700"></div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] lg:text-[10px] uppercase text-slate-500 font-bold tracking-widest">Poin</span>
                <span className="font-display font-bold text-base lg:text-lg text-yellow-400 leading-none">{currentQuestion.points}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-1 lg:p-2 items-center justify-center relative min-h-0 overflow-hidden">

          {/* Background Grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>

          {gameState.phase === GamePhase.INTRO && (
            <div className="text-center z-10 space-y-8 animate-fade-in w-full max-w-2xl px-4">
              <h2 className="text-3xl lg:text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 pb-2">
                SIAP UNTUK LEDAKAN OTAK?
              </h2>
              <div className="text-sm lg:text-base text-slate-400 space-y-2 bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                <p>• 15 Soal (10 Mudah, 5 Sulit)</p>
                <p>• 3 Menit per soal</p>
                <p>• Tim tercepat memencet bel berhak menjawab</p>
                <p>• 5 Detik untuk menjawab</p>
                <p>• Jawaban salah = Pengurangan poin</p>
              </div>
              <Button size="lg" onClick={startRound} className="w-full lg:w-auto animate-bounce">
                MULAI RONDE
              </Button>
            </div>
          )}

          {gameState.phase === GamePhase.GAME_FINISHED && (
            <GameFinished
              onContinue={() => setGameState(prev => ({ ...prev, phase: GamePhase.ROUND_OVER }))}
              totalQuestions={QUESTIONS.length}
              topTeamName={[...teams].sort((a, b) => b.totalScore - a.totalScore)[0]?.name || 'Tim Juara'}
            />
          )}

          {gameState.phase === GamePhase.ROUND_OVER && (
            <Leaderboard teams={teams} activeTeamId={null} isFullScreen={true} />
          )}

          {(gameState.phase === GamePhase.QUESTION_DISPLAY ||
            gameState.phase === GamePhase.TEAM_ANSWERING ||
            gameState.phase === GamePhase.FEEDBACK
          ) && (
              <div className="w-full h-full flex flex-col items-center z-10 px-2 lg:px-4 min-h-0">

                {/* Question Image - Optimized for visibility */}
                <div className="relative w-full flex-1 min-h-0 bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-slate-700 group flex items-center justify-center">
                  {gameState.phase === GamePhase.FEEDBACK ? (
                    <div className={`absolute inset-0 flex flex-col items-center justify-center z-20 gap-6 transition-all duration-300 ${lastAnswerStatus === 'correct'
                      ? 'bg-gradient-to-br from-green-900/95 via-emerald-900/95 to-green-950/95'
                      : lastAnswerStatus === 'wrong'
                        ? 'bg-gradient-to-br from-red-900/95 via-rose-900/95 to-red-950/95'
                        : 'bg-gradient-to-br from-orange-900/95 via-amber-900/95 to-orange-950/95'
                      }`}>
                      {/* Animated background particles */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(12)].map((_, i) => (
                          <div
                            key={i}
                            className={`absolute rounded-full animate-ping ${lastAnswerStatus === 'correct' ? 'bg-green-400/20'
                              : lastAnswerStatus === 'wrong' ? 'bg-red-400/20'
                                : 'bg-orange-400/20'
                              }`}
                            style={{
                              width: Math.random() * 100 + 50,
                              height: Math.random() * 100 + 50,
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`,
                              animationDelay: `${Math.random() * 2}s`,
                              animationDuration: `${Math.random() * 2 + 2}s`,
                            }}
                          />
                        ))}
                      </div>

                      {/* Icon */}
                      <div className={`p-6 rounded-full animate-bounce ${lastAnswerStatus === 'correct'
                        ? 'bg-green-500/30 ring-4 ring-green-400/50'
                        : lastAnswerStatus === 'wrong'
                          ? 'bg-red-500/30 ring-4 ring-red-400/50'
                          : 'bg-orange-500/30 ring-4 ring-orange-400/50'
                        }`}>
                        {lastAnswerStatus === 'correct' ? (
                          <CheckCircle className="w-16 h-16 lg:w-24 lg:h-24 text-green-400" />
                        ) : lastAnswerStatus === 'wrong' ? (
                          <XCircle className="w-16 h-16 lg:w-24 lg:h-24 text-red-400" />
                        ) : (
                          <TimerOff className="w-16 h-16 lg:w-24 lg:h-24 text-orange-400" />
                        )}
                      </div>

                      {/* Text */}
                      <div className="text-center space-y-2">
                        <span className={`text-3xl lg:text-5xl font-display font-black tracking-wider ${lastAnswerStatus === 'correct'
                          ? 'text-green-300'
                          : lastAnswerStatus === 'wrong'
                            ? 'text-red-300'
                            : 'text-orange-300'
                          }`} style={{ textShadow: '0 0 30px currentColor' }}>
                          {lastAnswerStatus === 'correct'
                            ? '✓ JAWABAN BENAR'
                            : lastAnswerStatus === 'wrong'
                              ? '✗ JAWABAN SALAH'
                              : '⏱ WAKTU HABIS'}
                        </span>
                        {lastScoreChange && (
                          <div className={`text-xl lg:text-2xl font-bold ${lastScoreChange.delta > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {lastScoreChange.delta > 0 ? '+' : ''}{lastScoreChange.delta} Poin
                          </div>
                        )}
                      </div>

                      {/* Buttons */}
                      <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
                        {lastScoreChange && (
                          <Button
                            onClick={handleUndoLastChange}
                            variant="secondary"
                            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80"
                          >
                            Undo 1 Langkah
                          </Button>
                        )}
                        <Button
                          onClick={nextQuestion}
                          variant="secondary"
                          className={`flex items-center gap-2 animate-pulse ${lastAnswerStatus === 'correct'
                            ? 'bg-green-600/80 hover:bg-green-500/80 border-green-400'
                            : lastAnswerStatus === 'wrong'
                              ? 'bg-red-600/80 hover:bg-red-500/80 border-red-400'
                              : 'bg-orange-600/80 hover:bg-orange-500/80 border-orange-400'
                            }`}
                        >
                          <SkipForward className="w-5 h-5" />
                          Lanjut Soal Berikutnya
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Question"
                      className="max-w-full max-h-full w-auto h-auto object-contain"
                    />
                  )}

                  {/* Timer Overlay - Scale down on mobile */}
                  {gameState.phase === GamePhase.QUESTION_DISPLAY && (
                    <div className="absolute top-2 right-2 lg:top-4 lg:right-4 bg-slate-900/90 rounded-full p-1.5 lg:p-2 backdrop-blur border border-slate-700 shadow-xl scale-75 lg:scale-100 origin-top-right">
                      <Timer current={gameState.mainTimer} max={QUESTION_DURATION} size="sm" />
                    </div>
                  )}
                </div>

                {/* Interaction Zone */}
                <div className="w-full h-16 lg:h-20 flex-none flex items-center justify-center mt-1">
                  {gameState.phase === GamePhase.QUESTION_DISPLAY && (
                    <div className="flex items-center gap-4 text-center">
                      <span className="text-blue-400 font-display text-xs lg:text-sm tracking-widest uppercase animate-pulse">Menunggu Bel...</span>
                      <button onClick={handleSkip} className="text-slate-600 hover:text-red-400 flex items-center gap-1 text-xs">
                        <SkipForward size={14} /> Hanguskan Soal
                      </button>
                    </div>
                  )}

                  {gameState.phase === GamePhase.TEAM_ANSWERING && (
                    <div className="w-full flex items-center justify-between bg-slate-800 rounded-xl p-3 border border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)] gap-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="text-[10px] text-blue-400 uppercase tracking-widest">Menjawab</div>
                          <div className="text-lg lg:text-xl font-bold text-white truncate max-w-[150px] lg:max-w-[200px]">
                            {teams.find(t => t.id === gameState.activeTeamId)?.name}
                          </div>
                        </div>
                      </div>

                      {/* The Critical 5s Timer */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-red-500 uppercase animate-pulse">Sisa Waktu</span>
                        <div className="text-2xl lg:text-3xl font-display font-bold text-white">{gameState.answerTimer}</div>
                      </div>

                      {/* Admin Controls */}
                      <div className="flex gap-2">
                        <Button
                          variant="danger"
                          size="sm"
                          className="px-3"
                          onClick={() => handleAnswerVerdict(false)}
                          title="Jawaban Salah (-Poin)"
                        >
                          <XCircle className="w-5 h-5" />
                        </Button>

                        {gameState.answerTimer === 0 && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="px-3 animate-pulse bg-orange-600 hover:bg-orange-700 border-orange-500"
                            onClick={() => handleAnswerVerdict(false, true)}
                            title="Waktu Habis"
                          >
                            <TimerOff className="w-5 h-5" />
                          </Button>
                        )}

                        <Button
                          variant="success"
                          size="sm"
                          className="px-3"
                          onClick={() => handleAnswerVerdict(true)}
                          title="Jawaban Benar (+Poin)"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
        </div>
      </div>

      {/* RIGHT (Desktop) / BOTTOM (Mobile): Leaderboard - Compact */}
      {/* Hide sidebar when showing fullscreen views */}
      {gameState.phase !== GamePhase.GAME_FINISHED && gameState.phase !== GamePhase.ROUND_OVER && (
        <Leaderboard
          teams={teams}
          activeTeamId={gameState.activeTeamId}
          className="w-full lg:w-64 xl:w-72 h-40 lg:h-full border-t lg:border-t-0 lg:border-l flex-none"
        />
      )}

    </div>
  );
};

// --- SETUP COMPONENT ---

interface UploadedQuestion {
  id: number;
  imageUrl: string;
  points: number;
  difficulty: Difficulty;
  originalName: string;
}

const SetupScreen: React.FC<{ onComplete: (teams: Team[], questions: Question[]) => void }> = ({ onComplete }) => {
  const [teamInputs, setTeamInputs] = useState<{ name: string, score: string }[]>(
    Array.from({ length: INITIAL_TEAMS_COUNT }).map((_, i) => ({ name: `Tim ${i + 1}`, score: "0" }))
  );
  const [uploadedQuestions, setUploadedQuestions] = useState<UploadedQuestion[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [folderInputKey, setFolderInputKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);

  // Load existing questions from server on mount
  useEffect(() => {
    const loadExistingQuestions = async () => {
      try {
        const response = await fetch('/api/questions');
        if (response.ok) {
          const data = await response.json();
          if (data.items && data.items.length > 0) {
            const questions: UploadedQuestion[] = data.items.map((item: { id: number; points: number; url: string; originalName: string }) => ({
              id: item.id,
              imageUrl: item.url,
              points: item.points,
              difficulty: item.points >= 10 ? Difficulty.HARD : Difficulty.EASY,
              originalName: item.originalName,
            }));
            setUploadedQuestions(questions);
            console.log(`Loaded ${questions.length} existing questions`);
          }
        }
      } catch (error) {
        console.error('Failed to load existing questions:', error);
      } finally {
        setIsLoadingExisting(false);
      }
    };

    loadExistingQuestions();
  }, []);

  const handleInputChange = (index: number, field: 'name' | 'score', value: string) => {
    const newInputs = [...teamInputs];
    newInputs[index] = { ...newInputs[index], [field]: value };
    setTeamInputs(newInputs);
  };

  // Parse filename to extract question number and points
  // ONLY match explicit format: soal_1_5.png or q_2_10.jpg
  // Do NOT match random numbers from filenames like IMG_2026.jpg
  const parseFilename = (filename: string): { questionNumber: number; points: number } | null => {
    // Remove extension
    const nameWithoutExt = filename.replace(/\.(png|jpg|jpeg|gif|webp|bmp)$/i, '');

    // Only match explicit soal format: soal_1_5, soal-1-5, q_1_5, q-1-5
    const patterns = [
      /^soal[_\-](\d+)[_\-](\d+)$/i,  // soal_1_5 or soal-1-5
      /^q[_\-](\d+)[_\-](\d+)$/i,      // q_1_5 or q-1-5
    ];

    for (const pattern of patterns) {
      const match = nameWithoutExt.match(pattern);
      if (match) {
        return {
          questionNumber: parseInt(match[1]),
          points: parseInt(match[2])
        };
      }
    }

    // No pattern matched - return null, let server auto-assign
    return null;
  };

  const uploadQuestionFiles = async (
    files: File[],
    meta: { questionNumber: number; points: number }[]
  ) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('meta', JSON.stringify(meta));

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Upload failed');
    }

    return response.json() as Promise<{ items: { id: number; points: number; url: string; filename: string; originalName: string }[] }>;
  };

  const processFiles = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(file =>
      file.type.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(file.name)
    );

    if (imageFiles.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    const newQuestions: UploadedQuestion[] = [];

    // Build metadata - only include parsed info, let server handle auto-assignment
    const meta = imageFiles.map(file => {
      const parsed = parseFilename(file.name);
      if (parsed) {
        return { questionNumber: parsed.questionNumber, points: parsed.points };
      }
      // Return empty - server will auto-assign based on disk state
      return { questionNumber: 0, points: 0 };
    });

    try {
      const result = await uploadQuestionFiles(imageFiles, meta);
      result.items.forEach(item => {
        newQuestions.push({
          id: item.id,
          imageUrl: item.url,
          points: item.points,
          difficulty: item.points >= 10 ? Difficulty.HARD : Difficulty.EASY,
          originalName: item.originalName,
        });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload gagal';
      setUploadError(message);
    }

    if (newQuestions.length > 0) {
      setUploadedQuestions(prev => {
        const combined = [...prev];
        newQuestions.forEach(newQ => {
          const existingIndex = combined.findIndex(q => q.id === newQ.id);
          if (existingIndex >= 0) {
            combined[existingIndex] = newQ;
          } else {
            combined.push(newQ);
          }
        });
        return combined.sort((a, b) => a.id - b.id);
      });
    }

    setIsUploading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
    }
    // Reset by incrementing key to allow re-upload
    setFileInputKey(prev => prev + 1);
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
    }
    // Reset by incrementing key to allow re-upload
    setFolderInputKey(prev => prev + 1);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const items = e.dataTransfer.items;
    const files: File[] = [];

    // Handle both files and folder drops
    const processEntry = async (entry: FileSystemEntry): Promise<void> => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        return new Promise((resolve) => {
          fileEntry.file((file) => {
            files.push(file);
            resolve();
          });
        });
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const reader = dirEntry.createReader();
        return new Promise((resolve) => {
          reader.readEntries(async (entries) => {
            for (const entry of entries) {
              await processEntry(entry);
            }
            resolve();
          });
        });
      }
    };

    const processAllItems = async () => {
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry();
        if (entry) {
          await processEntry(entry);
        }
      }
      await processFiles(files);
    };

    processAllItems();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removeQuestion = (id: number) => {
    setUploadedQuestions(prev => prev.filter(q => q.id !== id));
  };

  const clearAllQuestions = () => {
    setUploadedQuestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedTeams: Team[] = teamInputs.map((input, i) => {
      const initialScore = parseInt(input.score) || 0;
      return {
        id: `team-${i}`,
        name: input.name,
        initialScore: initialScore,
        roundScore: 0,
        totalScore: initialScore,
      };
    });

    // Convert uploaded questions to Question format
    const formattedQuestions: Question[] = uploadedQuestions.map(q => ({
      id: q.id,
      difficulty: q.difficulty,
      points: q.points,
      imageUrl: q.imageUrl,
    }));

    onComplete(formattedTeams, formattedQuestions);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 lg:p-8 overflow-y-auto">
      <div className="max-w-6xl w-full bg-slate-800 p-4 lg:p-8 rounded-2xl shadow-2xl border border-slate-700">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 lg:mb-8 border-b border-slate-700 pb-6 text-center sm:text-left">
          <div className="p-3 bg-blue-600 rounded-lg">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold">Setup Arena Brain Blast</h1>
            <p className="text-sm lg:text-base text-slate-400">Masukkan nama tim, skor awal, dan upload gambar soal</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Teams Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Data Tim Peserta
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {teamInputs.map((input, index) => (
                <div key={index} className="flex gap-3 lg:gap-4 items-start p-3 lg:p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="w-8 h-8 flex-none flex items-center justify-center bg-slate-700 rounded text-sm font-bold mt-1">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-2 lg:space-y-3">
                    <div>
                      <label className="block text-[10px] lg:text-xs text-slate-500 uppercase font-bold mb-1">Nama Tim</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={input.name}
                        onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] lg:text-xs text-slate-500 uppercase font-bold mb-1">Skor Awal</label>
                      <input
                        type="number"
                        required
                        className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                        value={input.score}
                        onChange={(e) => handleInputChange(index, 'score', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Question Upload Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
              <Image className="w-5 h-5" />
              Upload Gambar Soal
              <span className="text-xs font-normal text-slate-500 ml-2">
                (Format nama: soal_1_5.png = Soal 1, 5 poin)
              </span>
            </h2>

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragOver
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-slate-600 hover:border-slate-500'
                }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="flex flex-col items-center gap-4">
                <div className={`p-4 rounded-full ${dragOver ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
                  <Upload className={`w-10 h-10 ${dragOver ? 'text-emerald-400' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-300">
                    Drag & Drop gambar atau folder di sini
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Atau gunakan tombol di bawah untuk memilih file
                  </p>
                </div>

                {/* Upload Buttons */}
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  <label className={`flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}>
                    <Image className="w-4 h-4" />
                    {isUploading ? 'Mengunggah...' : 'Pilih Gambar'}
                    <input
                      key={`file-${fileInputKey}`}
                      type="file"
                      onChange={handleFileUpload}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                  </label>

                  <label className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}>
                    <FolderOpen className="w-4 h-4" />
                    {isUploading ? 'Mengunggah...' : 'Pilih Folder'}
                    <input
                      key={`folder-${folderInputKey}`}
                      type="file"
                      onChange={handleFolderUpload}
                      accept="image/*"
                      multiple
                      {...{ webkitdirectory: '', directory: '' } as any}
                      className="hidden"
                    />
                  </label>
                </div>

                {uploadError && (
                  <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded">
                    {uploadError}
                  </div>
                )}
              </div>
            </div>

            {/* Loading existing questions indicator */}
            {isLoadingExisting && (
              <div className="mt-6 text-center text-slate-400 text-sm">
                <div className="inline-flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-500 border-t-cyan-400 rounded-full animate-spin"></div>
                  Memuat soal yang sudah ada...
                </div>
              </div>
            )}

            {/* Uploaded Questions Preview */}
            {!isLoadingExisting && uploadedQuestions.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-400">
                    Soal yang diupload ({uploadedQuestions.length} soal)
                  </h3>
                  <div className="flex gap-2">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Shuffle className="w-3 h-3" />
                      Urutan akan diacak saat game dimulai
                    </span>
                    <button
                      type="button"
                      onClick={clearAllQuestions}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Hapus Semua
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {uploadedQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="relative group bg-slate-900 rounded-lg overflow-hidden border border-slate-700 hover:border-slate-500 transition-colors"
                    >
                      <img
                        src={q.imageUrl}
                        alt={`Soal ${q.id}`}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300">Soal {q.id}</span>
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${q.difficulty === Difficulty.HARD
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-green-500/20 text-green-400'
                            }`}>
                            {q.points} pts
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-1">{q.originalName}</p>
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <h4 className="text-sm font-bold text-yellow-400 mb-2">📁 Format Penamaan File</h4>
              <div className="text-xs text-slate-400 space-y-1">
                <p>• <code className="bg-slate-800 px-1 rounded">soal_1_5.png</code> → Soal 1, 5 poin (Mudah)</p>
                <p>• <code className="bg-slate-800 px-1 rounded">soal_2_10.jpg</code> → Soal 2, 10 poin (Sulit)</p>
                <p>• Poin ≥ 10 otomatis dikategorikan sebagai soal SULIT</p>
                <p>• Jika tidak ada soal yang diupload, akan menggunakan soal default</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-700">
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              <Shuffle className="w-5 h-5 mr-2" />
              Simpan & Masuk Arena
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;