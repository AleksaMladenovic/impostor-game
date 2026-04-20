// TypeScript equivalents of backend DTOs

export enum GameState {
    ShowSecret = 0,
    InProgress = 1,
    Voting = 2,
    VoteResult = 3,   
    RoundFinished = 4,
    GameFinished = 5,
}


export interface IReturnState {
    state: GameState;
    /** Unix timestamp in seconds */
    timeStateEnd: number;
    showSecretStates?: IShowSecretStates;
    inProgressStates?: IInProgressStates;
    votingStates?: IVotingStates;
    voteResultStates?: IVoteResultStates; // DODAJ OVO
    gameFinishedStates?: IGameFinishedStates;
}

export interface IShowSecretStates {
    secretWord: string;
    impostorName: string;
    players: string[];
    clueTime: number;
}

export interface IInProgressStates {
    currentPlayer: string;
    roundNumber: number;
    maxRounds: number;
}

export interface IVotingStates {}

export interface IVoteResultStates {
    ejectedUsername: string | null; 
    wasImpostor: boolean;
}

export interface IGameFinishedStates {
    impostorWon: boolean;
    playerVoteImpostor: Record<string, boolean>;
}