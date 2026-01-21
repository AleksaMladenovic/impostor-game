import React, { createContext, useContext, useState, useEffect } from 'react';
import { HubConnectionBuilder, HubConnection, HubConnectionState } from '@microsoft/signalr';

interface SignalRContextType {
    connection: HubConnection | null;
    isConnected: boolean;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

export const SignalRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Kreiraj konekciju samo jednom
        const createConnection = async () => {
            try {
                const newConnection = new HubConnectionBuilder()
                    .withUrl("https://localhost:7277/gamehub")
                    .withAutomaticReconnect([0, 0, 0, 5000, 10000, 30000]) // Pokušaj reconnect sa pauzama
                    .build();

                // Postavi event listenere za state promene
                newConnection.onreconnecting(() => {
                    console.log("SignalR: Pokušaj ponovnog konekcije...");
                    setIsConnected(false);
                });

                newConnection.onreconnected(() => {
                    console.log("SignalR: Ponovna konekcija uspostavljena");
                    setIsConnected(true);
                });

                newConnection.onclose(() => {
                    console.log("SignalR: Konekcija zatvorena");
                    setIsConnected(false);
                });

                await newConnection.start();
                console.log("SignalR: Konekcija uspostavljena");
                setConnection(newConnection);
                setIsConnected(true);
            } catch (error) {
                console.error("SignalR: Greška pri konekciji", error);
                setIsConnected(false);
                // Pokušaj ponovo nakon 5 sekundi
                setTimeout(createConnection, 5000);
            }
        };

        createConnection();

        // Cleanup pri unmount-u
        return () => {
            if (connection && connection.state === HubConnectionState.Connected) {
                connection.stop().catch(err => console.error("SignalR: Greška pri gašenju", err));
            }
        };
    }, []);

    return (
        <SignalRContext.Provider value={{ connection, isConnected }}>
            {children}
        </SignalRContext.Provider>
    );
};

export const useSignalR = () => {
    const context = useContext(SignalRContext);
    if (!context) {
        throw new Error('useSignalR mora biti korišćen unutar SignalRProvider');
    }
    return context;
};
