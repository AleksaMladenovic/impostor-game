import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SkipForward, CheckCircle2, ShieldAlert } from 'lucide-react';

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
            <>
                {/* 
                  1. RESPONZIVNI SOLID BACKDROP (Zatamnjenje sredine)
                  - Na mobilnom (ispod md) pokriva ceo ekran (left-0 right-0).
                  - Na desktopu (md+) ostavlja tvoje sidebare čistim (left-80, right-96).
                  - 'backdrop-blur-2xl' totalno uništava vidljivost tajne reči u pozadini.
                */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-y-0 left-0 right-0 md:left-80 md:right-96 bg-[#060608]/95 backdrop-blur-2xl z-[90] pointer-events-none border-x border-white/5"
                />

                {/* 
                  2. GLAVNI KONTEJNER 
                  - Koristimo 'pointer-events-none' da bi sidebari (chat i tragovi) bili klikabilni.
                */}
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4 sm:p-6 md:p-8">
                    
                    {/* 
                       KARTICA ZA GLASANJE
                       - Responzivna širina: skoro pun ekran na mobilnom, max-w-2xl na desktopu.
                    */}
                    <motion.div
                        initial={{ scale: 0.9, y: 30, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-[#0c0c0e] border border-white/10 p-6 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[3rem] w-full max-w-[95%] sm:max-w-xl md:max-w-2xl shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden pointer-events-auto"
                    >
                        {/* Dekorativna "Danger" linija na vrhu */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent shadow-[0_0_20px_rgba(220,38,38,0.4)]" />

                        <div className="text-center mb-6 md:mb-10">
                            <div className="flex justify-center mb-4 text-red-600">
                                <ShieldAlert size={32} className="animate-pulse w-7 h-7 md:w-8 md:h-8" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white leading-none">GLASANJE</h2>
                            <p className="text-gray-500 text-[9px] md:text-[10px] font-bold tracking-[0.4em] mt-3 uppercase">
                                {hasVoted ? "SAČEKAJTE OSTALE OPERATIVCE" : "IDENTIFIKUJTE IZDAJNIKA"}
                            </p>
                        </div>

                        {/* LISTA IGRAČA 
                            - Grid: 1 kolona na mobilnom, 2 na desktopu.
                            - Scrollable: Ako ima više igrača nego što ekran dozvoljava.
                        */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-8 max-h-[40vh] md:max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {players
                                .filter((p) => p !== currentUsername)
                                .map((player) => (
                                    <button
                                        key={player}
                                        disabled={hasVoted}
                                        onClick={() => onVote(player)}
                                        className={`flex items-center justify-between p-4 md:p-5 rounded-2xl border transition-all duration-200 ${
                                            hasVoted
                                                ? 'opacity-40 border-white/5 cursor-default'
                                                : 'bg-white/[0.03] border-white/10 hover:border-red-600/50 hover:bg-white/[0.07] active:scale-95'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                            {/* Avatar Ikona */}
                                            <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center font-black text-white border border-white/5">
                                                {player[0].toUpperCase()}
                                            </div>
                                            {/* Ime Igrača */}
                                            <span className="font-black uppercase tracking-tight text-white truncate text-sm md:text-base">
                                                {player}
                                            </span>
                                        </div>
                                        
                                        {/* Vizuelni indikator ako je neko glasao */}
                                        {votedPlayers.includes(player) && (
                                            <div className="flex items-center gap-1 text-[9px] font-black text-green-500 uppercase bg-green-500/10 px-2 py-1 rounded-md shrink-0">
                                                <CheckCircle2 size={12} />
                                                <span className="hidden sm:inline">Spreman</span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                        </div>

                        {/* DUGME ZA SKIP */}
                        <div className="flex flex-col items-center">
                            <button
                                disabled={hasVoted}
                                onClick={() => onVote(null)}
                                className={`flex items-center justify-center gap-2 w-full sm:w-auto px-10 md:px-12 py-3 md:py-4 rounded-xl border border-white/10 font-black uppercase text-[9px] md:text-[10px] tracking-[0.3em] transition-all ${
                                    hasVoted 
                                    ? 'opacity-20 text-gray-500 border-transparent' 
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white hover:border-white/20 active:scale-95'
                                }`}
                            >
                                <SkipForward size={14} />
                                {hasVoted ? 'VAŠ GLAS JE ZABELEŽEN' : 'SKIP VOTE'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </>
        )}
    </AnimatePresence>
);

export default VotingModal;