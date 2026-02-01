import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Trophy, Skull, Gamepad2, User as UserIcon, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../axios';
import { IOdigranaPartija } from '../interfaces/IOdigranaPartija';

interface UserStats {
    username: string;
    gamesPlayed: number;
    winsLikeCrewmate: number;
    winsLikeImpostor: number;
    totalScore: number;
}

interface IChronoResponse {
    state: IOdigranaPartija;
    nextTime: string | null;
}

const ProfilePage = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [stats, setStats] = useState<UserStats | null>(null);
    const [gameHistory, setGameHistory] = useState<IOdigranaPartija[]>([]);
    const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set());
    const [openChats, setOpenChats] = useState<Set<string>>(new Set());
    const [chronoStates, setChronoStates] = useState<Record<string, { current: IOdigranaPartija; nextTime: string | null }>>({});

    const mergeRoundMaps = (
        base: Record<number, Record<string, string>>,
        incoming: Record<number, Record<string, string>>
    ) => {
        const merged: Record<number, Record<string, string>> = { ...base };
        Object.entries(incoming).forEach(([roundKey, value]) => {
            const roundNum = Number(roundKey);
            merged[roundNum] = {
                ...(merged[roundNum] || {}),
                ...value,
            };
        });
        return merged;
    };

    const mergeChronoState = (current: IOdigranaPartija, incoming: IOdigranaPartija) => {
        return {
            ...current,
            id: current.id || incoming.id,
            roomId: current.roomId || incoming.roomId,
            brojRundi: Math.max(current.brojRundi || 0, incoming.brojRundi || 0),
            igraci: incoming.igraci && incoming.igraci.length > 0 ? incoming.igraci : current.igraci,
            cluoviPoRundi: mergeRoundMaps(current.cluoviPoRundi || {}, incoming.cluoviPoRundi || {}),
            glasanjaPoRundi: mergeRoundMaps(current.glasanjaPoRundi || {}, incoming.glasanjaPoRundi || {}),
            poruke: [...(current.poruke || []), ...(incoming.poruke || [])],
            vremeKraja: current.vremeKraja || incoming.vremeKraja,
        };
    };

    const toggleGame = (gameId: string) => {
        setExpandedGames(prev => {
            const newSet = new Set(prev);
            if (newSet.has(gameId)) {
                newSet.delete(gameId);
            } else {
                newSet.add(gameId);
            }
            return newSet;
        });
    };

    const toggleChat = (gameId: string) => {
        setOpenChats(prev => {
            const newSet = new Set(prev);
            if (newSet.has(gameId)) {
                newSet.delete(gameId);
            } else {
                newSet.add(gameId);
            }
            return newSet;
        });
    };

    const startChrono = (game: IOdigranaPartija) => {
        const resetState: IOdigranaPartija = {
            ...game,
            cluoviPoRundi: {},
            glasanjaPoRundi: {},
            poruke: [],
        };
        setChronoStates(prev => ({
            ...prev,
            [game.id]: { current: resetState, nextTime: null },
        }));
        setOpenChats(prev => {
            const newSet = new Set(prev);
            newSet.delete(game.id);
            return newSet;
        });
    };

    const cancelChrono = (gameId: string) => {
        setChronoStates(prev => {
            const updated = { ...prev };
            delete updated[gameId];
            return updated;
        });
        setOpenChats(prev => {
            const newSet = new Set(prev);
            newSet.delete(gameId);
            return newSet;
        });
    };

    const fetchChronoStep = async (gameId: string, significant: boolean) => {
        const chrono = chronoStates[gameId];
        if (!chrono) return;

        const endpoint = significant
            ? `/User/history/${gameId}/next-significant`
            : `/User/history/${gameId}/next`;

        try {
            const res = await api.get<IChronoResponse>(endpoint, {
                params: { lastTimestamp: chrono.nextTime ?? null },
            });
            const incoming = res.data.state;
            const merged = mergeChronoState(chrono.current, incoming);
            setChronoStates(prev => ({
                ...prev,
                [gameId]: { current: merged, nextTime: res.data.nextTime ?? null },
            }));
        } catch (err) {
            console.error("Greška:", err);
            alert("Neuspešan hronološki prikaz partije");
        }
    };

    useEffect(() => {
        // DODAJ "profile/" U PUTANJU
        api.get(`/User/profile/${username}`)
            .then(res => {
                setStats(res.data);
            })
            .catch(err => {
                console.error("Greška:", err);
                alert("Profil nije pronađen");
            });
    }, [username]);

    useEffect(() => {
        api.get(`/User/history/${username}`)
            .then(res => {
                console.log("Istorija igara:");
                console.log(res.data);
                setGameHistory(res.data);
            })
            .catch(err => {
                console.error("Greška:", err);
                alert("Istorija igara nije pronađena");
            });
    }, [username]);


    if (!stats) return <div className="min-h-screen bg-[#060608] text-white flex items-center justify-center font-black italic text-3xl">UČITAVANJE INFORMACIJA O PROFILU</div>;

    return (
        <div className="min-h-screen bg-[#060608] flex items-center justify-center p-6 text-white font-sans relative overflow-hidden">
            {/* Zadržavamo pozadinske krugove radi konzistentnosti */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-900/10 blur-[120px] rounded-full" />
            </div>

            {/* --- DINAMIČNI KRUGOVI KOJI SE SAMI KREĆU --- */}
            <div className="absolute inset-0 z-0 pointer-events-none">

                {/* Krug 1: Polako lebdi dijagonalno */}
                <motion.div
                    animate={{
                        x: [0, 300, 0],
                        y: [0, 400, 0],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute top-10 left-10 w-64 h-64 rounded-full border border-white/10 bg-white/[0.5] blur-2xl"
                />

                {/* Krug 2: Kreće se sa desna na levo */}
                <motion.div
                    animate={{
                        x: [0, -400, 0],
                        y: [0, 200, 0],
                    }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear", delay: 2 }}
                    className="absolute top-1/2 right-10 w-96 h-96 rounded-full border border-white/5 bg-white/[0.4] blur-3xl"
                />

                {/* Krug 3: Manji krug koji brzo pulsira i šeta */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 150, -150, 0],
                        y: [0, -150, 150, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-20 left-1/3 w-40 h-40 rounded-full border border-white/20 bg-white/[0.4] blur-xl"
                />

                {/* Krug 4: Veliki spori krug u pozadini */}
                <motion.div
                    animate={{
                        rotate: 360,
                        x: [0, 100, 0]
                    }}
                    transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full border border-white/[0.2] bg-white/[0.2] blur-[80px]"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-6xl bg-white/[0.02] border border-white/10 backdrop-blur-3xl rounded-[3rem] p-8 md:p-12 shadow-2xl"
            >
                {/* Back Button */}
                <button
                    onClick={() => navigate('/home')}
                    className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-white transition-colors uppercase font-black text-[10px] tracking-widest"
                >
                    <ChevronLeft size={16} /> Nazad
                </button>

                {/* Avatar & Header */}
                <div className="flex flex-col items-center mb-12">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full flex items-center justify-center p-1 mb-4 shadow-[0_0_30px_rgba(37,99,235,0.3)]">
                        <div className="w-full h-full bg-[#0a0a0c] rounded-full flex items-center justify-center">
                            <UserIcon size={60} className="text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase">{stats.username}</h1>
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.5em] mt-2">Identifikovan Igrac</p>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Stat Item: Odigrane partije */}
                    <StatCard
                        icon={<Gamepad2 className="text-gray-400" />}
                        label="Odigrano"
                        value={stats.gamesPlayed}
                        color="border-white/5"
                    />

                    {/* Stat Item: Crewmate Pobede */}
                    <StatCard
                        icon={<Trophy className="text-blue-400" />}
                        label="Crewmate Wins"
                        value={stats.winsLikeCrewmate}
                        color="border-blue-500/20"
                    />

                    {/* Stat Item: Impostor Pobede */}
                    <StatCard
                        icon={<Skull className="text-red-500" />}
                        label="Impostor Wins"
                        value={stats.winsLikeImpostor}
                        color="border-red-500/20"
                    />
                </div>

                {/* Total Score Section */}
                <div className="mt-12 p-8 bg-white/[0.03] border border-white/5 rounded-[2rem] text-center">
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Ukupni Skor</p>
                    <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
                        {stats.totalScore.toLocaleString()}
                    </h2>
                </div>

                {/* Game History Section */}
                {gameHistory.length > 0 && (
                    <div className="mt-12">
                        <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mb-6 text-center">Istorija Igara</h3>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {gameHistory.map((game, index) => {
                                const chronoState = chronoStates[game.id];
                                const displayGame = chronoState?.current || game;
                                const isChrono = Boolean(chronoState);
                                return (
                                <motion.div
                                    key={game.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white/[0.03] border border-white/5 rounded-[1.5rem] overflow-hidden"
                                >
                                    {/* Game Header - Click to expand */}
                                    <div 
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-all"
                                        onClick={() => toggleGame(game.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            {expandedGames.has(game.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Partija</p>
                                                <p className="text-sm font-bold text-white/90">
                                                    {new Date(displayGame.vremeKraja).toLocaleDateString('sr-RS', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest">Runde</p>
                                                <p className="text-lg font-black text-blue-400">{displayGame.brojRundi}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest">Igrači</p>
                                                <p className="text-lg font-black text-white">{displayGame.igraci.length}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    <AnimatePresence>
                                        {expandedGames.has(game.id) && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="border-t border-white/5"
                                            >
                                                <div className="flex">
                                                    {/* Main Content Area - Rounds */}
                                                    <div className={`p-6 transition-all ${openChats.has(game.id) ? 'flex-1' : 'w-full'}`}>
                                                        {/* Chrono Controls */}
                                                        <div className="mb-4 flex flex-wrap items-center gap-3">
                                                            {!isChrono ? (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        startChrono(game);
                                                                    }}
                                                                    className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest"
                                                                >
                                                                    Pogledaj hronološki
                                                                </button>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            fetchChronoStep(game.id, false);
                                                                        }}
                                                                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest text-blue-300"
                                                                    >
                                                                        Sledeći
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            fetchChronoStep(game.id, true);
                                                                        }}
                                                                        className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest text-purple-300"
                                                                    >
                                                                        Sledeći bitni
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            cancelChrono(game.id);
                                                                        }}
                                                                        className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest"
                                                                    >
                                                                        Otkaži
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Chat Toggle Button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleChat(game.id);
                                                            }}
                                                            className="mb-4 p-3 bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 rounded-xl transition-all flex items-center gap-2"
                                                        >
                                                            <MessageSquare size={16} />
                                                            <span className="text-[9px] font-black uppercase tracking-wider">Chat</span>
                                                            <span className="text-xs font-bold text-blue-400">({displayGame.poruke.length})</span>
                                                        </button>

                                                        {/* Rounds Table */}
                                                        <div className="space-y-3">
                                                            {Array.from({ length: displayGame.brojRundi }, (_, i) => i + 1).map(roundNum => {
                                                                const roundClues = displayGame.cluoviPoRundi[roundNum] || {};
                                                                const roundVotes = displayGame.glasanjaPoRundi[roundNum] || {};
                                                                
                                                                return (
                                                                    <div key={roundNum} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                                                                        <div className="flex items-center gap-2 mb-3">
                                                                            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                                                                                <span className="text-xs font-black text-blue-400">R{roundNum}</span>
                                                                            </div>
                                                                            <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Runda {roundNum}</span>
                                                                        </div>
                                                                        
                                                                        {/* Table Layout */}
                                                                        <div className="grid grid-cols-3 gap-4">
                                                                            {/* Players Column */}
                                                                            <div>
                                                                                <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest mb-2">Igrači</p>
                                                                                <div className="space-y-1">
                                                                                    {displayGame.igraci.map((player, idx) => (
                                                                                        <div key={idx} className="text-xs font-semibold text-white/70 px-2 py-1 bg-white/[0.02] rounded">
                                                                                            {player}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            {/* Clues Column */}
                                                                            <div>
                                                                                <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest mb-2">Clues</p>
                                                                                <div className="space-y-1">
                                                                                    {displayGame.igraci.map((player, idx) => (
                                                                                        <div key={idx} className="text-xs font-semibold px-2 py-1 bg-white/[0.02] rounded">
                                                                                            {roundClues[player] ? (
                                                                                                <span className="text-blue-300">{roundClues[player]}</span>
                                                                                            ) : (
                                                                                                <span className="text-gray-600 italic">—</span>
                                                                                            )}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            {/* Votes Column */}
                                                                            <div>
                                                                                <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest mb-2">Glasanje</p>
                                                                                <div className="space-y-1">
                                                                                    {displayGame.igraci.map((player, idx) => (
                                                                                        <div key={idx} className="text-xs font-semibold px-2 py-1 bg-white/[0.02] rounded">
                                                                                            {roundVotes[player] ? (
                                                                                                <span className="text-red-300">{roundVotes[player]}</span>
                                                                                            ) : (
                                                                                                <span className="text-gray-600 italic">—</span>
                                                                                            )}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Chat Side Panel */}
                                                    <AnimatePresence>
                                                        {openChats.has(game.id) && (
                                                            <motion.div
                                                                initial={{ width: 0, opacity: 0 }}
                                                                animate={{ width: 350, opacity: 1 }}
                                                                exit={{ width: 0, opacity: 0 }}
                                                                transition={{ duration: 0.3 }}
                                                                className="bg-[#0a0a0c]/95 backdrop-blur-xl border-l border-white/10 p-6 flex flex-col"
                                                            >
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <h4 className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Poruke</h4>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            toggleChat(game.id);
                                                                        }}
                                                                        className="text-gray-500 hover:text-white text-xs"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                                <div className="flex-1 space-y-2 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                                                    {displayGame.poruke.length === 0 ? (
                                                                        <p className="text-xs text-gray-500 italic text-center mt-8">Nema poruka</p>
                                                                    ) : (
                                                                        displayGame.poruke.map((msg, idx) => (
                                                                            <div key={idx} className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <span className="text-xs font-bold text-blue-400">{msg.username}</span>
                                                                                    <span className="text-[8px] text-gray-600">
                                                                                        {new Date(msg.timestamp).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-xs text-white/80">{msg.content}</p>
                                                                            </div>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                            })}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

// Pomoćna komponenta za kartice statistike
const StatCard = ({ icon, label, value, color }: any) => (
    <div className={`bg-white/[0.03] border ${color} p-6 rounded-[2rem] flex flex-col items-center text-center transition-all hover:bg-white/[0.05]`}>
        <div className="mb-3">{icon}</div>
        <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-1">{label}</span>
        <span className="text-2xl font-black tracking-tight">{value}</span>
    </div>
);

export default ProfilePage;