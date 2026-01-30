import React from 'react';
import { Clock } from 'lucide-react';

interface TimerBadgeProps {
    timeLeft: number;
}

const TimerBadge: React.FC<TimerBadgeProps> = ({ timeLeft }) => (
    <div className="absolute top-4 right-[410px] z-30 flex items-center gap-4 bg-black/60 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-xl shadow-2xl">
        <Clock className={timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-blue-400'} size={24} />
        <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none mb-1">Preostalo vreme</span>
            <span className={`text-2xl font-mono font-black leading-none ${timeLeft < 10 ? 'text-red-500' : 'text-white'}`}>
                00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
        </div>
    </div>
);

export default TimerBadge;
