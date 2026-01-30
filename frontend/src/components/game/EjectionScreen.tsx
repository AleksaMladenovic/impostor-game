import React from 'react';
import { motion } from 'framer-motion';

interface EjectionScreenProps {
    show: boolean;
    ejectedUsername?: string | null;
    wasImpostor?: boolean | null;
}

const EjectionScreen: React.FC<EjectionScreenProps> = ({ show, ejectedUsername, wasImpostor }) => {
    if (!show) return null;

    const isSkip = !ejectedUsername || ejectedUsername === 'skip';

    return (
        <motion.div
            key="ejection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black flex flex-col items-center justify-center text-center p-10"
        >
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                {isSkip ? (
                    <>
                        <h2 className="text-5xl md:text-7xl font-black italic uppercase text-white mb-6">NIKO NIJE IZBAČEN</h2>
                        <p className="text-xl text-blue-400 font-black tracking-[0.5em] uppercase animate-pulse">
                            POTRAGA SE NASTAVLJA...
                        </p>
                    </>
                ) : (
                    <>
                        <h2 className="text-5xl md:text-8xl font-black italic uppercase text-white mb-6 underline decoration-red-600 underline-offset-8">
                            {ejectedUsername.toUpperCase()} JE IZBAČEN
                        </h2>
                        <p
                            className={`text-2xl font-black tracking-[0.4em] uppercase mt-4 ${
                                wasImpostor ? 'text-green-500' : 'text-red-600'
                            }`}
                        >
                            {wasImpostor ? 'BIO JE IMPOSTOR' : 'NIJE BIO IMPOSTOR'}
                        </p>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
};

export default EjectionScreen;
