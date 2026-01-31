import React, { useMemo } from 'react';
import { Team } from '../types';
import { Trophy, Medal, AlertCircle } from 'lucide-react';

interface LeaderboardProps {
  teams: Team[];
  activeTeamId: string | null;
  className?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  teams,
  activeTeamId,
  className = ''
}) => {
  // Sort teams by Total Score (desc), then Round Score (desc)
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => b.totalScore - a.totalScore);
  }, [teams]);

  return (
    <div className={`flex flex-col bg-slate-800/50 border-slate-700 shadow-2xl overflow-hidden ${className}`}>
      <div className="py-2 px-3 lg:py-3 lg:px-4 bg-slate-900 border-b border-slate-700 flex-none">
        <h2 className="text-base lg:text-lg font-display text-blue-400 flex items-center gap-2">
          <Trophy className="w-4 h-4 lg:w-5 lg:h-5" />
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
                ${isActive ? 'bg-yellow-500/20 border-yellow-500 scale-[1.01] z-10' : 'bg-slate-800 border-slate-700'}
                ${isTop5 ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-slate-600'}
              `}
            >
              <div className="flex-shrink-0 w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center font-display font-bold text-slate-400 text-xs lg:text-sm">
                {index + 1}
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

                <span className={`font-display font-bold ${isTop5 ? 'text-green-400' : 'text-slate-400'} text-xl lg:text-2xl xl:text-3xl flex-none`}>
                  {team.totalScore}
                </span>
              </div>

              {index === 0 && <Medal className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 text-yellow-400 drop-shadow-lg" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};