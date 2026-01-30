import React from 'react';
import { motion } from 'framer-motion';

interface GameIntroProps {
    isImpostor: boolean;
}

const GameIntro: React.FC<GameIntroProps> = ({ isImpostor }) => (
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
            <h1
                className={`text-6xl md:text-8xl font-black italic uppercase tracking-tighter mb-4 ${
                    isImpostor
                        ? 'text-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)]'
                        : 'text-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.5)]'
                }`}
            >
                {isImpostor ? 'IMPOSTOR' : 'CREWMATE'}
            </h1>
        </motion.div>
        <motion.p className="text-xl text-gray-400 uppercase tracking-widest font-bold">
            {isImpostor ? 'Eliminiši sve i ostani neprimećen' : 'Pronađi uljeza i završi misiju'}
        </motion.p>
    </motion.div>
);

export default GameIntro;
