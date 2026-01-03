import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const login = useAuth().login;

    const handleLogin = async (e: any) =>{
        e.preventDefault();
        try{
            await signInWithEmailAndPassword(auth, email, password)
            const user = auth.currentUser;
            if(user){
                navigate("/");
                login({id: user.uid, email: user.email!});
            }
            console.log(user);
        }
        catch(err:any){
            setError(err.message);
            console.log(err.message);
        }
    }
    return (
        <form className="p-10 border-2 rounded-lg shadow-md w-96" onSubmit={handleLogin} >
            <h3>Login</h3>
            {error && <div className="error">{error}</div>}
            <div className="mb-3">
                <label>Email</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                />
            </div>
            <button type="submit" className="btn btn-primary">Login</button>
        </form> 
    )
}

export default Login;