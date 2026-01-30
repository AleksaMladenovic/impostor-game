import React from 'react';
import { Edit3, History } from 'lucide-react';
import { IClue } from './types';

interface CluesPanelProps {
    clues: IClue[];
    isMyTurn: boolean;
    clue: string;
    onClueChange: (value: string) => void;
    onSendClue: () => void;
    currentTurnUsername: string;
}

const CluesPanel: React.FC<CluesPanelProps> = ({
    clues,
    isMyTurn,
    clue,
    onClueChange,
    onSendClue,
    currentTurnUsername
}) => (
    <aside className="w-80 bg-white/[0.01] border-r border-white/10 backdrop-blur-3xl flex flex-col z-20">
        <div className="p-6 border-b border-white/10 bg-white/[0.02]">
            <h2 className="flex items-center gap-2 font-black uppercase tracking-widest text-xs text-gray-400">
                <History size={14} className="text-blue-400" /> Istorija Tragova
            </h2>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-3">
            {clues.map((clueItem, index) => (
                <div key={index} className="p-4 rounded-2xl border bg-white/5 border-white/10">
                    <p className="text-[10px] font-black mb-1 text-blue-400">{clueItem.username.toUpperCase()}</p>
                    <p className="text-sm text-gray-300 italic">"{clueItem.clueWord}"</p>
                </div>
            ))}
        </div>

        <div className="p-6 bg-blue-500/5 border-t border-blue-500/20">
            {isMyTurn ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-400">
                        <Edit3 size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Tvoj red</span>
                    </div>
                    <input
                        type="text"
                        placeholder="UNESI TRAG..."
                        className="w-full bg-white/5 border-b-2 border-white/10 p-3 text-sm focus:border-blue-500 outline-none uppercase font-bold text-white"
                        value={clue}
                        onChange={(e) => onClueChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onSendClue()}
                    />
                    <button
                        onClick={onSendClue}
                        className="w-full py-3 bg-white text-black font-black rounded-xl text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                    >
                        POTVRDI
                    </button>
                </div>
            ) : (
                <div className="text-center py-4">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                        Čekamo da <br /> <span className="text-blue-400">{currentTurnUsername}</span> <br /> unese trag
                    </p>
                </div>
            )}
        </div>
    </aside>
);

export default CluesPanel;
