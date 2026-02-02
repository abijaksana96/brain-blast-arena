import React, { useMemo } from 'react';
import { Team } from '../types';
import { Trophy, Medal, Crown, Star, AlertCircle, Award, Zap } from 'lucide-react';

interface LeaderboardProps {
  teams: Team[];
  activeTeamId: string | null;
  className?: string;
  isFullScreen?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  teams,
  activeTeamId,
  className = '',
  isFullScreen = false
}) => {
  // Sort teams by Total Score (desc), then Round Score (desc)
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => b.totalScore - a.totalScore);
  }, [teams]);

  // Podium display for full screen mode
  if (isFullScreen) {
    const topThree = sortedTeams.slice(0, 3);
    // BATASI maksimal 9 tim untuk tampil (WAJIB untuk videotron - NO SCROLL)
    const MAX_VISIBLE_TEAMS = 9;
    const others = sortedTeams.slice(3, 3 + MAX_VISIBLE_TEAMS);

    return (
      <div className="w-full h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900">
        {/* Header - Fixed height */}
        <header className="text-center py-6 flex-none">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-12 h-12 text-yellow-400 animate-bounce" />
            <h1 className="text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400">
              PAPAN PERINGKAT
            </h1>
            <Trophy className="w-12 h-12 text-yellow-400 animate-bounce" />
          </div>
          <p className="text-xl text-slate-300 font-semibold">Hasil Akhir Brain Blast Arena</p>
        </header>

        {/* Podium Section - Fixed 40vh */}
        <section className="h-[40vh] flex items-start justify-center gap-4 px-8 pt-1">
          <div className="flex items-end justify-center gap-4 flex-none">
            {/* 2nd Place */}
            {topThree[1] && (
              <div className="flex flex-col items-center animate-scale-in" style={{ animationDelay: '0.2s' }}>
                <div className="relative">
                  <div className="absolute inset-0 bg-gray-300/30 blur-2xl rounded-full"></div>
                  <Medal className="w-16 h-16 text-gray-300 relative z-10 mb-2" />
                </div>
                <div className="bg-gradient-to-b from-gray-200 to-gray-400 text-gray-900 rounded-t-2xl p-6 w-40 shadow-2xl border-4 border-gray-300 text-center h-[180px]">
                  <div className="text-6xl font-display font-black mb-1">2</div>
                  <div className="font-bold text-sm mb-1 truncate">{topThree[1].name}</div>
                  <div className="text-3xl font-display font-bold text-gray-800">{topThree[1].totalScore}</div>
                  <Star className="w-8 h-8 mx-auto mt-1 text-gray-600" />
                </div>
              </div>
            )}

            {/* 1st Place */}
            {topThree[0] && (
              <div className="flex flex-col items-center animate-scale-in" style={{ animationDelay: '0.1s' }}>
                <div className="relative mb-3">
                  <div className="absolute inset-0 bg-yellow-400/50 blur-3xl rounded-full animate-pulse"></div>
                  <Crown className="w-20 h-20 text-yellow-400 relative z-10 animate-bounce-slow" />
                </div>
                <div className="bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 text-yellow-950 rounded-t-2xl p-8 w-48 shadow-2xl border-4 border-yellow-400 text-center transform scale-110 h-[220px]">
                  <div className="text-7xl font-display font-black mb-2">1</div>
                  <div className="font-black text-base mb-2 truncate">{topThree[0].name}</div>
                  <div className="text-5xl font-display font-black text-yellow-800">{topThree[0].totalScore}</div>
                  <Trophy className="w-10 h-10 mx-auto mt-2 text-yellow-700" />
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <div className="flex flex-col items-center animate-scale-in" style={{ animationDelay: '0.3s' }}>
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-300/30 blur-2xl rounded-full"></div>
                  <Award className="w-16 h-16 text-orange-400 relative z-10 mb-2" />
                </div>
                <div className="bg-gradient-to-b from-orange-300 to-orange-500 text-orange-950 rounded-t-2xl p-6 w-40 shadow-2xl border-4 border-orange-400 text-center h-[160px]">
                  <div className="text-6xl font-display font-black mb-1">3</div>
                  <div className="font-bold text-sm mb-1 truncate">{topThree[2].name}</div>
                  <div className="text-3xl font-display font-bold text-orange-900">{topThree[2].totalScore}</div>
                  <Star className="w-8 h-8 mx-auto mt-1 text-orange-700" />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Leaderboard Grid Section - FIXED height, NO SCROLL */}
        {others.length > 0 && (
          <section className="h-[45vh] overflow-hidden px-8 py-4">
            <div className="h-full grid grid-cols-3 gap-4 origin-top" style={{ gridTemplateRows: `repeat(${Math.ceil(others.length / 3)}, 1fr)` }}>
              {others.map((team, index) => {
                const rank = index + 4;
                const isTop5 = rank <= 5;

                return (
                  <div
                    key={team.id}
                    className={`
                      relative flex items-center p-4 rounded-xl shadow-xl transition-all duration-300 animate-slide-in
                      ${isTop5
                        ? 'bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border-2 border-emerald-500 shadow-emerald-500/30'
                        : 'bg-slate-800/70 border-2 border-slate-600'
                      }
                    `}
                    style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                  >
                    {/* Rank badge */}
                    <div className={`
                      flex-shrink-0 w-14 h-14 flex items-center justify-center font-display font-black text-2xl rounded-full mr-3 shadow-lg
                      ${isTop5
                        ? 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white'
                        : 'bg-slate-700 text-slate-300'
                      }
                    `}>
                      {rank}
                    </div>

                    {/* Team info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">{team.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-slate-400 mt-1">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span>Ronde: {team.roundScore > 0 ? '+' : ''}{team.roundScore}</span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className={`
                      font-display font-black text-4xl
                      ${isTop5 ? 'text-emerald-400' : 'text-slate-400'}
                    `}>
                      {team.totalScore}
                    </div>

                    {/* Top 5 badge */}
                    {isTop5 && (
                      <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                        TOP 5
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <style>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes scale-in {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes slide-in {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes bounce-slow {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.6s ease-out;
          }

          .animate-scale-in {
            animation: scale-in 0.6s ease-out;
            opacity: 0;
            animation-fill-mode: forwards;
          }

          .animate-slide-in {
            animation: slide-in 0.5s ease-out;
            opacity: 0;
            animation-fill-mode: forwards;
          }

          .animate-bounce-slow {
            animation: bounce-slow 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  // Compact sidebar mode (original)
  return (
    <div className={`flex flex-col bg-slate-800/50 border-slate-700 shadow-2xl overflow-hidden ${className}`}>
      <div className="py-2 px-3 lg:py-3 lg:px-4 bg-gradient-to-r from-slate-900 via-purple-900/30 to-slate-900 border-b border-slate-700 flex-none">
        <h2 className="text-base lg:text-lg font-display text-blue-400 flex items-center gap-2">
          <Trophy className="w-4 h-4 lg:w-5 lg:h-5 animate-pulse" />
          Klasemen
        </h2>
      </div>

      <div className="flex-1 overflow-hidden p-1 lg:p-1.5 flex flex-col gap-1 lg:gap-1.5 min-h-0">
        {sortedTeams.map((team, index) => {
          const isTop5 = index < 5;
          const isActive = team.id === activeTeamId;

          return (
            <div
              key={team.id}
              className={`
                relative flex items-center py-1 px-2 lg:py-1.5 lg:px-2.5 rounded-md border transition-all duration-300 flex-1 min-h-0
                ${isActive ? 'bg-yellow-500/20 border-yellow-500 scale-[1.01] z-10 shadow-lg shadow-yellow-500/20' : 'bg-slate-800 border-slate-700'}
                ${isTop5 ? 'border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-900/20 to-slate-800' : 'border-l-4 border-l-slate-600'}
              `}
            >
              <div className={`flex-shrink-0 w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center font-display font-bold text-xs lg:text-sm ${isTop5 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {index === 0 ? <Crown className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-400" /> : index + 1}
              </div>

              <div className="flex-1 flex items-center justify-between ml-1.5 lg:ml-2 gap-2">
                <div className="flex flex-col min-w-0 justify-center">
                  <h3 className="text-[11px] lg:text-xs font-bold text-white truncate leading-tight">{team.name}</h3>
                  <div className="flex items-center text-[9px] lg:text-[10px] text-slate-400 leading-tight">
                    <span>Ronde: {team.roundScore > 0 ? '+' : ''}{team.roundScore}</span>
                    {isActive && (
                      <span className="flex items-center gap-0.5 text-yellow-400 font-bold animate-pulse ml-1.5">
                        <AlertCircle size={8} /> Menjawab
                      </span>
                    )}
                  </div>
                </div>

                <span className={`font-display font-bold ${isTop5 ? 'text-emerald-400' : 'text-slate-400'} text-xl lg:text-2xl xl:text-3xl flex-none`}>
                  {team.totalScore}
                </span>
              </div>

              {index === 0 && (
                <Medal className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 text-yellow-400 drop-shadow-lg animate-bounce" />
              )}
              {isTop5 && index !== 0 && (
                <Star className="absolute -top-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 text-emerald-400 drop-shadow-lg" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};