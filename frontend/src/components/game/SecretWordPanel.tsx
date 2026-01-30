import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface SecretWordPanelProps {
    roundNumber: number;
    maxRounds: number;
    isImpostor: boolean;
    secretWord: string;
    currentTurnUsername: string;
}

const SecretWordPanel: React.FC<SecretWordPanelProps> = ({
    roundNumber,
    maxRounds,
    isImpostor,
    secretWord,
    currentTurnUsername
}) => (
    <div className="flex-grow flex flex-col items-center justify-center p-8 z-10 relative">
        <motion.div className="bg-white/[0.03] border border-white/10 backdrop-blur-3xl p-16 rounded-[4rem] shadow-2xl text-center">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest">
                Runda {roundNumber} / {maxRounds}
            </div>
            <h3 className="text-gray-500 uppercase font-black tracking-[0.4em] text-xs mb-6">
                Identitet: {isImpostor ? 'IMPOSTOR' : 'CREWMATE'}
            </h3>
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
);

export default SecretWordPanel;
