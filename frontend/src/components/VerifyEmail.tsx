import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { reload } from "firebase/auth";

const VerifyEmail = () => {
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(async () => {
            const user = auth.currentUser;
            if (user) {
                setChecking(true);
                try {
                    await reload(user);
                    if (user.emailVerified) {
                        setChecking(false);
                        navigate("/complete-profile");
                    }
                } catch (err: any) {
                    setError("Greška pri proveri verifikacije.");
                }
            }
        }, 5000); // 5 sekundi
        return () => clearInterval(interval);
    }, [navigate]);

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Potvrda Emaila</h2>
            <p className="mb-4">
                Hvala što ste se registrovali! Molimo vas da proverite svoj email i kliknete na link za verifikaciju kako biste aktivirali svoj nalog.
            </p>
            {checking && <p className="text-blue-600">Proveravam verifikaciju...</p>}
            {error && <p className="text-red-600">{error}</p>}
        </div>
    );
};

export default VerifyEmail;