import React, { useState } from 'react';
import axios from 'axios';
import Lobby from './Lobby';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../axios';
import { useAuth } from '../context/AuthContext';
import { PlaySquare, User } from 'lucide-react';
import { BarChart3 } from 'lucide-react';

function HomePage() {
    const [joinRoomIdInput, setJoinRoomIdInput] = useState('');
    const [loading, setLoading] = useState(false);
    const {user} = useAuth(); 
    const navigate = useNavigate();

    const handleCreateRoom = async () => {
        setLoading(true);
        try {
            const response = await api.post(`/Rooms/create`);
            navigate(`/lobby/${response.data.roomId}`); 
        } catch (error) {
            alert("Greška na serveru!");
        } finally { setLoading(false); }
    };

    const handleJoinRoom = () => {
        const code = joinRoomIdInput.trim();
        if (!code) { alert("Unesi kod sobe!"); return; }
        navigate(`/lobby/${code}`);
    };


    return (
        <div className="min-h-screen bg-[#060608] flex items-center justify-center p-4 text-white font-sans relative overflow-hidden">

            
                {/* --- STATISTIKA / LEADERBOARD DUGME (Gornji levi ugao) --- */}
            <div className="absolute top-8 left-8 z-50">
                <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate('/statistics')}
                    className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-xl shadow-2xl transition-all group"
                >
                    <BarChart3 size={28} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
                    
                    <span className="absolute top-16 left-0 bg-white text-black text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest pointer-events-none">
                        Ranking
                    </span>
                </motion.button>
            </div>




              {/* --- PROFIL DUGME (Gornji desni ugao) --- */}
            <div className="absolute top-8 right-8 z-50 flex items-center gap-4">
                <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(`/profile/${user?.username}`)}
                    className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-xl shadow-2xl transition-all group"
                >
                    <User size={28} className="text-gray-400 group-hover:text-white transition-colors" />
                    
                    {/* Tooltip koji se pojavi na hover */}
                    <span className="absolute top-16 right-0 bg-white text-black text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest pointer-events-none">
                        Profil
                    </span>
                </motion.button>
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

            {/* --- SADRŽAJ KARTICE (z-10 da bi bio iznad krugova) --- */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-4xl bg-white/[0.03] border border-white/10 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
            >
                <div className="p-8 md:p-14">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent uppercase">
                            Impostor Game
                        </h1>
                        <p className="text-gray-500 tracking-[0.4em] text-xs mt-4 uppercase font-bold">Lobby Entry</p>
                    </div>


                    <div className="grid md:grid-cols-2 gap-12 md:gap-20 relative">
                        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6">
                            <h2 className="text-2xl font-bold uppercase tracking-tighter">Hostuj Partiju</h2>
                            <button
                                onClick={handleCreateRoom}
                                className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-wider"
                            >
                                {loading ? "Kreiranje..." : "Napravi Novu Sobu"}
                            </button>
                        </div>

                        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6">
                            <h2 className="text-2xl font-bold uppercase tracking-tighter">Pridruži se</h2>
                            <div className="w-full space-y-4">
                                <input
                                    type="text"
                                    placeholder="KOD SOBE"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center font-mono text-xl tracking-[0.3em] outline-none uppercase transition-all"
                                    value={joinRoomIdInput}
                                    onChange={(e) => setJoinRoomIdInput(e.target.value.toUpperCase())}
                                />
                                <button
                                    onClick={handleJoinRoom}
                                    className="w-full py-5 bg-transparent border-2 border-white/20 text-white font-black rounded-2xl hover:bg-white/5 transition-all uppercase tracking-wider"
                                >
                                    Uđi u Sobu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );


}

export default HomePage;