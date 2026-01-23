import React, { useState, useEffect, use } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HubConnectionBuilder, HubConnection } from '@microsoft/signalr';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User as UserIcon, Clock, Edit3, History } from 'lucide-react';
import { GameState, IReturnState } from '../interfaces/IReturnState';

export interface IMessage {
    userId: string;
    username: string;
    content: string;
    timestamp: string;
}
export interface IClue {
    userId: string;
    username: string; 
    clueWord: string;
    timestamp: string;
}

const Game: React.FC = () => {
    const location = useLocation();
    const { roomId } = useParams();
    const { user } = useAuth();
    
    // --- STATE ---
    // const { roomDetails: initialRoomDetails } = location.state as { roomDetails: SendRoom };
    const [connection, setConnection] = useState<HubConnection | null>(null);
    // const [currentRoom, setCurrentRoom] = useState<SendRoom>(initialRoomDetails);
    const [showIntro, setShowIntro] = useState(true);
    const [message, setMessage] = useState("");
    const [clue, setClue] = useState("");
    const [clues, setCluesWords] = useState<IClue[]>([]);
    const [chatMessages, setChatMessages] = useState<IMessage[]>([]);
    const [timeLeft, setTimeLeft] = useState(30);
    // Spisak ljudi koji su već "udarili" glas (da bismo prikazali kvačice)
    const [votedPlayers, setVotedPlayers] = useState<string[]>([]);
    // Da li je lokalni korisnik već kliknuo
    const [hasVoted, setHasVoted] = useState(false);
    // Za prikaz rezultata izbacivanja (npr. 5 sekundi)
    const [showEjectionScreen, setShowEjectionScreen] = useState(false);

    const [gameState, setGameState] = useState<IReturnState | null>(null);
    const [isImpostor, setIsImpostor] = useState(false);
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [isVotingPhase, setIsVotingPhase] = useState(false);
    const [players, setPlayers] = useState<string[]>([]);
    const [currentStateNumber, setCurrentStateNumber] = useState<number>(0);
    const [currentTurnUsername, setCurrentTurnUsername] = useState<string>("");
    const [roundNumber, setRoundNumber] = useState<number>(1);
    const [maxRounds, setMaxRounds] = useState<number>(1);
    const [secretWord, setSecretWord] = useState<string>("");
    // --- DINAMIČKE VARIJABLE ---
    // Koristimo currentRoom jer se on menja kroz SignalR
    // const isImpostor = user?.username === currentRoom.usernameOfImpostor;
    // const isMyTurn = user?.username === currentRoom.currentTurnPlayerUsername;
    // const isVotingPhase = currentRoom.state === 2;

    // 0. Kreiranje SignalR konekcije na GameHub
    useEffect(() => {
        const newConnection = new HubConnectionBuilder()
            .withUrl("https://localhost:7277/gamehub")
            .withAutomaticReconnect()
            .build();

        newConnection.start()
            .then(() => {
                console.log("Povezan na GameHub");
                setConnection(newConnection);
            })
            .catch(err => console.error("Greška pri povezivanju na GameHub:", err));

        return () => {
            newConnection.stop();
        };
    }, []);

    // 1. Kontrola Intro ekrana - izvršava se samo jednom kada se konekcija uspostavi
    useEffect(() => {
        if (!connection) return; // Čekaj da se konekcija uspostavi
        
        const timer = setTimeout(() => {
            setShowIntro(false);
            console.log("Intro završen, obaveštavanje servera...");
            // Koristimo trenutnu vrednost currentStateNumber iz closure-a
            connection.invoke("StateEnded", roomId, currentStateNumber)
                .catch(err => console.error("Greška pri obaveštavanju o završetku stanja:", err));
        }, 5000);
        
        return () => clearTimeout(timer);
    }, [connection]); // Samo connection u dependency array - izvršava se jednom!

    // 2. Logika tajmera - Resetuje se kada se promeni currentRoom (novi igrač)
    useEffect(() => {
        if (showIntro || timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft, showIntro]);

    useEffect(() => {
        console.log("Promena gameState:", gameState);
        if (gameState?.state === GameState.ShowSecret) {
            setShowIntro(true);
            setIsImpostor(user?.username === gameState!.showSecretStates?.impostorName);
            setPlayers(gameState!.showSecretStates?.players || []);
            setIsVotingPhase(false);
            setSecretWord(gameState!.showSecretStates?.secretWord || "");
            setIsMyTurn(false);
        } else if (gameState?.state === GameState.InProgress) {
            setShowIntro(false);
            setIsMyTurn(user?.username === gameState!.inProgressStates?.currentPlayer);
            setCurrentTurnUsername(gameState!.inProgressStates?.currentPlayer || "");
            setRoundNumber(gameState!.inProgressStates?.roundNumber || 1);
            setMaxRounds(gameState!.inProgressStates?.maxRounds || 1);
            setIsVotingPhase(false);
        } else if (gameState?.state === GameState.Voting) {
            setShowIntro(false);
            setIsVotingPhase(true);
            setIsMyTurn(false);
        } else {
            setShowIntro(false);
            setIsVotingPhase(false);
            setIsMyTurn(false);
        }
    }
    ,[gameState])

   // 3. SIGNALR LISTENERS (Sređen cleanup da spreči dupliranje)
    useEffect(() => {
        if (!connection) return;

        // Prvo obrišemo sve stare listenere da budemo 100% sigurni
        connection.off("ReceiveMessage");
        connection.off("ReceiveClue");
        connection.off("UserVoted");
        connection.off("RoomUpdated");

        connection.invoke("JoinGame", roomId)

        connection.on("GameState", (IReturnState, stateNumber:number) => {
            console.log("Stiglo stanje igre:", IReturnState, stateNumber);
            setGameState(IReturnState);
            setCurrentStateNumber(stateNumber);
        });
        connection.on("ReceiveMessage", (msg: IMessage) => {
            setChatMessages(prev => [...prev, msg]);
        });

        connection.on("ReceiveClue", (newClue: IClue) => {
            console.log("Primljen trag:", newClue.clueWord);
            setCluesWords(prev => [...prev, newClue]);
        });

        connection.on("UserVoted", (username: string) => {
            setVotedPlayers(prev => [...prev, username]);
        });

        // connection.on("RoomUpdated", (updatedRoom: SendRoom) => {
        //     // Koristimo funkciju unutar setState da proverimo PRETHODNO stanje bez zavisnosti u nizu
        //     setCurrentRoom(prevRoom => {
        //         // Detekcija prelaska iz Voting (2) u InProgress/Finished
        //         if (prevRoom.state === 2 && updatedRoom.state !== 2) {
        //             setHasVoted(false);
        //             setVotedPlayers([]);
                    
        //             if (updatedRoom.lastEjectedUsername) {
        //                 setShowEjectionScreen(true);
        //                 setTimeout(() => setShowEjectionScreen(false), 5000);
        //             }
        //         }
        //         return updatedRoom;
        //     });
        //     setTimeLeft(updatedRoom.secondsPerTurn || 30);
        // });

        // CLEANUP: Gasi apsolutno sve listenere
        return () => {
            connection.off("ReceiveMessage");
            connection.off("ReceiveClue");
            connection.off("UserVoted");
            connection.off("RoomUpdated");
        };
    }, [connection]); // Uklonjen currentRoom.state iz zavisnosti da se ne bi restartovalo stalno

    // Dodatni mali effect za čišćenje glasanja
    // useEffect(() => {
    //     if (!isVotingPhase) {
    //         setHasVoted(false);
    //     }
    // }, [isVotingPhase]);


    const stateEndedHandler = () => {
        if (!connection) return;
        connection.invoke("StateEnded", roomId, currentStateNumber)
            .catch(err => console.error("Greška pri obaveštavanju o završetku stanja:", err));
    }


    // --- HANDLERS ---
    const handleSendMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (message.trim() === "" || !connection) return;

        const msg: IMessage = {
            userId: user?.id || '',
            username: user?.username || 'Nepoznati',
            content: message,
            timestamp: new Date().toISOString()
        };
        console.log("Saljemo poruku:", msg);
        connection.invoke("SendMessageToRoom", roomId, msg)
            .then(() => setMessage(""))
            .catch(err => console.error("Greška pri slanju poruke:", err));
    };

    const handleSendClue = () => {
        if (clue.trim() === "" || !connection) return;

        const clueDto = {
            userId: user?.id || '',
            username: user?.username || 'Nepoznati',
            clueWord: clue,
            timestamp: new Date().toISOString()
        };

        connection.invoke("SendClueToRoom", roomId, clueDto)
            .then(() => setClue("")) // Čistimo polje nakon slanja
            .catch(err => console.error("Greška pri slanju traga:", err));
        connection.invoke("StateEnded", roomId, currentStateNumber)
    };
    const handleVote = (targetUsername: string | null) => {
    if (hasVoted || !connection) return;

    const voteDto = {
        userId: user?.id,
        username: user?.username,
        targetUsername: targetUsername || "Preskočeno"
    };

    connection.invoke("VoteForPlayer", roomId, voteDto)
        .then(() => setHasVoted(true))
        .catch(err => console.error("Greška pri glasanju:", err));
    };

    return (
        <div className="min-h-screen bg-[#060608] text-white font-sans overflow-hidden">
            <AnimatePresence>
                {showIntro ? (
                    /* --- PHASE 1: INTRO (CS:GO STYLE) --- */
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
                        <motion.p className="text-xl text-gray-400 uppercase tracking-widest font-bold">
                            {isImpostor ? 'Eliminiši sve i ostani neprimećen' : 'Pronađi uljeza i završi misiju'}
                        </motion.p>
                    </motion.div>
                ) : (
                    /* --- PHASE 2: MAIN GAME UI --- */
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-screen w-full relative">
                        
                        {/* ANIMIRANA POZADINA */}
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

                        {/* TAJMER GORE DESNO */}
                        <div className="absolute top-4 right-[410px] z-30 flex items-center gap-4 bg-black/60 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-xl shadow-2xl">
                            <Clock className={timeLeft < 10 ? "text-red-500 animate-pulse" : "text-blue-400"} size={24} />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none mb-1">Preostalo vreme</span>
                                <span className={`text-2xl font-mono font-black leading-none ${timeLeft < 10 ? "text-red-500" : "text-white"}`}>
                                    00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                                </span>
                            </div>
                        </div>

                        {/* LEVA STRANA: TRAGOVI */}
                        <aside className="w-80 bg-white/[0.01] border-r border-white/10 backdrop-blur-3xl flex flex-col z-20">
                            <div className="p-6 border-b border-white/10 bg-white/[0.02]">
                                <h2 className="flex items-center gap-2 font-black uppercase tracking-widest text-xs text-gray-400">
                                    <History size={14} className="text-blue-400" /> Istorija Tragova
                                </h2>
                            </div>
                            
                            <div className="flex-grow overflow-y-auto p-4 space-y-3">
                                {clues.map((clueItem, index) => (
                                    <div key={index} className="p-4 rounded-2xl border bg-white/5 border-white/10">
                                        <p className="text-[10px] font-black mb-1 text-blue-400">
                                            {clueItem.username.toUpperCase()}
                                        </p>
                                        <p className="text-sm text-gray-300 italic">"{clueItem.clueWord}"</p>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 bg-blue-500/5 border-t border-blue-500/20">
                                {isMyTurn ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-blue-400">
                                            <Edit3 size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Tvoj red</span>
                                        </div>
                                        <input 
                                            type="text"
                                            placeholder="UNESI TRAG..."
                                            className="w-full bg-white/5 border-b-2 border-white/10 p-3 text-sm focus:border-blue-500 outline-none uppercase font-bold text-white"
                                            value={clue} 
                                            onChange={(e) => setClue(e.target.value)} 
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendClue()} 
                                        />
                                        <button onClick={handleSendClue} className="w-full py-3 bg-white text-black font-black rounded-xl text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
                                            POTVRDI
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                                            Čekamo da <br/> <span className="text-blue-400">{currentTurnUsername}</span> <br/> unese trag
                                        </p>
                                    </div>
                                )}
                            </div>
                        </aside>

                          {/* --- 1. MODAL ZA GLASANJE --- */}
                            <AnimatePresence>
                                {isVotingPhase && (
                                    <motion.div 
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                                    >
                                        <div className="bg-white/[0.03] border border-white/10 p-10 rounded-[3rem] max-w-4xl w-full shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent" />
                                            
                                            <div className="text-center mb-10">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">GLASANJE</h2>
                                                <p className="text-gray-500 text-xs font-bold tracking-[0.3em] mt-2">IDENTIFIKUJTE IMPOSTORA</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                                                {Object.values(players)
                                                    .filter(p => p !== user?.username) // Svi osim TEBE
                                                    .map((player) => (
                                                        <button
                                                            key={player}
                                                            disabled={hasVoted}
                                                            onClick={() => handleVote(player)}
                                                            className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                                                                hasVoted ? 'opacity-50 cursor-default border-white/5' : 'bg-white/5 border-white/10 hover:border-red-500/50 hover:bg-white/[0.08]'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center font-bold">{player[0]}</div>
                                                                <span className="font-black uppercase tracking-tight">{player}</span>
                                                            </div>
                                                            {/* Prikaz kvačice ako je igrač glasao */}
                                                            {votedPlayers.includes(player) && (
                                                                <div className="bg-green-500/20 text-green-500 text-[10px] px-2 py-1 rounded-md font-bold">SPREMAN</div>
                                                            )}
                                                        </button>
                                                    ))}
                                            </div>

                                            <button 
                                                disabled={hasVoted}
                                                onClick={() => handleVote(null)}
                                                className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                            >
                                                {hasVoted ? "Glasano" : "Skip Vote"}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* --- 2. CINEMATIC EJECTION EKRAN --- */}
                            {/* <AnimatePresence>
                                {showEjectionScreen && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[110] bg-black flex flex-col items-center justify-center text-center p-10"
                                    >
                                        <motion.div
                                            animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}
                                        >
                                            <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter text-white mb-6">
                                                {currentRoom.lastEjectedUsername === "Nerešeno" 
                                                    ? "NIKO NIJE IZBAČEN" 
                                                    : `${currentRoom.lastEjectedUsername?.toUpperCase()} JE IZBAČEN`}
                                            </h2>
                                            <p className="text-xl text-red-600 font-black tracking-[0.5em] uppercase">
                                                {currentRoom.isGameOver? "IMPOSTOR JE PRONAĐEN" : "POTRAGA SE NASTAVLJA..."}
                                            </p>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence> */}



                        {/* CENTAR: TAJNA REČ */}
                        <div className="flex-grow flex flex-col items-center justify-center p-8 z-10 relative">
                            <motion.div className="bg-white/[0.03] border border-white/10 backdrop-blur-3xl p-16 rounded-[4rem] shadow-2xl text-center">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest">
                                    Runda {roundNumber} / {maxRounds}
                                </div>
                                <h3 className="text-gray-500 uppercase font-black tracking-[0.4em] text-xs mb-6">Identitet: {isImpostor ? 'IMPOSTOR' : 'CREWMATE'}</h3>
                                <div className="space-y-2">
                                    <p className="text-gray-400 text-sm uppercase font-bold tracking-widest">Tajna reč:</p>
                                    <h2 className="text-7xl md:text-9xl font-black italic tracking-tighter uppercase bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
                                        {isImpostor ? '???' : secretWord}
                                    </h2>
                                </div>
                                <div className="mt-12 flex items-center justify-center gap-2 text-blue-400 font-bold uppercase tracking-widest text-sm">
                                    <UserIcon size={16} />
                                    <span>{currentTurnUsername} je na potezu</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* DESNA STRANA: CHAT */}
                        <aside className="w-96 bg-white/[0.02] border-l border-white/10 backdrop-blur-2xl flex flex-col z-20">
                            <div className="p-6 border-b border-white/10 flex items-center gap-3">
                                <MessageSquare className="text-blue-400" size={20} />
                                <h2 className="font-black uppercase tracking-widest text-sm text-gray-300">Chat</h2>
                            </div>
                            <div className="flex-grow overflow-y-auto p-6 space-y-4">
                                {chatMessages.map((msg, index) => (
                                    <div key={index} className={`p-4 rounded-2xl border ${msg.username === user?.username ? 'bg-blue-500/10 border-blue-500/20' : 'bg-white/5 border-white/10'}`}>
                                        <p className="text-[10px] font-black mb-1 text-blue-400">{msg.username.toUpperCase()}</p>
                                        <p className="text-sm text-gray-300">{msg.content}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="p-6 bg-black/40 border-t border-white/10">
                                <form className="flex gap-2" onSubmit={handleSendMessage}>
                                    <input 
                                        type="text"
                                        placeholder="Poruka..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                    <button className="bg-white text-black p-4 rounded-xl hover:bg-gray-200">
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        </aside>
                    </motion.div>)
                }
            </AnimatePresence>
        </div>
    );
};

export default Game;