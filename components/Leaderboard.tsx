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
    <div className={`flex flex-col bg-slate-800/50 border-slate-700 shadow-2xl ${className}`}>
      <div className="p-4 bg-slate-900 border-b border-slate-700 flex-none">
        <h2 className="text-xl font-display text-blue-400 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Klasemen
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
        {sortedTeams.map((team, index) => {
          const isTop5 = index < 5;
          const isActive = team.id === activeTeamId;

          return (
            <div
              key={team.id}
              className={`
                relative flex items-center p-3 rounded-lg border transition-all duration-300
                ${isActive ? 'bg-yellow-500/20 border-yellow-500 scale-[1.02] z-10' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}
                ${isTop5 ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-slate-600'}
              `}
            >
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center font-display font-bold text-slate-400">
                {index + 1}
              </div>

              <div className="flex-1 flex items-center justify-between ml-3 gap-4">
                <div className="flex flex-col min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{team.name}</h3>
                  <div className="flex items-center text-xs text-slate-400 mt-0.5">
                    <span>Ronde: {team.roundScore > 0 ? '+' : ''}{team.roundScore}</span>
                    {isActive && (
                      <span className="flex items-center gap-1 text-yellow-400 font-bold animate-pulse ml-2">
                        <AlertCircle size={12} /> Menjawab
                      </span>
                    )}
                  </div>
                </div>

                <span className={`font-display font-bold ${isTop5 ? 'text-green-400' : 'text-slate-400'} text-5xl flex-none`}>
                  {team.totalScore}
                </span>
              </div>

              {index === 0 && <Medal className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 drop-shadow-lg" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};