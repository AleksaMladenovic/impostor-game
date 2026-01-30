import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface VotingModalProps {
    isOpen: boolean;
    players: string[];
    currentUsername?: string;
    hasVoted: boolean;
    votedPlayers: string[];
    onVote: (target: string | null) => void;
}

const VotingModal: React.FC<VotingModalProps> = ({
    isOpen,
    players,
    currentUsername,
    hasVoted,
    votedPlayers,
    onVote
}) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            >
                <div className="bg-white/[0.03] border border-white/10 p-10 rounded-[3rem] max-w-4xl w-full shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent" />

                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">GLASANJE</h2>
                        <p className="text-gray-500 text-xs font-bold tracking-[0.3em] mt-2">IDENTIFIKUJTE IMPOSTORA</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                        {players
                            .filter((p) => p !== currentUsername)
                            .map((player) => (
                                <button
                                    key={player}
                                    disabled={hasVoted}
                                    onClick={() => onVote(player)}
                                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${hasVoted
                                            ? 'opacity-50 cursor-default border-white/5'
                                            : 'bg-white/5 border-white/10 hover:border-red-500/50 hover:bg-white/[0.08]'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center font-bold">
                                            {player[0]}
                                        </div>
                                        <span className="font-black uppercase tracking-tight">{player}</span>
                                    </div>
                                    {votedPlayers.includes(player) && (
                                        <div className="bg-green-500/20 text-green-500 text-[10px] px-2 py-1 rounded-md font-bold">
                                            SPREMAN
                                        </div>
                                    )}
                                </button>
                            ))}
                    </div>

                    <button
                        disabled={hasVoted}
                        onClick={() => onVote(null)}
                        className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                        {hasVoted ? 'Glasano' : 'Skip Vote'}
                    </button>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);

export default VotingModal;
