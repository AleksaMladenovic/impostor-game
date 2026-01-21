import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { SendRoom } from './Lobby';
import { useAuth } from '../context/AuthContext';
import { useSignalR } from '../context/SignalRContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User as UserIcon, Clock, Edit3, History, ShieldAlert } from 'lucide-react';

export interface IMessage {
    userId: string;
    username: string;
    content: string;
    timestamp: string; // ISO string
}


const Game: React.FC = () => {
    const location = useLocation();
    const { roomId } = useParams();
    const { user } = useAuth();
    const { connection, isConnected } = useSignalR();
    const [showIntro, setShowIntro] = useState(true);
    const [message, setMessage] = useState("");
    const [chatMessages, setChatMessages] = useState<IMessage[]>([]);    const [clueInput, setClueInput] = useState("");
    const [timeLeft, setTimeLeft] = useState(0);
    const { roomDetails } = location.state as { roomDetails: SendRoom };
    const isImpostor = user?.username === roomDetails.usernameOfImpostor;
    const isMyTurn = user?.username === roomDetails.currentTurnPlayerUsername;

    useEffect(() => {
        setTimeLeft(roomDetails.secondsPerTurn || 30);
        const introTimer = setTimeout(() => setShowIntro(false), 5000);
        return () => clearTimeout(introTimer);
    }, [roomDetails]);

    // Logika odbrojavanja tajmera
    useEffect(() => {
        if (showIntro || timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft, showIntro]);

    // Tajmer za intro ekran (5 sekundi)
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowIntro(false);
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Povezivanje na SignalR za chat 
        if (connection) {
            console.log("Connection state:", connection.state);
            
            // Prvo uklonimo stari listener da izbegnemo duplikate
            connection.off("ReceiveMessage");
            
            connection.on("ReceiveMessage", (msg: IMessage) => {
                console.log("Primljena poruka:", msg.content);
                setChatMessages(prevMessages => [...prevMessages, msg]);
            });
        } else {
            console.warn("Nema dostupne konekcije u Game komponenti");
        }
        
        // Cleanup - uklonimo listener kada se komponenta unmount-uje
        return () => {
            if (connection) {
                connection.off("ReceiveMessage");
            }
        };
    }, [connection])

    const handleSendMessage = () => {
        if (message.trim() === "") return;
        if (!connection) {
            console.error("Konekcija nije uspostavljena");
            alert("Greška: Niste povezani na server");
            return;
        }
        console.log("Šaljem poruku:", message, "u sobu:", roomId);
        const msg: IMessage = {
            userId: user?.id || '',
            username: user?.username || 'Nepoznati Igrač',
            content: message,
            timestamp: new Date().toISOString()
        }
        connection
            .invoke("SendMessageToRoom", roomId, msg)
            .then(() => {
                console.log("Poruka je uspešno poslana");
                setMessage("");
            })
            .catch((err) => {
                console.error("Greška pri slanju poruke:", err);
                alert("Greška pri slanju poruke: " + err.message);
            });
    };
    return (
        <div className="min-h-screen bg-[#060608] text-white font-sans overflow-hidden">
            <AnimatePresence>
                {showIntro ? (
                    /* --- PHASE 1: INTRO EKRAN --- */
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
                            <h1 className={`text-6xl md:text-8xl font-black italic uppercase tracking-tighter mb-4 ${
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
                        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                            <motion.div 
                                animate={{ x: [-20, 40, -20], y: [-10, 30, -10], scale: [1, 1.1, 1] }}
                                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-white/[0.04] blur-[130px] rounded-full" 
                            />
                            <motion.div 
                                animate={{ x: [20, -40, 20], y: [10, -30, 10], scale: [1.1, 1, 1.1] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                                className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/[0.03] blur-[130px] rounded-full" 
                            />
                        </div>
                        <div className="absolute top-4 right-96 z-30 flex items-center gap-4 bg-black/60 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-xl shadow-2xl">
                            <Clock className={timeLeft < 10 ? "text-red-500 animate-pulse" : "text-blue-400"} size={24} />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none mb-1">Preostalo vreme</span>
                                <span className={`text-2xl font-mono font-black leading-none ${timeLeft < 10 ? "text-red-500" : "text-white"}`}>
                                    00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                                </span>
                            </div>
                        </div>

                        {/* Connection Status Indicator */}
                        <div className="absolute top-4 left-4 z-30 flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                {isConnected ? 'Povezan' : 'Prekid konekcije'}
                            </span>
                        </div>

                         <aside className="w-80 bg-white/[0.01] border-r border-white/10 backdrop-blur-3xl flex flex-col">
                            <div className="p-6 border-b border-white/10 bg-white/[0.02]">
                                <h2 className="flex items-center gap-2 font-black uppercase tracking-widest text-xs text-gray-400">
                                    <History size={14} className="text-blue-400" /> Istorija Tragova
                                </h2>
                            </div>
                            <div className="flex-grow overflow-y-auto p-4 space-y-3">
                                {/* Ovde ćeš mapirati tragove iz baze */}
                                <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Igrač: Marko</p>
                                    <p className="text-sm font-medium italic">"Vruće je..."</p>
                                </div>
                            </div>

                            {/* INPUT ZA TRAG (Samo ako je igrač na potezu) */}
                            <div className="p-6 bg-blue-500/5 border-t border-blue-500/20">
                                {isMyTurn ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                                            <Edit3 size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Tvoj red za trag</span>
                                        </div>
                                        <input 
                                            type="text"
                                            placeholder="UNESI TRAG..."
                                            className="w-full bg-white/5 border-b-2 border-white/10 p-3 text-sm focus:border-blue-500 outline-none transition-all uppercase font-bold"
                                            value={clueInput}
                                            onChange={(e) => setClueInput(e.target.value)}
                                        />
                                        <button className="w-full py-3 bg-white text-black font-black rounded-xl text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
                                            Potvrdi Trag
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-relaxed">
                                            Čekamo da <br/> <span className="text-blue-400">{roomDetails.currentTurnPlayerUsername}</span> <br/> unese trag
                                        </p>
                                    </div>
                                )}
                            </div>
                        </aside>

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
                                        <h2 className="text-7xl md:text-9xl font-black italic tracking-tighter uppercase bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
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
                                {chatMessages.map((msg, index) => (
                                    <div 
                                        key={index}
                                        className={`p-4 rounded-2xl border ${msg.username === user?.username ? 'bg-blue-500/10 border-blue-500/20 self-end rounded-br-none' : 'bg-white/5 border-white/10 rounded-bl-none'}`}
                                    >
                                        <p className={`text-[10px] font-black mb-1 ${msg.username === user?.username ? 'text-blue-400' : 'text-gray-400'}`}>
                                            {msg.username.toUpperCase()}
                                        </p>
                                        <p className="text-sm text-gray-300">{msg.content}</p>
                                    </div>
                                ))}
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
                                    <button className="bg-white text-black p-4 rounded-xl hover:bg-gray-200 active:scale-90 transition-all shadow-lg" onClick={handleSendMessage}>
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