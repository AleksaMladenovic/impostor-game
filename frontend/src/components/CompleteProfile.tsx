import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CompleteProfile = () => {
    const [fname, setFname] = useState("");
    const [lname, setLname] = useState("");
    const [phone, setPhone] = useState("");
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { completeUser } = useAuth();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Ovde bi išao API poziv za čuvanje podataka
        if (fname && lname && phone) {
            setSuccess("Profil uspešno dopunjen!");
            navigate("/");
            completeUser(fname, lname, phone);
            setError(null);
        } else {
            setError("Sva polja su obavezna.");
            setSuccess(null);
        }
    };

    return (
        <form className="p-10 border-2 rounded-lg shadow-md w-96" onSubmit={handleSubmit}>
            <h3>Dopuni profil</h3>
            {error && <div className="text-red-500 mb-2">{error}</div>}
            {success && <div className="text-green-600 mb-2">{success}</div>}
            <div className="mb-3">
                <label>Ime</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Ime"
                    value={fname}
                    onChange={(e) => setFname(e.target.value)}
                    required
                />
            </div>
            <div className="mb-3">
                <label>Prezime</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Prezime"
                    value={lname}
                    onChange={(e) => setLname(e.target.value)}
                    required
                />
            </div>
            <div className="mb-3">
                <label>Broj telefona</label>
                <input
                    type="tel"
                    className="form-control"
                    placeholder="Broj telefona"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                />
            </div>
            <button type="submit" className="btn btn-primary w-full">Sačuvaj</button>
        </form>
    );
};

export default CompleteProfile;
