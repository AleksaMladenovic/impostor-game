import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "./firebase";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import api from "../axios";

const Register = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const login = useAuth().login;

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!validateForm()) {
            return;
        }
        try {

            const usernameExists:Boolean = (await api.get(`/User/usernameAlreadyExists/${username}`)).data;
            console.log({usernameExists});
            if (usernameExists) {
                throw { code: 'auth/username-already-in-use' };
            }
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            if (user) {
                login({ id: user.uid, email: user.email!, username: username });
                await sendEmailVerification(user);
                navigate("/verify-email");
            }
        } catch (err: any) {
            // Prevodimo najčešće Firebase greške na srpski
            if (err.code === 'auth/email-already-in-use') {
                setError("Ovaj email je već u upotrebi.");
            } else if (err.code === 'auth/weak-password') {
                setError("Lozinka mora imati bar 6 karaktera.");
            }else if (err.code === 'auth/username-already-in-use') {
                setError("Ovaj username je već u upotrebi. Probaj neki drugi.");
            } else {
                setError("Došlo je do greške pri registraciji.");
            } 
        }
    };

    const validateForm = () => {
        let valid = true;
        setUsernameError(null);
        setEmailError(null);
        setPasswordError(null);
        setConfirmPasswordError(null);
        if (username.trim() === "") {
            setUsernameError("Username je obavezan.");
            valid = false;
        }
        if (username.length < 3) {
            setUsernameError("Username mora imati bar 3 karaktera.");
            valid = false;
        }

        if (email.trim() === "") {
            setEmailError("Email je obavezan.");
            valid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setEmailError("Unesi validnu email adresu.");
            valid = false;
        }
        if (password.length < 6) {
            setPasswordError("Lozinka mora imati bar 6 karaktera.");
            valid = false;
        }
        if (password !== confirmPassword) {
            setConfirmPasswordError("Lozinke se ne poklapaju.");
            valid = false;
        }
        return valid;
    }

    // Animacije identične onima na Login stranici radi konzistentnosti
    const containerVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
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
            {/* Pozadinski glow efekti */}
            <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-red-900/10 blur-[100px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-white/5 blur-[100px] rounded-full" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl p-10 rounded-[2rem] shadow-2xl relative z-10"
            >
                <motion.div variants={itemVariants} className="text-center mb-10">
                    <h1 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent uppercase">
                        Novi Nalog
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm uppercase tracking-widest">Postani deo igre</p>
                </motion.div>

                <form onSubmit={handleRegister}>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} 
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm text-center font-medium mt-4"
                        >
                            {error}
                        </motion.div>
                    )}

                    <motion.div variants={itemVariants} className="mt-4">
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">Username</label>
                        <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-white placeholder-gray-600"
                            placeholder="Tvoj username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </motion.div>
                    {usernameError && (
                        <label className="block text-xs font-bold uppercase tracking-widest text-red-500 mb-2 ml-1 mt-1">{usernameError}</label>
                    )}
                    <motion.div variants={itemVariants} className="mt-4">
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">Email Adresa</label>
                        <input
                            type="email"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-white placeholder-gray-600"
                            placeholder="tvoj@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </motion.div>
                    {emailError && (
                        <label className="block text-xs font-bold uppercase tracking-widest text-red-500 mb-2 ml-1 mt-1">{emailError}</label>
                    )}

                    <motion.div variants={itemVariants} className="mt-4">
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">Lozinka</label>
                        <input
                            type="password"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-white placeholder-gray-600"
                            placeholder="Minimum 6 karaktera"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </motion.div>
                    {passwordError && (
                        <label className="block text-xs font-bold uppercase tracking-widest text-red-500 mb-2 ml-1 mt-1">{passwordError}</label>
                    )}
                    <motion.div variants={itemVariants} className="mt-4">
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">Potvrda lozinke</label>
                        <input
                            type="password"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-white placeholder-gray-600"
                            placeholder="Minimum 6 karaktera"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </motion.div>
                    
                    {confirmPasswordError && (
                        <label className="block text-xs font-bold uppercase tracking-widest text-red-500 mb-2 ml-1 mt-1">{confirmPasswordError}</label>
                    )}
                    <motion.div variants={itemVariants} className="pt-4 mt-6">
                        <button
                            type="submit"
                            className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.15)] uppercase tracking-wider"
                        >
                            Registruj se
                        </button>
                    </motion.div>
                </form>

                <motion.p variants={itemVariants} className="mt-8 text-center text-gray-500 text-sm">
                    Već imaš nalog?{" "}
                    <Link to="/login" className="text-white font-bold hover:underline underline-offset-4 transition-all">
                        Prijavi se
                    </Link>
                </motion.p>
            </motion.div>
        </div>
    );
};

export default Register;