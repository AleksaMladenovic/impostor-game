import React from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { IMessage } from './types';

interface ChatPanelProps {
    chatMessages: IMessage[];
    currentUsername?: string;
    message: string;
    onMessageChange: (value: string) => void;
    onSendMessage: (e?: React.FormEvent) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
    chatMessages,
    currentUsername,
    message,
    onMessageChange,
    onSendMessage
}) => (
    <aside className="w-96 bg-white/[0.02] border-l border-white/10 backdrop-blur-2xl flex flex-col z-20">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <MessageSquare className="text-blue-400" size={20} />
            <h2 className="font-black uppercase tracking-widest text-sm text-gray-300">Chat</h2>
        </div>
        <div className="flex-grow overflow-y-auto p-6 space-y-4">
            {chatMessages.map((msg, index) => (
                <div
                    key={index}
                    className={`p-4 rounded-2xl border ${msg.username === currentUsername
                            ? 'bg-blue-500/10 border-blue-500/20'
                            : 'bg-white/5 border-white/10'
                        }`}
                >
                    <p className="text-[10px] font-black mb-1 text-blue-400">{msg.username.toUpperCase()}</p>
                    <p className="text-sm text-gray-300">{msg.content}</p>
                </div>
            ))}
        </div>
        <div className="p-6 bg-black/40 border-t border-white/10">
            <form className="flex gap-2" onSubmit={onSendMessage}>
                <input
                    type="text"
                    placeholder="Poruka..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none"
                    value={message}
                    onChange={(e) => onMessageChange(e.target.value)}
                />
                <button className="bg-white text-black p-4 rounded-xl hover:bg-gray-200">
                    <Send size={18} />
                </button>
            </form>
        </div>
    </aside>
);

export default ChatPanel;
