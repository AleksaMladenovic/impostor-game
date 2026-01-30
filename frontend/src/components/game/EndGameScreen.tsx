import React from 'react';
import { motion } from 'framer-motion';

interface GameResult {
    winner: string;
    points: number;
    won: boolean;
}

interface EndGameScreenProps {
    show: boolean;
    gameResult: GameResult | null;
    onIgrajPonovo?: () => void;
}

const EndGameScreen: React.FC<EndGameScreenProps> = ({ show, gameResult, onIgrajPonovo }) => {
    if (!show) return null;

    return (
        <motion.div
            key="endgame"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] bg-[#060608]/98 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-6"
        >
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }}>
                <h2
                    className={`text-7xl md:text-[140px] font-black italic uppercase tracking-tighter mb-4 ${gameResult?.won
                            ? 'text-yellow-500 drop-shadow-[0_0_50px_rgba(234,179,8,0.4)]'
                            : 'text-red-600 drop-shadow-[0_0_50px_rgba(220,38,38,0.4)]'
                        }`}
                >
                    {gameResult?.won ? 'VICTORY' : 'DEFEAT'}
                </h2>
                <p className="text-2xl text-gray-500 uppercase tracking-[0.6em] font-black mb-12">
                    Pobednik: <span className="text-white">{gameResult?.winner}</span>
                </p>
                <div className="bg-white/[0.03] border border-white/10 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group max-w-2xl min-w-[400px]">
                    <div
                        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${gameResult?.won ? 'via-yellow-500' : 'via-red-600'
                            } to-transparent`}
                    />
                    {/* <span className="text-xs text-gray-500 font-black block mb-4 uppercase">Zarađeni bodovi</span>
                    <div className="flex items-center justify-center gap-4">
                        <span className={`text-8xl font-black ${gameResult?.won ? 'text-white' : 'text-gray-700'}`}>
                            +{gameResult?.points}
                        </span>
                        <span className="text-yellow-500 font-black text-xl uppercase leading-none">Points</span>
                    </div> */}
                    <button
                        onClick={onIgrajPonovo}
                        className="mt-0 w-full py-5 bg-white text-black font-black uppercase text-xs rounded-2xl hover:bg-gray-200 transition-all"
                    >
                        Igraj ponovo
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default EndGameScreen;
