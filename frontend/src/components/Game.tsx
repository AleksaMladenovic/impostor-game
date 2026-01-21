import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { SendRoom } from './Lobby';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Hash, User as UserIcon } from 'lucide-react';

const Game: React.FC = () => {
    const location = useLocation();
    const { roomId } = useParams();
    const { user } = useAuth();
    const [showIntro, setShowIntro] = useState(true);
    const [message, setMessage] = useState("");

    const { roomDetails } = location.state as { roomDetails: SendRoom };
    const isImpostor = user?.username === roomDetails.usernameOfImpostor;

    // Tajmer za intro ekran (5 sekundi)
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowIntro(false);
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#060608] text-white font-sans overflow-hidden">
            <AnimatePresence>
                {showIntro ? (
                    /* --- PHASE 1: INTRO EKRAN (CS:GO STYLE) --- */
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        transition={{ duration: 0.8 }}
                        className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-center p-4"
                    >
                        <motion.div
                            initial={{ letterSpacing: "1em", opacity: 0, scale: 0.8 }}
                            animate={{ letterSpacing: "0.2em", opacity: 1, scale: 1 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        >
                            <h1 className={`text-6xl md:text-8xl font-black italic uppercase italic tracking-tighter mb-4 ${
                                isImpostor ? 'text-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)]' : 'text-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.5)]'
                            }`}>
                                {isImpostor ? 'IMPOSTOR' : 'CREWMATE'}
                            </h1>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.5 }}
                            className="text-xl text-gray-400 uppercase tracking-widest font-bold"
                        >
                            {isImpostor ? 'Eliminiši sve i ostani neprimećen' : 'Pronađi uljeza i završi misiju'}
                        </motion.p>

                        {!isImpostor && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 2.5, type: 'spring' }}
                                className="mt-12 p-8 bg-blue-500/10 border border-blue-500/30 rounded-3xl backdrop-blur-md"
                            >
                                <p className="text-sm text-blue-400 uppercase font-black tracking-widest mb-2">Tvoja tajna reč je:</p>
                                <h2 className="text-5xl font-black text-white">{roomDetails.secretWord}</h2>
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    /* --- PHASE 2: GLAVNI EKRAN IGRE --- */
                    <motion.div
                        key="main-game"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex h-screen w-full relative"
                    >
                        {/* Pozadinski glow (Neutralni sivi/beli) */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/[0.03] blur-[120px] rounded-full" />
                            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/[0.02] blur-[120px] rounded-full" />
                        </div>

                        {/* LEVA STRANA / CENTAR: Tajna Reč i Info */}
                        <div className="flex-grow flex flex-col items-center justify-center p-8 z-10 relative">
                            <div className="text-center">
                                <motion.div 
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    className="bg-white/[0.03] border border-white/10 backdrop-blur-3xl p-16 rounded-[4rem] shadow-2xl relative"
                                >
                                    {/* Status runda u uglu */}
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-xl">
                                        Runda {roomDetails.currentRound || 1} / {roomDetails.numberOfRounds}
                                    </div>

                                    <h3 className="text-gray-500 uppercase font-black tracking-[0.4em] text-xs mb-6">Tvoj Identitet: {isImpostor ? 'IMPOSTOR' : 'CREWMATE'}</h3>
                                    
                                    <div className="space-y-2">
                                        <p className="text-gray-400 text-sm uppercase font-bold tracking-widest">Tajna reč sistema:</p>
                                        <h2 className="text-7xl md:text-9xl font-black italic tracking-tighter uppercase italic bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
                                            {isImpostor ? '???' : roomDetails.secretWord}
                                        </h2>
                                    </div>

                                    <div className="mt-12 flex items-center justify-center gap-4 text-sm font-bold uppercase tracking-widest">
                                        <div className="flex items-center gap-2 text-blue-400">
                                            <UserIcon size={16} />
                                            <span>{roomDetails.currentTurnPlayerUsername || 'Neko'} je na potezu</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* DESNA STRANA: LIVE CHAT */}
                        <aside className="w-96 bg-white/[0.02] border-l border-white/10 backdrop-blur-2xl flex flex-col z-20">
                            <div className="p-6 border-b border-white/10 flex items-center gap-3">
                                <MessageSquare className="text-blue-400" size={20} />
                                <h2 className="font-black uppercase tracking-widest text-sm text-gray-300">Sistemski Chat</h2>
                            </div>

                            {/* Lista poruka (Placeholder) */}
                            <div className="flex-grow overflow-y-auto p-6 space-y-4">
                                <div className="text-xs text-gray-600 text-center italic uppercase tracking-widest my-4">Početak komunikacije</div>
                                <div className="bg-white/5 p-4 rounded-2xl rounded-bl-none border border-white/5">
                                    <p className="text-[10px] text-blue-400 font-black mb-1">SISTEM</p>
                                    <p className="text-sm text-gray-300 italic font-medium">Dobrodošli u sektor {roomId}. Pazite na sumnjivo ponašanje.</p>
                                </div>
                                {/* Ovde ćeš mapirati prave poruke iz SignalR-a */}
                            </div>

                            {/* Input polje za chat */}
                            <div className="p-6 bg-black/40 border-t border-white/10">
                                <form 
                                    className="relative flex items-center gap-2"
                                    onSubmit={(e) => { e.preventDefault(); setMessage(""); }}
                                >
                                    <input 
                                        type="text"
                                        placeholder="Unesi poruku..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-gray-700"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                    <button className="bg-white text-black p-4 rounded-xl hover:bg-gray-200 active:scale-90 transition-all shadow-lg">
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        </aside>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Game;