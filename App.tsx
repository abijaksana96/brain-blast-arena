import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GamePhase, Team, Difficulty, GameState } from './types';
import { QUESTIONS, QUESTION_DURATION, ANSWER_DURATION, INITIAL_TEAMS_COUNT } from './constants';
import { Button } from './components/Button';
import { Timer } from './components/Timer';
import { Leaderboard } from './components/Leaderboard';
import { Play, CheckCircle, XCircle, BrainCircuit, Users, SkipForward, TimerOff } from 'lucide-react';

const App: React.FC = () => {
  // --- STATE ---
  const [teams, setTeams] = useState<Team[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.SETUP,
    currentQuestionIndex: 0,
    activeTeamId: null,
    mainTimer: QUESTION_DURATION,
    answerTimer: ANSWER_DURATION,
  });

  // Refs for intervals to clear them properly
  const mainTimerRef = useRef<number | null>(null);
  const answerTimerRef = useRef<number | null>(null);

  // --- HELPERS ---
  const currentQuestion = QUESTIONS[gameState.currentQuestionIndex];

  // --- INITIALIZATION ---
  const handleSetupComplete = (setupTeams: Team[]) => {
    setTeams(setupTeams);
    setGameState(prev => ({ ...prev, phase: GamePhase.INTRO }));
  };

  // --- GAME LOOP LOGIC ---

  const startRound = () => {
    setGameState(prev => ({ ...prev, phase: GamePhase.QUESTION_DISPLAY, mainTimer: QUESTION_DURATION }));
  };

  const nextQuestion = useCallback(() => {
    if (gameState.currentQuestionIndex >= QUESTIONS.length - 1) {
      setGameState(prev => ({ ...prev, phase: GamePhase.ROUND_OVER }));
      return;
    }

    setGameState(prev => ({
      ...prev,
      currentQuestionIndex: prev.currentQuestionIndex + 1,
      phase: GamePhase.QUESTION_DISPLAY,
      mainTimer: QUESTION_DURATION,
      answerTimer: ANSWER_DURATION,
      activeTeamId: null,
    }));
  }, [gameState.currentQuestionIndex]);

  // --- TIMER LOGIC ---

  // Main Question Timer (3 Minutes)
  useEffect(() => {
    if (gameState.phase === GamePhase.QUESTION_DISPLAY) {
      mainTimerRef.current = window.setInterval(() => {
        setGameState(prev => {
          if (prev.mainTimer <= 0) {
            // Time ran out, question burns
            if (mainTimerRef.current) clearInterval(mainTimerRef.current);
            return { ...prev, phase: GamePhase.FEEDBACK }; // Briefly show fail then next
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

  // --- ACTIONS ---

  const handleTeamBuzz = (teamId: string) => {
    // Only allow buzz during Question Display
    if (gameState.phase !== GamePhase.QUESTION_DISPLAY) return;

    setGameState(prev => ({
      ...prev,
      phase: GamePhase.TEAM_ANSWERING,
      activeTeamId: teamId,
      answerTimer: ANSWER_DURATION // Reset 5s timer
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
        return {
          ...team,
          roundScore: team.roundScore + pointChange,
          totalScore: team.totalScore + pointChange
        };
      }
      return team;
    }));

    // Logic: 
    // Correct -> Points -> Next Question
    // Wrong/Timeout -> Minus Points -> Burn Question -> Next Question
    // In both cases, we move to next question (per rule 7: "soal langsung hangus")

    // Brief delay to show result? Let's just go to feedback state for 2 seconds then next
    setGameState(prev => ({ ...prev, phase: GamePhase.FEEDBACK }));
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  const handleSkip = () => {
    setGameState(prev => ({ ...prev, phase: GamePhase.FEEDBACK }));
    setTimeout(() => {
      nextQuestion();
    }, 1000);
  };

  // --- KEYBOARD LISTENER ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only allow buzz during QUESTION_DISPLAY
      if (gameState.phase !== GamePhase.QUESTION_DISPLAY) return;

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

  // --- RENDER HELPERS ---

  if (gameState.phase === GamePhase.SETUP) {
    return <SetupScreen onComplete={handleSetupComplete} />;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">

      {/* LEFT (Desktop) / TOP (Mobile): Game Board */}
      <div className="flex-1 flex flex-col relative w-full lg:h-screen lg:overflow-hidden">

        {/* Header Bar */}
        <div className="min-h-16 py-2 border-b border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between px-4 lg:px-8 backdrop-blur-sm z-20 gap-4">
          <div className="flex items-center gap-3">
            <BrainCircuit className="text-blue-500 w-6 h-6 lg:w-8 lg:h-8" />
            <h1 className="font-display font-bold text-lg lg:text-xl tracking-wider text-white">BRAIN BLAST</h1>
          </div>

          <div className="flex items-center gap-3 lg:gap-6 ml-auto">
            <div className="flex flex-col items-end">
              <span className="text-[8px] lg:text-[10px] uppercase text-slate-500 font-bold tracking-widest">Soal</span>
              <span className="font-display font-bold text-base lg:text-xl leading-none">
                {gameState.currentQuestionIndex + 1} <span className="text-slate-600 text-xs lg:text-base">/ {QUESTIONS.length}</span>
              </span>
            </div>
            <div className="h-6 lg:h-8 w-[1px] bg-slate-700"></div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] lg:text-[10px] uppercase text-slate-500 font-bold tracking-widest">Tipe</span>
              <span className={`font-display font-bold text-base lg:text-lg leading-none ${currentQuestion.difficulty === Difficulty.HARD ? 'text-red-400' : 'text-green-400'}`}>
                {currentQuestion.difficulty}
              </span>
            </div>
            <div className="h-6 lg:h-8 w-[1px] bg-slate-700"></div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] lg:text-[10px] uppercase text-slate-500 font-bold tracking-widest">Poin</span>
              <span className="font-display font-bold text-lg lg:text-xl text-yellow-400 leading-none">{currentQuestion.points}</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-2 items-center justify-center relative overflow-y-auto lg:overflow-visible">

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

          {gameState.phase === GamePhase.ROUND_OVER && (
            <div className="text-center z-10 space-y-6 w-full px-4">
              <h2 className="text-3xl lg:text-4xl font-display text-white">Ronde Selesai</h2>
              <p className="text-slate-400">Silakan cek klasemen akhir.</p>
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 max-w-md mx-auto w-full">
                <h3 className="text-xl font-bold mb-4">Top 5 Grand Final</h3>
                <div className="space-y-2">
                  {/* Filter Top 5 logic repeated for summary view */}
                  {[...teams].sort((a, b) => b.totalScore - a.totalScore).slice(0, 5).map((t, i) => (
                    <div key={t.id} className="flex justify-between w-full text-left border-b border-slate-700 pb-1">
                      <span>{i + 1}. {t.name}</span>
                      <span className="font-bold text-yellow-400">{t.totalScore}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(gameState.phase === GamePhase.QUESTION_DISPLAY ||
            gameState.phase === GamePhase.TEAM_ANSWERING ||
            gameState.phase === GamePhase.FEEDBACK
          ) && (
              <div className="w-full max-w-full flex flex-col items-center gap-2 z-10 px-2">

                {/* Question Image */}
                <div className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-2xl border-4 border-slate-800 group">
                  {gameState.phase === GamePhase.FEEDBACK ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-20 gap-4">
                      <span className="text-2xl lg:text-4xl font-display font-bold text-slate-300 text-center px-4">
                        {gameState.activeTeamId ? "POIN DIPERBARUI" : "WAKTU HABIS"}
                      </span>
                      {!gameState.activeTeamId && (
                        <Button
                          onClick={nextQuestion}
                          variant="secondary"
                          className="flex items-center gap-2 animate-bounce"
                        >
                          <SkipForward className="w-5 h-5" />
                          Lanjut Soal Berikutnya
                        </Button>
                      )}
                    </div>
                  ) : (
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Question"
                      className="w-full h-full object-cover"
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
                <div className="w-full min-h-[120px] lg:h-32 flex items-center justify-center">
                  {gameState.phase === GamePhase.QUESTION_DISPLAY && (
                    <div className="flex flex-col items-center gap-2 animate-pulse text-center">
                      <span className="text-blue-400 font-display text-xs lg:text-sm tracking-widest uppercase">Menunggu Bel...</span>
                      <div className="text-slate-500 text-[10px] lg:text-xs">Operator: Klik tombol "BUZZ" pada tim di Klasemen</div>
                      {/* Skip Button for stalled game */}
                      <button onClick={handleSkip} className="mt-2 text-slate-600 hover:text-red-400 flex items-center gap-1 text-xs">
                        <SkipForward size={14} /> Hanguskan Soal
                      </button>
                    </div>
                  )}

                  {gameState.phase === GamePhase.TEAM_ANSWERING && (
                    <div className="w-full flex flex-col sm:flex-row items-center justify-between bg-slate-800 rounded-xl p-4 border border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)] gap-4">
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-start">
                        <div className="text-center sm:text-left">
                          <div className="text-[10px] lg:text-xs text-blue-400 uppercase tracking-widest mb-1">Menjawab</div>
                          <div className="text-xl lg:text-2xl font-bold text-white truncate max-w-[200px]">
                            {teams.find(t => t.id === gameState.activeTeamId)?.name}
                          </div>
                        </div>
                      </div>

                      {/* The Critical 5s Timer */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-red-500 uppercase mb-1 animate-pulse">Sisa Waktu</span>
                        <div className="text-3xl lg:text-4xl font-display font-bold text-white">{gameState.answerTimer}</div>
                      </div>

                      {/* Admin Controls */}
                      <div className="flex gap-3 w-full sm:w-auto justify-center">
                        <Button
                          variant="danger"
                          className="flex-1 sm:flex-none justify-center"
                          onClick={() => handleAnswerVerdict(false)}
                          title="Jawaban Salah (-Poin)"
                        >
                          <XCircle className="w-6 h-6" />
                        </Button>

                        {gameState.answerTimer === 0 && (
                          <Button
                            variant="danger"
                            className="flex-1 sm:flex-none justify-center animate-pulse bg-orange-600 hover:bg-orange-700 border-orange-500"
                            onClick={() => handleAnswerVerdict(false, true)}
                            title="Waktu Habis"
                          >
                            <TimerOff className="w-6 h-6" />
                          </Button>
                        )}

                        <Button
                          variant="success"
                          className="flex-1 sm:flex-none justify-center"
                          onClick={() => handleAnswerVerdict(true)}
                          title="Jawaban Benar (+Poin)"
                        >
                          <CheckCircle className="w-6 h-6" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
        </div>
      </div>

      {/* RIGHT (Desktop) / BOTTOM (Mobile): Leaderboard */}
      <Leaderboard
        teams={teams}
        activeTeamId={gameState.activeTeamId}
        className="w-full lg:w-96 lg:h-screen lg:sticky lg:top-0 border-t lg:border-t-0 lg:border-l h-[400px] lg:h-auto flex-none"
      />

    </div>
  );
};

// --- SETUP COMPONENT ---

const SetupScreen: React.FC<{ onComplete: (teams: Team[]) => void }> = ({ onComplete }) => {
  const [teamInputs, setTeamInputs] = useState<{ name: string, score: string }[]>(
    Array.from({ length: INITIAL_TEAMS_COUNT }).map((_, i) => ({ name: `Tim ${i + 1}`, score: "0" }))
  );

  const handleInputChange = (index: number, field: 'name' | 'score', value: string) => {
    const newInputs = [...teamInputs];
    newInputs[index] = { ...newInputs[index], [field]: value };
    setTeamInputs(newInputs);
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
    onComplete(formattedTeams);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 lg:p-8 overflow-y-auto">
      <div className="max-w-4xl w-full bg-slate-800 p-4 lg:p-8 rounded-2xl shadow-2xl border border-slate-700">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 lg:mb-8 border-b border-slate-700 pb-6 text-center sm:text-left">
          <div className="p-3 bg-blue-600 rounded-lg">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold">Setup Peserta</h1>
            <p className="text-sm lg:text-base text-slate-400">Masukkan nama tim dan skor dari ronde sebelumnya</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-8">
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

          <div className="flex justify-end pt-4 border-t border-slate-700">
            <Button type="submit" size="lg" className="w-full sm:w-auto">Simpan & Masuk Arena</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;