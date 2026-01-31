import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, Trophy, Star, Target, 
    Gamepad2, Zap, TrendingUp 
} from 'lucide-react';
import api from '../axios';

interface LeaderboardUser {
    username: string;
    totalScore: number;
    winsLikeImpostor: number;
    winsLikeCrewmate: number;
    gamesPlayed: number;
}

const StatisticsPage = () => {
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    // State za sortiranje - podrazumevano po poenima
    const [sortBy, setSortBy] = useState<'points' | 'games' | 'crewmate' | 'impostor'>('points');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                // Slanje query parametra tvom backendu: api/User/leaderboard?sortBy=...
                const res = await api.get(`/User/leaderboard?sortBy=${sortBy}`);
                setLeaderboard(res.data);
            } catch (error) {
                console.error("Greška pri učitavanju:", error);
                // Fallback za testiranje ako backend nije dostupan
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [sortBy]); // Svaki put kada se promeni sortBy, šalje se novi zahtev

    return (
        <div className="min-h-screen bg-[#060608] text-white font-sans p-6 relative overflow-hidden flex flex-col items-center">
            
            {/* --- POZADINA --- */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                <motion.div animate={{ x: [0, 100, 0], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 10, repeat: Infinity }}
                    className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full" />
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

            {/* --- HEADER --- */}
            <div className="relative z-10 w-full max-w-5xl flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                <button 
                    onClick={() => navigate('/home')}
                    className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors uppercase font-black text-[10px] tracking-widest self-start"
                >
                    <ChevronLeft size={16} /> Nazad
                </button>
                
                <div className="text-center">
                    <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
                        Leaderboard
                    </h1>
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.5em] mt-2 italic">Globalni rang lista</p>
                </div>
                <div className="hidden md:block w-24" />
            </div>

            {/* --- FILTER TABS (Kontrole za sortiranje) --- */}
            <div className="relative z-10 flex flex-wrap justify-center gap-2 mb-8 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
                <SortTab 
                    label="Ukupni Poeni" 
                    active={sortBy === 'points'} 
                    onClick={() => setSortBy('points')} 
                    icon={<Zap size={14} />} 
                />
                <SortTab 
                    label="Odigrano" 
                    active={sortBy === 'games'} 
                    onClick={() => setSortBy('games')} 
                    icon={<Gamepad2 size={14} />} 
                />
                <SortTab 
                    label="Crewmate Wins" 
                    active={sortBy === 'crewmate'} 
                    onClick={() => setSortBy('crewmate')} 
                    icon={<Target size={14} />} 
                />
                <SortTab 
                    label="Impostor Wins" 
                    active={sortBy === 'impostor'} 
                    onClick={() => setSortBy('impostor')} 
                    icon={<Star size={14} />} 
                />
            </div>

            {/* --- RANG LISTA --- */}
            <motion.div 
                layout
                className="relative z-10 w-full max-w-4xl bg-white/[0.02] border border-white/10 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-2xl mb-20"
            >
                <div className="p-4 md:p-8 min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div 
                                key="loader"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="h-[400px] flex flex-col items-center justify-center gap-4"
                            >
                                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Sinhronizacija baze...</span>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="list"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="space-y-3"
                            >
                                {leaderboard.map((player, index) => (
                                    <motion.div
                                        layout
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        key={player.username}
                                        className={`flex items-center justify-between p-4 md:p-6 rounded-2xl border transition-all ${
                                            index === 0 
                                            ? 'bg-yellow-500/10 border-yellow-500/40 shadow-[0_0_30px_rgba(234,179,8,0.15)]' 
                                            : 'bg-white/[0.03] border-white/5 hover:border-white/20'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4 md:gap-8">
                                            {/* Pozicija */}
                                            <div className="w-8 flex justify-center">
                                                {index === 0 ? (
                                                    <Trophy className="text-yellow-500" size={28} />
                                                ) : (
                                                    <span className="text-xl font-black italic text-gray-600">#{index + 1}</span>
                                                )}
                                            </div>

                                            {/* Info o igraču */}
                                            <div>
                                                <h3 className="font-black uppercase text-base md:text-xl tracking-tight leading-none mb-2">
                                                    {player.username}
                                                </h3>
                                                <div className="flex flex-wrap gap-3 opacity-60">
                                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                                                        <Gamepad2 size={12} /> {player.gamesPlayed}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                                                        <Target size={12} /> {player.winsLikeCrewmate}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-500">
                                                        <Star size={12} /> {player.winsLikeImpostor}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Glavna cifra po kojoj se sortira */}
                                        <div className="text-right">
                                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">
                                                {sortBy === 'points' ? 'Total Score' : 
                                                 sortBy === 'games' ? 'Games Played' : 'Wins'}
                                            </p>
                                            <p className={`text-2xl md:text-4xl font-black italic tracking-tighter ${index === 0 ? 'text-yellow-500' : 'text-white'}`}>
                                                {sortBy === 'points' ? player.totalScore.toLocaleString() : 
                                                 sortBy === 'games' ? player.gamesPlayed : 
                                                 sortBy === 'crewmate' ? player.winsLikeCrewmate : player.winsLikeImpostor}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

// Pomoćna komponenta za tabove
const SortTab = ({ label, active, onClick, icon }: { label: string, active: boolean, onClick: () => void, icon: React.ReactNode }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
            active 
            ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105' 
            : 'text-gray-500 hover:text-white hover:bg-white/5'
        }`}
    >
        {icon}
        {label}
    </button>
);

export default StatisticsPage;