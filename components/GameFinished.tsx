import React, { useEffect, useState } from 'react';
import { Trophy, Sparkles, PartyPopper, CheckCircle } from 'lucide-react';

interface GameFinishedProps {
  onContinue: () => void;
  totalQuestions: number;
  topTeamName: string;
}

export const GameFinished: React.FC<GameFinishedProps> = ({ onContinue, totalQuestions, topTeamName }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/20 animate-float"
            style={{
              width: Math.random() * 80 + 20,
              height: Math.random() * 80 + 20,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 3 + 4}s`,
            }}
          />
        ))}
      </div>

      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 2 + 3}s`,
              }}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#FFA07A', '#DDA0DD'][Math.floor(Math.random() * 6)],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 text-center px-4 max-w-4xl w-full space-y-8 animate-scale-in">
        {/* Trophy icon with glow */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400/50 blur-3xl rounded-full animate-pulse"></div>
            <Trophy className="w-32 h-32 text-yellow-400 relative z-10 animate-bounce-slow" />
          </div>
        </div>

        {/* Main title */}
        <div className="space-y-4">
          <h1 className="text-6xl lg:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 animate-gradient drop-shadow-2xl">
            GAME SELESAI!
          </h1>

          <div className="flex items-center justify-center gap-3 text-2xl lg:text-3xl font-semibold text-white/90">
            <Sparkles className="w-8 h-8 text-yellow-300 animate-spin-slow" />
            <span>Pertandingan Berakhir</span>
            <Sparkles className="w-8 h-8 text-yellow-300 animate-spin-slow" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border-2 border-white/20 shadow-2xl transform hover:scale-105 transition-transform">
            <div className="text-5xl font-display font-bold text-yellow-300 mb-2">
              {totalQuestions}
            </div>
            <div className="text-white/80 font-semibold">Soal Terjawab</div>
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mt-3" />
          </div>

          <div className="bg-gradient-to-br from-yellow-400/20 to-orange-400/20 backdrop-blur-md rounded-2xl p-6 border-2 border-yellow-400/50 shadow-2xl transform scale-110 hover:scale-115 transition-transform">
            <div className="text-xl font-semibold text-yellow-300 mb-3 flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6" />
              Juara Sementara
            </div>
            <div className="text-2xl font-display font-bold text-white truncate px-2">
              {topTeamName}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border-2 border-white/20 shadow-2xl transform hover:scale-105 transition-transform">
            <div className="text-5xl font-display font-bold text-purple-300 mb-2">
              ★★★
            </div>
            <div className="text-white/80 font-semibold">Semua Tim</div>
            <PartyPopper className="w-8 h-8 text-pink-400 mx-auto mt-3" />
          </div>
        </div>

        {/* Continue button */}
        <div className="mt-12 space-y-4">
          <div className="text-white/70 text-sm">
            Klik tombol di bawah untuk melihat papan peringkat
          </div>
          <button
            onClick={onContinue}
            className="px-12 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-bold text-xl rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-white/30"
          >
            Lihat Papan Peringkat Sekarang
          </button>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0.8;
          }
        }

        @keyframes confetti {
          0% {
            transform: translateY(0) rotateZ(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotateZ(720deg);
            opacity: 0;
          }
        }

        @keyframes scale-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes spin-slow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-confetti {
          animation: confetti ease-in forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.6s ease-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};
