"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { FollowButton } from "./FollowButton";
import type { Person } from "@/app/app/perfil/follow-actions";

export function PersonRow({ person }: { person: Person }) {
    const label = person.name || (person.username ? `@${person.username}` : "Lector");
    const inner = (
        <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal/10">
                {person.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={person.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                    <User className="h-5 w-5 text-teal/60" />
                )}
            </div>
            <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-teal-dark">{label}</p>
                {person.username && person.name && <p className="truncate text-xs text-grey/50">@{person.username}</p>}
            </div>
        </div>
    );

    return (
        <div className="flex items-center justify-between gap-3">
            {person.username ? (
                <Link href={`/app/perfil/@${person.username}`} className="min-w-0 flex-1 transition-opacity hover:opacity-80">
                    {inner}
                </Link>
            ) : (
                <div className="min-w-0 flex-1">{inner}</div>
            )}
            <FollowButton targetId={person.id} initialFollowing={person.isFollowing} />
        </div>
    );
}
