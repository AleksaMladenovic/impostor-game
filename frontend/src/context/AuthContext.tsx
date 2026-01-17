import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";

// 1. Definiši tip korisnika
export interface User {
	id: string;
	email: string;
	username?: string;
	emailVerified?: boolean;
}

// 2. Definiši tip contexta
interface AuthContextType {
	user: User | null;
	login: (userData: User) => void;
	logout: () => void;
    loggedUser: () => boolean;
    completeUser: (fname: string, lname: string, phone: string) => void;
	setVerified: (verified: boolean) => void;
}

// 3. Kreiraj context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. Provider komponenta
export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);

	// Učitaj user iz localStorage pri mount-u
	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			setUser(JSON.parse(storedUser));
		}
	}, []);

	// Snimi user u localStorage kad se promeni
	useEffect(() => {
		if (user) {
			localStorage.setItem("user", JSON.stringify(user));
		} else {
			localStorage.removeItem("user");
		}
	}, [user]);

	const login = (userData: User) => {
		setUser(userData);
	};

	const logout = () => {
		setUser(null);
        const auth = getAuth();
        signOut(auth).catch((error) => {
            console.error("Error signing out from Firebase:", error);
        });
	};

    const loggedUser = () => {
        return user !== null;
    }

    const completeUser = (fname: string, lname: string, phone: string) => {
        if (user) {
            const updatedUser = { ...user, fname, lname, phone };
            setUser(updatedUser);
        }
    };

	const setVerified = (verified: boolean) => {
		if (user) {
			const updatedUser = { ...user, emailVerified: verified };
			setUser(updatedUser);
		}
	};

	return (
		<AuthContext.Provider value={{ user, login, logout, loggedUser, completeUser, setVerified }}>
			{children}
		</AuthContext.Provider>
	);
};

// 5. Custom hook za lakši pristup
export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
