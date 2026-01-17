import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { auth } from "./firebase";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const login = useAuth().login;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            const user = auth.currentUser;
            if (user) {
                login({ id: user.uid, email: user.email!, emailVerified: user.emailVerified });
                navigate("/");
            }
        } catch (err: any) {
            setError("Pogrešan email ili lozinka.");
        }
    };

    // Varijante za animaciju kontejnera (staggered effect - jedan po jedan element)
    const containerVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                when: "beforeChildren",
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 text-white font-sans relative overflow-hidden">
            {/* Suptilni pozadinski sjaj */}
            <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-red-900/10 blur-[100px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-white/5 blur-[100px] rounded-full" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl p-10 rounded-[2rem] shadow-2xl relative z-10"
            >
                <motion.div variants={itemVariants} className="text-center mb-10">
                    <h1 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent uppercase">
                        Prijavi se
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm uppercase tracking-widest">Unesite svoje podatke</p>
                </motion.div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <motion.div variants={itemVariants}>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">Email Adresa</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-white placeholder-gray-600"
                            placeholder="tvoj@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">Lozinka</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-white placeholder-gray-600"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </motion.div>

                    <motion.div variants={itemVariants} className="pt-4">
                        <button
                            type="submit"
                            className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.15)] uppercase tracking-wider"
                        >
                            Uloguj se
                        </button>
                    </motion.div>
                </form>

                <motion.p variants={itemVariants} className="mt-8 text-center text-gray-500 text-sm">
                    Nemaš nalog?{" "}
                    <Link to="/register" className="text-white font-bold hover:underline underline-offset-4 transition-all">
                        Registruj se
                    </Link>
                </motion.p>
            </motion.div>
        </div>
    );
};

export default Login;