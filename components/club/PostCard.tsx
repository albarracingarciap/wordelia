import * as React from "react";
import { AvatarStack } from "../ui/AvatarStack";
import { SpoilerGuard } from "./SpoilerGuard";
import { Button } from "../ui/Button";

interface PostCardProps {
    author: { name: string; avatar?: string };
    date: string;
    content: string;
    spoilerLevel?: "none" | "mild" | "strict";
    repliesCount?: number;
    likesCount?: number;
    isAnnouncement?: boolean;
}

export function PostCard({
    author,
    date,
    content,
    spoilerLevel = "none",
    repliesCount = 0,
    likesCount = 0,
    isAnnouncement = false
}: PostCardProps) {
    return (
        <div className={`p-4 rounded-xl border ${isAnnouncement ? 'bg-teal/5 border-teal/20' : 'bg-white border-black/5'}`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-cream-dark overflow-hidden relative">
                        {/* Simplification: using AvatarStack style fallback if no src, mostly assuming src for now or text fallback */}
                        {author.avatar ? (
                            <img src={author.avatar} alt={author.name} className="object-cover w-full h-full" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-grey/40">{author.name[0]}</div>
                        )}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-grey-dark flex items-center gap-2">
                            {author.name}
                            {isAnnouncement && <span className="text-[10px] bg-teal text-white px-1.5 py-0.5 rounded font-medium">MOD</span>}
                        </div>
                        <div className="text-[10px] text-grey/50">{date}</div>
                    </div>
                </div>
                {/* Actions kebab or similar could go here */}
            </div>

            <div className="pl-10">
                <SpoilerGuard level={spoilerLevel} className="text-sm text-grey leading-relaxed">
                    <p>{content}</p>
                </SpoilerGuard>

                <div className="flex items-center gap-4 mt-3">
                    <button className="flex items-center gap-1.5 text-xs text-grey/60 hover:text-teal transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        {likesCount > 0 && <span>{likesCount}</span>}
                    </button>
                    <button className="flex items-center gap-1.5 text-xs text-grey/60 hover:text-teal transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        {repliesCount > 0 ? (
                            <span>{repliesCount} respuestas</span>
                        ) : (
                            <span>Responder</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
