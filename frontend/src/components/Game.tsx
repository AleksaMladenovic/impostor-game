import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HubConnectionBuilder, HubConnection } from '@microsoft/signalr';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, IReturnState } from '../interfaces/IReturnState';
import GameIntro from './game/GameIntro';
import TimerBadge from './game/TimerBadge';
import CluesPanel from './game/CluesPanel';
import VotingModal from './game/VotingModal';
import EjectionScreen from './game/EjectionScreen';
import EndGameScreen from './game/EndGameScreen';
import SecretWordPanel from './game/SecretWordPanel';
import ChatPanel from './game/ChatPanel';
import { IClue, IMessage } from './game/types';
import api from '../axios';

const Game: React.FC = () => {
    const { roomId } = useParams();
    const { user } = useAuth();
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const [showIntro, setShowIntro] = useState(true);
    const [message, setMessage] = useState("");
    const [clue, setClue] = useState("");
    const [clues, setCluesWords] = useState<IClue[]>([]);
    const [chatMessages, setChatMessages] = useState<IMessage[]>([]);
    const [timeLeft, setTimeLeft] = useState(30);
    const [votedPlayers, setVotedPlayers] = useState<string[]>([]);
    const [hasVoted, setHasVoted] = useState(false);
    const [showEjectionScreen, setShowEjectionScreen] = useState(false);
    const [showEndScreen, setShowEndScreen] = useState(false);
    const [gameResult, setGameResult] = useState<{ winner: string; points: number; won: boolean } | null>(null);
    const [gameState, setGameState] = useState<IReturnState | null>(null);
    const [isImpostor, setIsImpostor] = useState(false);
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [isVotingPhase, setIsVotingPhase] = useState(false);
    const [players, setPlayers] = useState<string[]>([]);
    const [currentStateNumber, setCurrentStateNumber] = useState<number>(0);
    const [currentTurnUsername, setCurrentTurnUsername] = useState<string>("");
    const [roundNumber, setRoundNumber] = useState<number>(1);
    const [maxRounds, setMaxRounds] = useState<number>(1);
    const [secretWord, setSecretWord] = useState<string>("");
    const [numOfPlayers, setNumOfPlayers] = useState<number>(0);
    const lastStateEndedRef = React.useRef<number | null>(null);
    const navigate = useNavigate();
    const timeoutSentKeyRef = React.useRef<string | null>(null);

    const safeStateEnded = () => {
        if (!connection) return;
        if (lastStateEndedRef.current === currentStateNumber) return; // već poslato
        lastStateEndedRef.current = currentStateNumber;

        connection.invoke("StateEnded", roomId, currentStateNumber)
            .catch(console.error);
    };
    // --- DINAMIČKE VARIJABLE ---
    // Koristimo currentRoom jer se on menja kroz SignalR
    // const isImpostor = user?.username === currentRoom.usernameOfImpostor;
    // const isMyTurn = user?.username === currentRoom.currentTurnPlayerUsername;
    // const isVotingPhase = currentRoom.state === 2;



    // 0. Kreiranje SignalR konekcije na GameHub
    useEffect(() => {
        const newConnection = new HubConnectionBuilder()
            .withUrl("https://localhost:7277/gamehub")
            .withAutomaticReconnect()
            .build();

        newConnection.start()
            .then(() => {
                console.log("Povezan na GameHub");
                setConnection(newConnection);
            })
            .catch(err => console.error("Greška pri povezivanju na GameHub:", err));

        return () => {
            newConnection.stop();
        };
    }, []);




    useEffect(() => {
        if (!connection) return;
        if (gameState?.state !== GameState.InProgress) return;
        if (!isMyTurn) return;

        // BITNO: samo tačno na 0
        if (timeLeft !== 0) return;

        // Key po potezu (stateNumber + ko je na redu)
        const key = `${currentStateNumber}:${currentTurnUsername}`;

        if (timeoutSentKeyRef.current === key) return;
        timeoutSentKeyRef.current = key;

        // odmah pomeri timer da ne okine ponovo dok ne stigne novi state
        setTimeLeft(-1);

        const clueDto = {
            userId: user?.id || '',
            username: user?.username || 'Nepoznati',
            clueWord: "",                 // PRAZAN STRING
            timestamp: new Date().toISOString()
        };

        connection.invoke("SendClueToRoom", roomId, clueDto)
            .catch(err => console.error("Greška pri slanju praznog traga:", err))
            .finally(() => {
                safeStateEnded();
            });
    }, [
        timeLeft,
        connection,
        gameState?.state,
        isMyTurn,
        currentStateNumber,
        currentTurnUsername,
        roomId,
        user?.id,
        user?.username
    ]);


    // 1. Kontrola Intro ekrana - izvršava se samo jednom kada se konekcija uspostavi
    useEffect(() => {
        if (showIntro) {
            const timer = setTimeout(() => {
                setShowIntro(false);
                safeStateEnded();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [showIntro, connection, roomId, currentStateNumber]);


    useEffect(() => {
        if (!connection) return;
        if (gameState?.state !== GameState.VoteResult) return;

        const timer = setTimeout(() => {
            safeStateEnded();
        }, 5000);

        return () => clearTimeout(timer);
    }, [gameState?.state, connection, roomId, currentStateNumber]);

    // 2. Logika tajmera - Resetuje se kada se promeni currentRoom (novi igrač)
    useEffect(() => {
        if (showIntro || showEndScreen || timeLeft <= 0) return;
        const interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [timeLeft, showIntro, showEndScreen]);

    // 3. LOGIKA ZA PROMENU STANJA (Glavni mozak komponente)
    useEffect(() => {
        if (!gameState) return;


        console.log("Trenutno stanje sa beka:", gameState.state);

        if (gameState.state !== GameState.Voting) {
            setHasVoted(false);
            setVotedPlayers([]);
            setIsVotingPhase(false);
        } else {
            setIsVotingPhase(true);
        }

        if (gameState.state === GameState.VoteResult) {
            setShowEjectionScreen(true);
        } else {
            setShowEjectionScreen(false);
        }

        switch (gameState.state) {
            case GameState.ShowSecret:
                setIsImpostor(user?.username === gameState.showSecretStates?.impostorName);
                setSecretWord(gameState.showSecretStates?.secretWord || "");
                setPlayers(gameState.showSecretStates?.players || []);
                setNumOfPlayers(gameState.showSecretStates?.players.length || 0);
                setShowIntro(true); // Tek sad palimo intro
                break;

            case GameState.InProgress:
                timeoutSentKeyRef.current = null;
                setShowIntro(false);
                setShowEjectionScreen(false);
                setIsMyTurn(user?.username === gameState.inProgressStates?.currentPlayer);
                setCurrentTurnUsername(gameState.inProgressStates?.currentPlayer || "");
                setRoundNumber(gameState.inProgressStates?.roundNumber || 1);
                setIsVotingPhase(false);
                setVotedPlayers([]);
                setMaxRounds(gameState.inProgressStates?.maxRounds || 1);
                setTimeLeft(30); // Resetuj lokalni tajmer
                break;

            case GameState.Voting:
                setIsVotingPhase(true);
                break;

            case GameState.GameFinished:
                const impWon = gameState.gameFinishedStates?.impostorWon;

                const localWon = (isImpostor === true && impWon === true) || (isImpostor === false && impWon === false);

                setGameResult({
                    winner: impWon ? "Impostor" : "Crewmates",
                    points: localWon ? (isImpostor ? 5 : 3) : 0,
                    won: localWon
                });
                setShowEndScreen(true);
                break;

            case GameState.VoteResult:
                setShowEjectionScreen(true);
                setTimeout(() => setShowEjectionScreen(false), 5000);
                break;
        }

    }, [gameState, isImpostor]);

    // 3. SIGNALR LISTENERS (Sređen cleanup da spreči dupliranje)
    useEffect(() => {
        if (!connection) return;

        // Prvo obrišemo sve stare listenere da budemo 100% sigurni
        connection.off("ReceiveMessage");
        connection.off("ReceiveClue");
        connection.off("UserVoted");
        connection.off("RoomUpdated");

        connection.invoke("JoinGame", roomId)

        connection.on("GameState", (IReturnState: IReturnState, stateNumber: number) => {
            console.log("Stiglo stanje igre:", IReturnState, stateNumber);
            setGameState(IReturnState);
            setCurrentStateNumber(stateNumber);
        });
        connection.on("ReceiveMessage", (msg: IMessage) => {
            setChatMessages(prev => [...prev, msg]);
        });

        connection.on("ReceiveClue", (newClue: IClue) => {
            console.log("Primljen trag:", newClue.clueWord);
            setCluesWords(prev => [...prev, newClue]);
        });

        connection.on("UserVoted", (username: string) => {
            setVotedPlayers(prev => {
                const updated = [...prev, username];
                return updated;
            });
        });

        // connection.on("RoomUpdated", (updatedRoom: SendRoom) => {
        //     // Koristimo funkciju unutar setState da proverimo PRETHODNO stanje bez zavisnosti u nizu
        //     setCurrentRoom(prevRoom => {
        //         // Detekcija prelaska iz Voting (2) u InProgress/Finished
        //         if (prevRoom.state === 2 && updatedRoom.state !== 2) {
        //             setHasVoted(false);
        //             setVotedPlayers([]);

        //             if (updatedRoom.lastEjectedUsername) {
        //                 setShowEjectionScreen(true);
        //                 setTimeout(() => setShowEjectionScreen(false), 5000);
        //             }
        //         }
        //         return updatedRoom;
        //     });
        //     setTimeLeft(updatedRoom.secondsPerTurn || 30);
        // });

        // CLEANUP: Gasi apsolutno sve listenere
        return () => {
            connection.off("ReceiveMessage");
            connection.off("ReceiveClue");
            connection.off("UserVoted");
            connection.off("RoomUpdated");
        };
    }, [connection]); // Uklonjen currentRoom.state iz zavisnosti da se ne bi restartovalo stalno


    useEffect(() => {
        console.log("Ukupno glasalo:", votedPlayers.length, "od", numOfPlayers);
        if (isVotingPhase && votedPlayers.length === numOfPlayers) {
            if (!connection) return;
            setVotedPlayers([]);
            setHasVoted(false);
            safeStateEnded();
        }
    }, [connection, roomId, currentStateNumber, isVotingPhase, votedPlayers, numOfPlayers])
    // Dodatni mali effect za čišćenje glasanja
    // useEffect(() => {
    //     if (!isVotingPhase) {
    //         setHasVoted(false);
    //     }
    // }, [isVotingPhase]);

    const onIgrajPonovo = async () => {
        try{
            await api.post(`/Rooms/${roomId}/restart`);
            navigate(`/lobby/${roomId}`);
        } catch (error) {
            alert("Igra je vec pocela!");
            console.error("Greška pri ponovnom pokretanju igre:", error);
            navigate(`/home`);
            return;
        }

    };



    // --- HANDLERS ---
    const handleSendMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (message.trim() === "" || !connection) return;

        const msg: IMessage = {
            userId: user?.id || '',
            username: user?.username || 'Nepoznati',
            content: message,
            timestamp: new Date().toISOString()
        };
        console.log("Saljemo poruku:", msg);
        connection.invoke("SendMessageToRoom", roomId, msg)
            .then(() => setMessage(""))
            .catch(err => console.error("Greška pri slanju poruke:", err));
    };

    const handleSendClue = () => {
        if (clue.trim() === "" || !connection) return;

        const clueDto = {
            userId: user?.id || '',
            username: user?.username || 'Nepoznati',
            clueWord: clue,
            timestamp: new Date().toISOString()
        };

        connection.invoke("SendClueToRoom", roomId, clueDto)
            .then(() => setClue("")) // Čistimo polje nakon slanja
            .catch(err => console.error("Greška pri slanju traga:", err));
        safeStateEnded();
    };
    const handleVote = (target: string | null) => {
        if (hasVoted || !connection) return;

        const voteDto = {
            roomId,
            round: roundNumber,
            username: user?.username,
            targetUsername: target || "skip"
        };

        connection.invoke("VoteForPlayer", voteDto).then(() => setHasVoted(true));
    };

    return (
        <div className="min-h-screen bg-[#060608] text-white font-sans overflow-hidden">
            <AnimatePresence>
                {showIntro ? (
                    <GameIntro isImpostor={isImpostor} />
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-screen w-full relative">
                        {/* ANIMIRANA POZADINA */}
                        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                            <motion.div
                                animate={{ x: [-20, 40, -20], y: [-10, 30, -10], scale: [1, 1.1, 1] }}
                                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-white/[0.04] blur-[130px] rounded-full"
                            />
                            <motion.div
                                animate={{ x: [20, -40, 20], y: [10, -30, 10], scale: [1.1, 1, 1.1] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                                className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/[0.03] blur-[130px] rounded-full"
                            />
                        </div>

                        <TimerBadge timeLeft={timeLeft} />

                        <CluesPanel
                            clues={clues}
                            isMyTurn={isMyTurn}
                            clue={clue}
                            onClueChange={setClue}
                            onSendClue={handleSendClue}
                            currentTurnUsername={currentTurnUsername}
                            isVotingPhase = {isVotingPhase} 
                        />

                        <VotingModal
                            isOpen={isVotingPhase}
                            players={players}
                            currentUsername={user?.username}
                            hasVoted={hasVoted}
                            votedPlayers={votedPlayers}
                            onVote={handleVote}
                        />

                        <EndGameScreen 
                        show={showEndScreen} 
                        gameState={gameState} 
                        isImpostor={isImpostor} 
                        onIgrajPonovo={() => {
                            // Ovde stavi logiku da se igrači vrate u lobi ili restartuju stanje
                            connection?.invoke("PlayAgain", roomId); 
                        }}
                        onBackToHome={() => navigate('/home')} 
                    />

                        <SecretWordPanel
                            roundNumber={roundNumber}
                            maxRounds={maxRounds}
                            isImpostor={isImpostor}
                            secretWord={secretWord}
                            currentTurnUsername={currentTurnUsername}
                        />

                        <ChatPanel
                            chatMessages={chatMessages}
                            currentUsername={user?.username}
                            message={message}
                            onMessageChange={setMessage}
                            onSendMessage={handleSendMessage}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Game;