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
    gameFinishedStates?: IGameFinishedStates;
}

export interface IShowSecretStates {
    secretWord: string;
    impostorName: string;
    players: string[];
}

export interface IInProgressStates {
    currentPlayer: string;
    roundNumber: number;
    maxRounds: number;
}

export interface IVotingStates {}

export interface IGameFinishedStates {
    impostorWon: boolean;
    playerVoteImpostor: Record<string, boolean>;
}