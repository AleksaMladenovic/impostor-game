import React, { useState, useEffect } from 'react';
import { HubConnectionBuilder, HubConnection } from '@microsoft/signalr';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, Copy, Check, LogOut, Play } from 'lucide-react'; // Instaliraj lucide-react ako nemaš
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

interface Player {
    connectionId: string;
    userId: string;
    username: string;
    isHost: boolean;
}


// export interface SendRoom {
//     roomId: string;
//     currentRound?: number;
//     currentTurnPlayerUserId?: string | null;
//     currentTurnPlayerUsername?: string | null;
//     secretWord?: string | null;
//     usernameOfImpostor?: string | null;
//     state?: GameState;
//     numberOfRounds?: number;
//     secondsPerTurn?: number;
//     lastEjectedUsername?: string | null;
//     players:Record<string, Player>;
//     isGameOver?: boolean;
// }


const Lobby = () => {
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const [players, setPlayers] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);
    const { roomId } = useParams();
    const user = useAuth().user;
    const username = user?.username;
    const navigate = useNavigate();

    // Funkcija za kopiranje ID-a
    const copyToClipboard = () => {
        navigator.clipboard.writeText(roomId || "");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        const newConnection = new HubConnectionBuilder()
            .withUrl("https://localhost:7277/lobbyhub")
            .withAutomaticReconnect()
            .build();

        const handleBeforeUnload = async () => {
            try {
                console.log("Napuštanje sobe (beforeunload)...");
                await newConnection?.invoke("LeaveRoomWithDelay", username, roomId, 2);
            } catch (e) {
                // možeš logovati grešku ako želiš
            }
        };

        newConnection.start()
            .then(() => {
                console.log("Povezan na LobbyHub");
                setConnection(newConnection);
                newConnection.invoke("JoinRoom", roomId, username);
            })
            .catch(err => console.error("Greška pri povezivanju: ", err));

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            console.log("Komponenta se unmountuje (back button ili navigate)...");
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // Cleanup async logic inside a synchronous function
            (async () => {
                try {
                    await newConnection?.invoke("LeaveRoomWithDelay", username, roomId, 2);
                } catch (e) {
                    // grešku možeš logovati
                }
                newConnection.stop();
            })();
        }
    }, [roomId, username]);

    useEffect(() => {
        if (connection) {
            connection.on("PlayerListUpdated", (updatedPlayers: string[]) => {
                setPlayers(updatedPlayers);
            });
            connection.on("GameStarted", async () => {
                await handleInstaLeave();
                navigate(`/game/${roomId}`);
            });
            connection.on("Error", (message: string) => {
                alert(message);
                navigate('/home');
            });

            return () => {
                connection.off("PlayerListUpdated");
                connection.off("GameStarted");
                connection.off("Error");
            };
        }
    }, [connection]);

    // Proveravamo da li je trenutni korisnik Host (prvi u nizu je host)
    const isCurrentUserHost = players[0] === username;

    // Podesavanja za timer i broj rundi
    const [timer, setTimer] = useState(30); // sekunde, default 30
    const [rounds, setRounds] = useState(2); // default 2

    const handleNapusti = async () => {
        await handleInstaLeave();
        navigate('/home')
    };

    const handleInstaLeave = async () => {
        try {
            console.log("Napuštanje sobe (instant)...");
            await connection?.invoke("LeaveRoom", username);
        } catch (e) {
            // možeš logovati grešku ako želiš
        }
    };

    const handlePokreniIgru = async () => {
        try {
            console.log("Pokretanje igre...");
            await connection?.invoke("StartGame", roomId, rounds, timer);
        } catch (e) {
            console.error("Greška pri pokretanju igre: ", e);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white font-sans p-4 md:p-8 relative overflow-hidden">
            {/* Ambientalne animacije u pozadini */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {/* Plavi krug - sada je svetliji (600) i jači (25%) */}
                <motion.div
                    animate={{
                        x: [0, 80, 0],
                        y: [0, 40, 0],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-15%] left-[-10%] w-[70%] h-[70%] bg-blue-600/25 blur-[130px] rounded-full"
                />

                {/* Crveni krug - sada je svetliji (600) i jači (20%) */}
                <motion.div
                    animate={{
                        x: [0, -60, 0],
                        y: [0, 80, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-15%] right-[-10%] w-[70%] h-[70%] bg-red-600/20 blur-[130px] rounded-full"
                />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">

                {/* TOP BAR - Room Info */}
                <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-2xl">
                            <Users className="text-blue-400 w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xs uppercase tracking-[0.3em] text-gray-500 font-bold">Lobby Partije</h1>
                            <p className="text-xl font-black italic tracking-tight">Setup</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-black/40 px-6 py-3 rounded-2xl border border-white/5">
                        <span className="text-gray-500 text-xs font-bold tracking-widest uppercase">ID Sobe:</span>
                        <span className="font-mono text-xl text-blue-400 font-bold tracking-widest">{roomId}</span>
                        <button
                            onClick={copyToClipboard}
                            className="ml-2 p-2 hover:bg-white/10 rounded-lg transition-all"
                        >
                            {copied ? <Check className="text-green-400 w-5 h-5" /> : <Copy className="text-gray-400 w-5 h-5" />}
                        </button>
                    </div>

                    <button
                        onClick={handleNapusti}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all font-bold text-sm uppercase"
                    >
                        <LogOut size={18} /> Napusti
                    </button>
                </header>

                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Lista igrača */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                            Igrači u sobi <span className="bg-white/10 px-2 py-0.5 rounded text-[10px]">{players.length}/5</span>
                        </h2>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <AnimatePresence>
                                {players.map((player) => (
                                    <motion.div
                                        key={player}
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className={`relative group overflow-hidden bg-white/5 border ${player === username ? 'border-blue-500/40' : 'border-white/10'} p-5 rounded-[1.5rem] backdrop-blur-md flex items-center gap-4 transition-all hover:bg-white/[0.08]`}
                                    >
                                        <div className="relative">
                                            <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center font-bold text-xl border border-white/10">
                                                {player[0].toUpperCase()}
                                            </div>
                                            {player === players[0] && (
                                                <div className="absolute -top-2 -right-2 bg-yellow-500 p-1 rounded-full shadow-lg">
                                                    <Crown size={20} className="text-black" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <p className="font-bold text-lg leading-none mb-1">
                                                {player}
                                                {player === username && <span className="ml-2 text-[10px] text-blue-400 uppercase tracking-tighter">(Ti)</span>}
                                            </p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Spreman za igru</p>
                                        </div>

                                        {player === players[0] && (
                                            <span className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-1 rounded-md font-bold uppercase tracking-tighter">
                                                Host
                                            </span>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/*  Game Controls / Chat Placeholder */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-b from-white/[0.07] to-transparent border border-white/10 p-8 rounded-[2rem] text-center">
                            <h3 className="text-xl font-black italic mb-2 uppercase tracking-tighter">Status Partije</h3>
                            {!isCurrentUserHost && (
                                <p className="text-gray-500 text-sm mb-8">Čekamo da Host pokrene igru...</p>)}

                            {isCurrentUserHost ? (
                                <div className="space-y-4">
                                    <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                                        <div className="flex flex-col items-start">
                                            <label htmlFor="timer" className="text-xs font-bold uppercase text-gray-400 mb-1">Vreme po rundi (sekunde)</label>
                                            <input
                                                id="timer"
                                                type="number"
                                                min={10}
                                                max={120}
                                                step={1}
                                                value={timer}
                                                onChange={e => setTimer(Math.max(10, Math.min(120, Number(e.target.value))))}
                                                className="w-32 px-3 py-2 rounded-lg border border-gray-300 text-black font-bold text-center bg-white"
                                            />
                                            <span className="text-[10px] text-white-500 mt-1">(10s - 120s)</span>
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <label htmlFor="rounds" className="text-xs font-bold uppercase text-gray-400 mb-1">Broj rundi</label>
                                            <input
                                                id="rounds"
                                                type="number"
                                                min={1}
                                                max={5}
                                                step={1}
                                                value={rounds}
                                                onChange={e => setRounds(Math.max(1, Math.min(5, Number(e.target.value))))}
                                                className="w-32 px-3 py-2 rounded-lg border border-gray-300 text-black font-bold text-center bg-white"
                                            />
                                            <span className="text-[10px] text-white-500 mt-1">(1 - 5)</span>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={handlePokreniIgru}
                                        className="w-full py-5 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:bg-gray-200 transition-all uppercase tracking-widest"
                                    >
                                        <Play fill="black" size={20} /> Pokreni Igru
                                    </motion.button>
                                </div>
                            ) : (
                                <div className="py-5 border-2 border-dashed border-white/10 rounded-2xl text-gray-600 font-bold uppercase text-xs tracking-[0.2em]">
                                    Samo Host može da krene
                                </div>
                            )}
                        </div>

                        {/* Saveti / Chat Placeholder */}
                        <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem]">
                            <p className="text-[10px] uppercase font-bold text-blue-400 mb-2 tracking-widest">Pro Tip:</p>
                            <p className="text-xs text-gray-400 italic">"Pazi kome veruješ. Impostor je možda baš onaj koji najviše ćuti u lobiju!"</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Lobby;