import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { reload, sendEmailVerification } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const VerifyEmail = () => {
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resending, setResending] = useState(false);
    const navigate = useNavigate();
    const {setVerified} = useAuth();

    useEffect(() => {
        const interval = setInterval(async () => {
            const user = auth.currentUser;
            if (user) {
                try {
                    await reload(user);
                    if (user.emailVerified) {
                        setVerified(true);
                        clearInterval(interval);
                        navigate("/game"); // Ili /complete-profile zavisno od tvog flow-a
                    }
                } catch (err: any) {
                    setError("Došlo je do greške pri automatskoj proveri.");
                }
            }
        }, 3000); // Smanjio sam na 3 sekunde radi boljeg UX-a
        return () => clearInterval(interval);
    }, [navigate]);

    const handleResendEmail = async () => {
        const user = auth.currentUser;
        if (user) {
            setResending(true);
            try {
                await sendEmailVerification(user);
                alert("Email za verifikaciju je ponovo poslat!");
            } catch (err) {
                setError("Previše pokušaja. Sačekaj malo pa pokušaj ponovo.");
            } finally {
                setResending(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6 text-white font-sans overflow-hidden">
            {/* Pozadinski glow efekti */}
            <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-900/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-red-900/10 blur-[120px] rounded-full" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-white/5 border border-white/10 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl relative z-10 text-center"
            >
                {/* Scanner/Radar Animacija */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                    <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-blue-500 rounded-full blur-xl"
                    />
                    <div className="relative w-full h-full border-4 border-blue-500/30 rounded-full flex items-center justify-center">
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute w-full h-full border-t-4 border-blue-400 rounded-full"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>

                <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-3xl font-black italic tracking-tighter bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent uppercase mb-4"
                >
                    Provera Identiteta
                </motion.h1>

                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-gray-400 leading-relaxed mb-8"
                >
                    Poslali smo tajni link na tvoj email. <br /> 
                    <span className="text-white font-semibold italic">Klikni na njega</span> da aktiviraš pristup sistemu.
                </motion.p>

                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3 bg-white/5 border border-white/5 py-3 rounded-xl">
                        <motion.div 
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-2 h-2 bg-blue-500 rounded-full"
                        />
                        <p className="text-xs uppercase tracking-[0.2em] font-bold text-blue-400">
                            Skeniram status verifikacije...
                        </p>
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm font-medium">{error}</p>
                    )}

                    <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
                        <button 
                            onClick={handleResendEmail}
                            disabled={resending}
                            className="text-sm text-gray-500 hover:text-white transition-colors uppercase font-bold tracking-widest"
                        >
                            {resending ? "Slanje..." : "Nisi dobio email? Pošalji ponovo"}
                        </button>
                        
                        <button 
                            onClick={() => window.location.reload()}
                            className="text-[10px] text-gray-700 hover:text-gray-400 transition-colors uppercase tracking-[0.3em]"
                        >
                            Osveži stranicu ručno
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default VerifyEmail;