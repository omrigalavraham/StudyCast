import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { ThinkingIndicator } from './ThinkingIndicator';

interface ChatPanelProps {
    messages: ChatMessage[];
    onSendMessage: (msg: string) => Promise<void>;
    onAddInsight: (content: string) => void;
    onClearChat: () => void;
    initialInput?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, onAddInsight, onClearChat, initialInput }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [sending, setSending] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Effect to handle initialInput from parent
    useEffect(() => {
        if (initialInput) {
            setInput(initialInput);
            // Optional: Focus the input when populated
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [initialInput]);

    const handleSend = async () => {
        if (!input.trim()) return;
        setSending(true);
        const msgToSend = input;
        setInput(''); // Clear input immediately for better UX

        try {
            await onSendMessage(msgToSend);
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full relative overflow-hidden">
            <style>{`
                @keyframes gradient-move {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>

            {/* Premium Loading Border - Moving Gradient */}
            {/* Premium Loading Border - Moving Gradient with Soft Shape */}
            {sending && (
                <div className="absolute inset-x-4 top-[70px] bottom-[85px] z-50 pointer-events-none transition-opacity duration-500 rounded-[32px] shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                    <div
                        className="absolute inset-0 border-[4px] border-transparent rounded-[32px]"
                        style={{
                            background: 'linear-gradient(90deg, #6366f1, #d946ef, #ec4899, #8b5cf6, #6366f1) border-box',
                            backgroundSize: '300% 100%',
                            animation: 'gradient-move 3s linear infinite',
                            mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                            WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                            maskComposite: 'exclude',
                            WebkitMaskComposite: 'xor'
                        }}
                    />
                    <div className="absolute inset-0 bg-indigo-500/5 mix-blend-overlay rounded-[32px]" />
                </div>
            )}

            {/* Header / Context */}
            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-4 border-b border-white/20 dark:border-slate-700/50 flex justify-between items-center shadow-sm z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">StudyCast AI</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">עוזר אישי חכם להרצאה</p>
                    </div>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={() => {
                            if (window.confirm('האם אתה בטוח שברצונך לנקות את היסטוריית הצ\'אט?')) {
                                onClearChat();
                            }
                        }}
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50"
                        title="נקה צ'אט"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        <span>נקה צ'אט</span>
                    </button>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 pb-24">
                {messages.length === 0 && (
                    <div className="text-center text-slate-400 mt-20">
                        <div className="text-6xl mb-4">💬</div>
                        <p className="font-bold">שאל אותי משהו על המצגת!</p>
                        <p className="text-sm mt-2">אני יודע לענות על שאלות מתוך החומר שלימדו.</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} group`}>
                        <div className={`
                             max-w-[85%] rounded-2xl p-5 text-sm relative shadow-sm transition-all leading-relaxed
                             ${msg.role === 'user'
                                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-br-none'
                                : 'bg-indigo-50/80 dark:bg-indigo-900/20 text-slate-800 dark:text-slate-100 border border-indigo-100 dark:border-indigo-800/50 rounded-bl-none backdrop-blur-sm'
                            }
                         `}>
                            <div className="text-[10px] font-bold mb-2 opacity-60 uppercase tracking-widest flex items-center gap-2">
                                {msg.role === 'user' ? (
                                    <>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                        אתה
                                    </>
                                ) : (
                                    <>
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                                        StudyCast AI
                                    </>
                                )}
                            </div>
                            <div className="whitespace-pre-wrap">
                                {msg.content.split(/(\*\*.*?\*\*)/).map((part, index) =>
                                    part.startsWith('**') && part.endsWith('**') ?
                                        <strong key={index} className="font-bold text-indigo-600 dark:text-indigo-400">{part.slice(2, -2)}</strong> :
                                        <span key={index}>{part}</span>
                                )}
                            </div>

                            {/* Actions for AI messages */}
                            {msg.role === 'ai' && (
                                <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onAddInsight(msg.content)}
                                        className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 bg-white/50 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-lg px-2.5 py-1.5 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm"
                                        title="שמור לתובנות"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                                        </svg>
                                        <span>שמור תובנה</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}




                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 w-full p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 rounded-b-[32px] z-10">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="שאל שאלה..."
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        className="absolute left-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/30"
                    >
                        {sending ? (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 transform rotate-180">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
