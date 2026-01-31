import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Trophy, Skull, Gamepad2, User as UserIcon } from 'lucide-react';
import api from '../axios';

interface UserStats {
    username: string;
    gamesPlayed: number;
    winsLikeCrewmate: number;
    winsLikeImpostor: number;
    totalScore: number;
}

const ProfilePage = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [stats, setStats] = useState<UserStats | null>(null);

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
                className="relative z-10 w-full max-w-2xl bg-white/[0.02] border border-white/10 backdrop-blur-3xl rounded-[3rem] p-8 md:p-12 shadow-2xl"
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