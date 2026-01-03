import { createUserWithEmailAndPassword, sendEmailVerification, reload } from "firebase/auth";
import { auth } from "./firebase";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const navigate = useNavigate();
    const login = useAuth().login;

    const handleRegister = async (e: any) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            const user = auth.currentUser;
            if (user) {
                //uspesna registracija, prebaci na potvrdu emaila
                login({ id: user.uid, email: user.email! });
                sendEmailVerification(user);
                navigate("/verify-email");
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    // const handleCheckVerification = async () => {
    //     const user = auth.currentUser;
    //     if (user) {
    //         await reload(user);
    //         if (user.emailVerified) {
    //             setVerificationStatus("Email je uspešno verifikovan! Preusmeravamo vas na dopunu profila...");
    //             login({ id: user.uid, email: user.email! });
    //             setTimeout(() => {
    //                 navigate("/complete-profile");
    //             }, 1500);
    //         } else {
    //             setVerificationStatus("Email još uvek nije verifikovan. Proverite inbox i kliknite na link u poruci.");
    //         }
    //     } else {
    //         setVerificationStatus("Niste prijavljeni.");
    //     }
    // };

    return (
        <form className="p-10 border-2 rounded-lg shadow-md w-96" onSubmit={handleRegister}>
            <h3>Registracija</h3>
            {error && <div className="error text-red-500 mb-2">{error}</div>}
            {success && <div className="text-green-600 mb-2">{success}</div>}
            <div className="mb-3">
                <label>Email</label>
                <input
                    type="email"
                    className="form-control"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div className="mb-3">
                <label>Password</label>
                <input
                    type="password"
                    className="form-control"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            <button type="submit" className="btn btn-primary w-full">Registruj se</button>
            
        </form>
    );
};

export default Register;