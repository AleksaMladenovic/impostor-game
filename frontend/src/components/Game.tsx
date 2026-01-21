import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { SendRoom } from './Lobby';
import { useAuth } from '../context/AuthContext';

const Game: React.FC = () => {
    const location = useLocation();
    const { roomId } = useParams();
    const { user } = useAuth();
    
    // Preuzmi state koji je poslat iz Lobby
    const { roomDetails } = location.state as { roomDetails: SendRoom };

    // Sada možeš koristiti roomDetails
    console.log('Room Details:', roomDetails);
    console.log('Broj rundi:', roomDetails.numberOfRounds);
    console.log('Vreme po rundi:', roomDetails.secondsPerTurn);
    const isInpostor = user?.username === roomDetails.usernameOfImpostor;
    return (
        <div>
            {/* Tvoj sadržaj */}
            <h1>Igra - Soba: {roomId}</h1>
            <div style={{ padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px', color: '#000' }}>
                <h2>Detalji Sobe:</h2>
                <p><strong>ID Sobe:</strong> {roomDetails.roomId}</p>
                <p><strong>Trenutna Runda:</strong> {roomDetails.currentRound || 0}</p>
                <p><strong>Igrač na redu:</strong> {roomDetails.currentTurnPlayerUsername || 'N/A'}</p>
                <p><strong>Tajna Reč:</strong> {roomDetails.secretWord || 'N/A'}</p>
                <p><strong>Impostor:</strong> {roomDetails.usernameOfImpostor || 'N/A'}</p>
                <p><strong>Stanje Igre:</strong> {roomDetails.state || 'N/A'}</p>
                <p><strong>Broj Rundi:</strong> {roomDetails.numberOfRounds || 0}</p>
                <p><strong>Vreme po Rundi:</strong> {roomDetails.secondsPerTurn || 0}s</p>
                <p><strong>Da li ste Impostor?</strong> {isInpostor ? 'Da' : 'Ne'}</p>
            </div>
        </div>
    );
};

export default Game;