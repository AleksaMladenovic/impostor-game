import { IMessage } from '../components/game/types';

export interface IOdigranaPartija {
    id: string;
    roomId: string;
    brojRundi: number;
    igraci: string[];
    // Key: round number, value: map (username -> clue)
    cluoviPoRundi: Record<number, Record<string, string>>;
    glasanjaPoRundi: Record<number, Record<string, string>>;
    poruke: IMessage[];
    vremeKraja: string; // ISO datetime string
}
