import React from 'react';

interface TimerProps {
  current: number;
  max: number;
  label?: string;
  urgentThreshold?: number;
  size?: 'sm' | 'lg';
}

export const Timer: React.FC<TimerProps> = ({ 
  current, 
  max, 
  label, 
  urgentThreshold = 10,
  size = 'lg'
}) => {
  const radius = size === 'lg' ? 60 : 30;
  const stroke = size === 'lg' ? 8 : 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (current / max) * circumference;

  const isUrgent = current <= urgentThreshold;
  const color = isUrgent ? 'text-red-500' : 'text-blue-500';

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`relative flex items-center justify-center ${size === 'lg' ? 'w-40 h-40' : 'w-20 h-20'}`}>
        <svg
          height={radius * 2}
          width={radius * 2}
          className="rotate-[-90deg]"
        >
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            className="text-slate-800"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s linear' }}
            className={`${color} transition-colors duration-300`}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <span className={`absolute font-display font-bold ${size === 'lg' ? 'text-4xl' : 'text-xl'} ${color}`}>
          {current}
        </span>
      </div>
      {label && <span className="mt-2 font-display text-sm tracking-widest text-slate-400 uppercase">{label}</span>}
    </div>
  );
};