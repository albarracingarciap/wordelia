import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AvatarStack } from "@/components/ui/AvatarStack";
import { SpoilerGuard } from "../SpoilerGuard";

interface Message {
    id: string;
    user: { name: string; avatar?: string; role?: "mod" | "member" };
    content: string;
    timestamp: string;
    spoilerLevel?: "none" | "mild" | "strict";
    isPinned?: boolean;
}

interface SessionChatProps {
    messages: Message[];
    onSendMessage: (text: string, spoiler: string) => void;
    isSlowMode?: boolean;
}

export function SessionChat({ messages, onSendMessage, isSlowMode }: SessionChatProps) {
    const [inputValue, setInputValue] = React.useState("");
    const [spoilerLevel, setSpoilerLevel] = React.useState<"none" | "mild" | "strict">("none");

    const handleSend = () => {
        if (!inputValue.trim()) return;
        onSendMessage(inputValue, spoilerLevel);
        setInputValue("");
        setSpoilerLevel("none");
    };

    return (
        <Card className="h-full flex flex-col p-0 overflow-hidden relative border-teal/20 shadow-md">
            {/* Chat Header */}
            <div className="p-3 border-b border-black/5 bg-white flex justify-between items-center z-10">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-grey-dark uppercase tracking-wider">En vivo</span>
                </div>
                {isSlowMode && (
                    <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold">
                        Slow Mode: 30s
                    </span>
                )}
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-grey/5">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.isPinned ? 'p-3 bg-yellow-50 rounded-lg border border-yellow-100 mb-4 shadow-sm' : ''}`}>
                        <div className="shrink-0 w-8 h-8 rounded-full bg-grey/20 overflow-hidden">
                            {/* Mock Avatar */}
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-grey/50">
                                {msg.user.name[0]}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-xs font-bold text-grey-dark">{msg.user.name}</span>
                                {msg.user.role === 'mod' && <span className="text-[10px] bg-teal text-white px-1 rounded">MOD</span>}
                                <span className="text-[10px] text-grey/40">{msg.timestamp}</span>
                            </div>

                            <SpoilerGuard level={msg.spoilerLevel || 'none'} className="text-sm text-grey-dark leading-relaxed">
                                <p>{msg.content}</p>
                            </SpoilerGuard>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-black/5">
                {/* Spoiler Toggle */}
                <div className="flex gap-2 mb-2">
                    <button onClick={() => setSpoilerLevel("none")} className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${spoilerLevel === 'none' ? 'bg-grey/10 text-grey-dark' : 'text-grey/40'}`}>Sin Spoilers</button>
                    <button onClick={() => setSpoilerLevel("mild")} className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${spoilerLevel === 'mild' ? 'bg-orange-100 text-orange-800' : 'text-grey/40'}`}>Suave</button>
                    <button onClick={() => setSpoilerLevel("strict")} className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${spoilerLevel === 'strict' ? 'bg-coral/10 text-coral' : 'text-grey/40'}`}>Total</button>
                </div>

                <div className="flex gap-2">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Escribe una idea breve..."
                        className="flex-1 resize-none bg-grey/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal/20 h-10 min-h-[40px] max-h-[80px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <Button onClick={handleSend} size="sm" variant="primary" disabled={!inputValue.trim()}>
                        ➔
                    </Button>
                </div>
            </div>
        </Card>
    );
}
