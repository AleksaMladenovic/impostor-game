import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Skull, RotateCcw, Home, Star } from 'lucide-react';
import { IReturnState } from '../../interfaces/IReturnState';

interface EndGameScreenProps {
    show: boolean;
    gameState: IReturnState | null;
    isImpostor: boolean;
    onIgrajPonovo: () => void;
    onBackToHome: () => void;
}

const EndGameScreen: React.FC<EndGameScreenProps> = ({ 
    show, 
    gameState, 
    isImpostor, 
    onIgrajPonovo, 
    onBackToHome 
}) => {
    if (!show || !gameState || !gameState.gameFinishedStates) return null;

    const { impostorWon } = gameState.gameFinishedStates;
    
    // Logika pobede: ako si impostor i pobedio je impostor, ili ako nisi i pobedili su crewmates
    const localWon = isImpostor === impostorWon;
    const points = localWon ? (isImpostor ? 5 : 3) : 0;
    const winnerTeam = impostorWon ? "IMPOSTOR" : "CREWMATES";

    return (
        <motion.div
            key="endgame"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[250] bg-[#060608]/98 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-4 overflow-y-auto"
        >
            <motion.div 
                initial={{ scale: 0.8, y: 20 }} 
                animate={{ scale: 1, y: 0 }} 
                transition={{ type: 'spring', damping: 15 }}
                className="max-w-2xl w-full"
            >
                {/* --- NASLOV: VICTORY / DEFEAT --- */}
                <h2 className={`text-7xl md:text-[140px] font-black italic uppercase tracking-tighter mb-2 ${
                    localWon 
                    ? 'text-yellow-500 drop-shadow-[0_0_50px_rgba(234,179,8,0.4)]' 
                    : 'text-red-600 drop-shadow-[0_0_50px_rgba(220,38,38,0.4)]'
                }`}>
                    {localWon ? 'VICTORY' : 'DEFEAT'}
                </h2>
                
                <p className="text-xl text-gray-500 uppercase tracking-[0.5em] font-black mb-10">
                    POBEDNIČKI TIM: <span className="text-white">{winnerTeam}</span>
                </p>

                {/* --- KARTICA SA REZULTATIMA --- */}
                <div className="bg-white/[0.03] border border-white/10 p-10 md:p-14 rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col items-center">
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${localWon ? 'via-yellow-500' : 'via-red-600'} to-transparent`} />
                    
                    {/* Ikonica Trofeja/Lobanje */}
                    <div className="mb-8">
                        {localWon ? (
                            <div className="p-5 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                                <Trophy size={48} className="text-yellow-500" />
                            </div>
                        ) : (
                            <div className="p-5 bg-red-600/10 rounded-full border border-red-600/20">
                                <Skull size={48} className="text-red-600" />
                            </div>
                        )}
                    </div>

                    {/* Poeni */}
                    <div className="mb-12">
                        <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-2">Zarađeni Bodovi</span>
                        <div className="flex items-center justify-center gap-4">
                            <motion.span 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5, type: 'spring' }}
                                className={`text-9xl font-black ${localWon ? 'text-white' : 'text-gray-800'}`}
                            >
                                +{points}
                            </motion.span>
                            <div className="text-left">
                                <p className="text-yellow-500 font-black text-2xl italic uppercase leading-none">Points</p>
                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Added to profile</p>
                            </div>
                        </div>
                    </div>

                    {/* --- DUGMIĆI --- */}
                    <div className="w-full max-w-xs space-y-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onIgrajPonovo}
                            className="w-full py-5 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:bg-gray-200 transition-all uppercase text-sm tracking-widest"
                        >
                            <RotateCcw size={18} /> Igraj Ponovo
                        </motion.button>
                        
                        <button
                            onClick={onBackToHome}
                            className="w-full py-4 bg-transparent text-gray-500 hover:text-white font-black rounded-2xl transition-all uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-2"
                        >
                            <Home size={14} /> Nazad u meni
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Dekorativni krugovi u pozadini */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px] -z-10 ${
                localWon ? 'bg-yellow-900/10' : 'bg-red-900/10'
            }`} />
        </motion.div>
    );
};

export default EndGameScreen;