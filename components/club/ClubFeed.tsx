"use client";

import { toast } from "@/components/ui/toast";
import { confirmDialog } from "@/components/ui/confirm";

import * as React from "react";
import { Button } from "../ui/Button";
import { PostCard } from "./PostCard";
import { ClubVoiceMessageCard } from "./ClubVoiceMessageCard";
import { Switch } from "@/components/ui/Switch";
import {
    getClubPosts,
    getClubVoiceMessages,
    createClubVoiceMessage,
    deleteClubVoiceMessage,
    pinClubVoiceMessage,
    createPost,
    toggleLike,
    deletePost,
    getClubCheckpoints,
    getMyClubBookProgress,
} from "@/app/app/clubs/[id]/actions";
import { useParams, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { BookOpen, Lock, Megaphone, MessageCircle, Mic, Square, Upload, Unlock } from "lucide-react";

type Checkpoint = { id: string; title: string; start: string; end: string; date?: string; questions?: string[] };
type FeedArea = "general" | "announcements" | `checkpoint-${number}`;
const EMPTY_CHECKPOINTS: Checkpoint[] = [];

interface ClubFeedProps {
    isAdminOrMod?: boolean;
    checkpoints?: Checkpoint[];
    currentBookId?: string | null;
    currentClubBookId?: string | null;
    targetCheckpointNumber?: number | null;
}

type ClubPost = React.ComponentProps<typeof PostCard> & {
    checkpointIndex?: number | null;
    isAuthor?: boolean;
    createdAt?: string;
};

type ClubVoiceMessage = React.ComponentProps<typeof ClubVoiceMessageCard> & {
    checkpointIndex?: number | null;
    createdAt: string;
    isAuthor?: boolean;
};

type ClubFeedItem =
    | { type: "post"; createdAt: string; data: ClubPost }
    | { type: "voice"; createdAt: string; data: ClubVoiceMessage };

function parseNumber(value?: string | null) {
    const match = String(value || "").match(/\d+/);
    return match ? Number.parseInt(match[0], 10) : null;
}

function getFallbackCheckpoint(checkpoints: Checkpoint[]) {
    if (checkpoints.length === 0) return 0;

    const dated = checkpoints
        .map((checkpoint, index) => ({ checkpoint, index }))
        .filter(({ checkpoint }) => checkpoint.date);

    if (dated.length === 0) return 1;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next = dated.find(({ checkpoint }) => {
        const date = new Date(checkpoint.date as string);
        date.setHours(0, 0, 0, 0);
        return date >= today;
    });

    return (next?.index ?? dated[dated.length - 1].index) + 1;
}

function getAllowedCheckpoint(checkpoints: Checkpoint[], currentPage?: number | null) {
    if (checkpoints.length === 0) return 0;
    if (!currentPage || currentPage <= 0) return getFallbackCheckpoint(checkpoints);

    let allowed = 0;

    checkpoints.forEach((checkpoint, index) => {
        const start = parseNumber(checkpoint.start);
        const end = parseNumber(checkpoint.end);

        if ((end && currentPage >= end) || (start && currentPage >= start)) {
            allowed = index + 1;
        }
    });

    return Math.max(allowed, 1);
}

function getCheckpointNumber(area: FeedArea) {
    if (!area.startsWith("checkpoint-")) return null;
    const value = Number.parseInt(area.replace("checkpoint-", ""), 10);
    return Number.isFinite(value) ? value : null;
}

export function ClubFeed({
    isAdminOrMod = false,
    checkpoints: initialCheckpoints = EMPTY_CHECKPOINTS,
    currentBookId,
    currentClubBookId,
    targetCheckpointNumber,
}: ClubFeedProps) {
    const params = useParams();
    const router = useRouter();
    const clubId = params.id as string;

    const [posts, setPosts] = React.useState<ClubPost[]>([]);
    const [voiceMessages, setVoiceMessages] = React.useState<ClubVoiceMessage[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [showSpoilers, setShowSpoilers] = React.useState(false);
    const [newPostContent, setNewPostContent] = React.useState("");
    const [isPosting, setIsPosting] = React.useState(false);
    const [isSpoilerPost, setIsSpoilerPost] = React.useState(false);
    const [isAnnouncementPost, setIsAnnouncementPost] = React.useState(false);
    const [activeArea, setActiveArea] = React.useState<FeedArea>("general");
    const [checkpoints, setCheckpoints] = React.useState<Checkpoint[]>(initialCheckpoints);
    const [currentPage, setCurrentPage] = React.useState<number | null>(null);
    const [unlockedCheckpoints, setUnlockedCheckpoints] = React.useState<Set<number>>(new Set());
    const [voiceTitle, setVoiceTitle] = React.useState("");
    const [voiceFile, setVoiceFile] = React.useState<File | null>(null);
    const [voicePreviewUrl, setVoicePreviewUrl] = React.useState<string | null>(null);
    const [voiceDuration, setVoiceDuration] = React.useState<number | null>(null);
    const [isUploadingVoice, setIsUploadingVoice] = React.useState(false);
    const [isRecording, setIsRecording] = React.useState(false);
    const [isRequestingMicrophone, setIsRequestingMicrophone] = React.useState(false);
    const [recordingElapsedSeconds, setRecordingElapsedSeconds] = React.useState(0);
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const recordingChunksRef = React.useRef<Blob[]>([]);
    const recordingStartedAtRef = React.useRef<number | null>(null);

    const storageKey = React.useMemo(() => `wordelia:club:${clubId}:spoiler-unlocks`, [clubId]);
    const selectedCheckpointNumber = getCheckpointNumber(activeArea);
    const allowedCheckpoint = React.useMemo(
        () => getAllowedCheckpoint(checkpoints, currentPage),
        [checkpoints, currentPage]
    );
    const selectedCheckpoint = selectedCheckpointNumber ? checkpoints[selectedCheckpointNumber - 1] : null;
    const isFutureCheckpoint =
        selectedCheckpointNumber != null &&
        selectedCheckpointNumber > allowedCheckpoint &&
        !unlockedCheckpoints.has(selectedCheckpointNumber);
    const isAnnouncementArea = activeArea === "announcements";
    const canPostInArea = !isFutureCheckpoint && (!isAnnouncementArea || isAdminOrMod);
    const isVoiceBusy = isUploadingVoice || isRecording || isRequestingMicrophone;

    const loadPosts = React.useCallback(async () => {
        setIsLoading(true);
        const [postData, voiceData] = await Promise.all([
            getClubPosts(clubId),
            getClubVoiceMessages(clubId),
        ]);
        setPosts(postData as ClubPost[]);
        setVoiceMessages(voiceData as ClubVoiceMessage[]);
        setIsLoading(false);
    }, [clubId]);

    React.useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    React.useEffect(() => {
        if (initialCheckpoints.length > 0) {
            setCheckpoints(initialCheckpoints);
            return;
        }

        getClubCheckpoints(clubId).then(setCheckpoints);
    }, [clubId, initialCheckpoints]);

    React.useEffect(() => {
        getMyClubBookProgress(currentBookId).then((progress) => {
            setCurrentPage(progress?.currentPage ?? null);
        });
    }, [currentBookId]);

    React.useEffect(() => {
        if (!targetCheckpointNumber || targetCheckpointNumber < 1) return;
        setActiveArea(`checkpoint-${targetCheckpointNumber}` as FeedArea);
    }, [targetCheckpointNumber]);

    React.useEffect(() => {
        try {
            const raw = window.localStorage.getItem(storageKey);
            const values = raw ? JSON.parse(raw) : [];
            if (Array.isArray(values)) {
                setUnlockedCheckpoints(new Set(values.filter((value) => Number.isFinite(value))));
            }
        } catch {
            setUnlockedCheckpoints(new Set());
        }
    }, [storageKey]);

    const unlockCheckpoint = (checkpointNumber: number) => {
        setUnlockedCheckpoints((current) => {
            const next = new Set(current);
            next.add(checkpointNumber);
            window.localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
            return next;
        });
    };

    React.useEffect(() => {
        return () => {
            if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
        };
    }, [voicePreviewUrl]);

    React.useEffect(() => {
        if (!isRecording) return;

        const interval = window.setInterval(() => {
            if (!recordingStartedAtRef.current) return;
            setRecordingElapsedSeconds(Math.round((Date.now() - recordingStartedAtRef.current) / 1000));
        }, 500);

        return () => window.clearInterval(interval);
    }, [isRecording]);

    const setVoiceAudio = (file: File, duration?: number | null) => {
        if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
        setVoiceFile(file);
        setVoicePreviewUrl(URL.createObjectURL(file));
        setVoiceDuration(duration ?? null);
    };

    const clearVoiceDraft = () => {
        if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
        setVoiceTitle("");
        setVoiceFile(null);
        setVoicePreviewUrl(null);
        setVoiceDuration(null);
        setRecordingElapsedSeconds(0);
    };

    const handleVoiceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setVoiceAudio(file);
        event.target.value = "";
    };

    const startRecording = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            toast.error("Tu navegador no permite grabar audio desde aqui.");
            return;
        }

        clearVoiceDraft();
        setIsRequestingMicrophone(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const preferredMimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : "audio/webm";
            const recorder = new MediaRecorder(stream, { mimeType: preferredMimeType });
            recordingChunksRef.current = [];
            recordingStartedAtRef.current = Date.now();
            setRecordingElapsedSeconds(0);

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordingChunksRef.current.push(event.data);
            };

            recorder.onstop = () => {
                stream.getTracks().forEach((track) => track.stop());
                const mimeType = recorder.mimeType || "audio/webm";
                const blob = new Blob(recordingChunksRef.current, { type: mimeType });
                const duration = recordingStartedAtRef.current
                    ? Math.round((Date.now() - recordingStartedAtRef.current) / 1000)
                    : null;
                const file = new File([blob], `mensaje-voz-${Date.now()}.webm`, { type: mimeType });
                setVoiceAudio(file, duration);
                setIsRecording(false);
                setIsRequestingMicrophone(false);
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            setIsRequestingMicrophone(false);
            setIsRecording(true);
        } catch {
            setIsRequestingMicrophone(false);
            setIsRecording(false);
            toast.error("No se pudo acceder al microfono.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    };

    const handleCreateVoiceMessage = async () => {
        if (!voiceFile || !canPostInArea || !isAdminOrMod) return;

        setIsUploadingVoice(true);
        const formData = new FormData();
        formData.append("audio", voiceFile);
        formData.append("title", voiceTitle);
        if (voiceDuration) formData.append("durationSeconds", String(voiceDuration));
        if (selectedCheckpointNumber) formData.append("checkpointIndex", String(selectedCheckpointNumber));
        if (currentClubBookId) formData.append("clubBookId", currentClubBookId);

        const result = await createClubVoiceMessage(clubId, formData);
        if (result?.error) {
            toast.error("Error: " + result.error);
        } else {
            clearVoiceDraft();
            loadPosts();
            router.refresh();
        }
        setIsUploadingVoice(false);
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim() || !canPostInArea) return;
        setIsPosting(true);

        const checkpointIndex = selectedCheckpointNumber ?? undefined;
        const postAsAnnouncement = isAnnouncementArea || isAnnouncementPost;
        const result = await createPost(clubId, newPostContent, isSpoilerPost, checkpointIndex, postAsAnnouncement);

        if (result?.error) {
            toast.error("Error: " + result.error);
        } else {
            setNewPostContent("");
            setIsSpoilerPost(false);
            setIsAnnouncementPost(false);
            loadPosts();
            router.refresh();
        }
        setIsPosting(false);
    };

    const handleLike = async (postId: string) => {
        setPosts(current => current.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    isLiked: !p.isLiked,
                    likesCount: p.isLiked ? (p.likesCount || 0) - 1 : (p.likesCount || 0) + 1
                };
            }
            return p;
        }));
        await toggleLike(postId);
        router.refresh();
    };

    const handleDelete = async (postId: string) => {
        if (!(await confirmDialog({ title: "Eliminar comentario", message: "¿Eliminar este comentario?", confirmLabel: "Eliminar", tone: "danger" }))) return;
        const result = await deletePost(postId);
        if (result?.success) {
            setPosts(current => current.filter(p => p.id !== postId));
            router.refresh();
        } else {
            toast.error("No se pudo eliminar.");
        }
    };

    const handleDeleteVoice = async (messageId: string) => {
        if (!(await confirmDialog({ title: "Archivar mensaje de voz", message: "¿Archivar este mensaje de voz?", confirmLabel: "Archivar", tone: "danger" }))) return;
        const result = await deleteClubVoiceMessage(messageId);
        if (result?.success) {
            setVoiceMessages(current => current.filter(message => message.id !== messageId));
            router.refresh();
        } else {
            toast.error(result?.error || "No se pudo archivar.");
        }
    };

    const handlePinVoice = async (messageId: string, isPinned: boolean) => {
        const result = await pinClubVoiceMessage(messageId, !isPinned);
        if (result?.success) {
            setVoiceMessages(current => current.map(message => (
                message.id === messageId ? { ...message, isPinned: !isPinned } : message
            )));
            router.refresh();
        } else {
            toast.error(result?.error || "No se pudo actualizar.");
        }
    };

    const filteredPosts = posts.filter(post => {
        if (activeArea === "announcements") return post.isAnnouncement;
        if (activeArea === "general") return !post.isAnnouncement && post.checkpointIndex == null;
        return post.checkpointIndex === selectedCheckpointNumber;
    });

    const filteredVoiceMessages = voiceMessages.filter(message => {
        if (activeArea === "announcements") return false;
        if (activeArea === "general") return message.checkpointIndex == null;
        return message.checkpointIndex === selectedCheckpointNumber;
    });

    const feedItems = React.useMemo<ClubFeedItem[]>(() => {
        return [
            ...filteredPosts.map(post => ({
                type: "post" as const,
                createdAt: post.createdAt || "",
                data: post,
            })),
            ...filteredVoiceMessages.map(message => ({
                type: "voice" as const,
                createdAt: message.createdAt,
                data: message,
            })),
        ].sort((a, b) => {
            const pinnedA = a.type === "voice" && a.data.isPinned ? 1 : 0;
            const pinnedB = b.type === "voice" && b.data.isPinned ? 1 : 0;
            if (pinnedA !== pinnedB) return pinnedB - pinnedA;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [filteredPosts, filteredVoiceMessages]);

    const contextLabel = activeArea === "announcements"
        ? "Avisos del club"
        : selectedCheckpointNumber
            ? `Tramo ${selectedCheckpointNumber}${selectedCheckpoint?.title ? ` - ${selectedCheckpoint.title}` : ""}`
            : "General sin spoilers";

    const emptyText = activeArea === "announcements"
        ? "No hay avisos todavía."
        : selectedCheckpointNumber
            ? "Aun no hay conversacion en este tramo."
            : "Abre una conversacion sin spoilers para todo el club.";

    const handleUseQuestion = (question: string) => {
        setNewPostContent((current) => {
            const prefix = `Pregunta: ${question}\n\n`;
            return current.trim() ? `${current}\n\n${prefix}` : prefix;
        });
        setIsSpoilerPost(true);
    };

    return (
        <div className="space-y-5">
            <div className="rounded-3xl border border-black/5 bg-white p-3 shadow-sm">
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                        type="button"
                        onClick={() => setActiveArea("general")}
                        className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${activeArea === "general"
                            ? "bg-teal text-white shadow-sm"
                            : "bg-cream/70 text-grey/70 hover:text-teal-dark"
                            }`}
                    >
                        <MessageCircle size={16} />
                        General
                    </button>

                    {checkpoints.map((checkpoint, index) => {
                        const checkpointNumber = index + 1;
                        const locked = checkpointNumber > allowedCheckpoint && !unlockedCheckpoints.has(checkpointNumber);
                        const area = `checkpoint-${checkpointNumber}` as FeedArea;

                        return (
                            <button
                                key={checkpoint.id}
                                type="button"
                                onClick={() => setActiveArea(area)}
                                className={`flex min-w-[145px] shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${activeArea === area
                                    ? "bg-teal text-white shadow-sm"
                                    : "bg-cream/70 text-grey/70 hover:text-teal-dark"
                                    }`}
                            >
                                {locked ? <Lock size={15} /> : <BookOpen size={15} />}
                                <span className="truncate">
                                    Tramo {checkpointNumber}
                                </span>
                            </button>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => setActiveArea("announcements")}
                        className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${activeArea === "announcements"
                            ? "bg-teal text-white shadow-sm"
                            : "bg-cream/70 text-grey/70 hover:text-teal-dark"
                            }`}
                    >
                        <Megaphone size={16} />
                        Avisos
                    </button>
                </div>

                <div className="mt-3 flex flex-col gap-3 border-t border-grey/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-grey/40">Conversacion</p>
                        <p className="text-sm font-bold text-teal-dark">{contextLabel}</p>
                    </div>
                    <label className="flex items-center justify-between gap-3 text-xs font-bold text-grey/55 sm:justify-start">
                        Mostrar spoilers marcados
                        <Switch checked={showSpoilers} onCheckedChange={setShowSpoilers} />
                    </label>
                </div>
            </div>

            {isFutureCheckpoint ? (
                <div className="rounded-3xl border border-teal/10 bg-white p-6 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal/10 text-teal">
                        <Lock size={24} />
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-teal-dark">Tramo protegido</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-grey/65">
                        Este hilo puede contener detalles de una parte que aun no has alcanzado. Puedes desbloquearlo si quieres leer bajo tu responsabilidad.
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        className="mt-5 w-full sm:w-auto"
                        onClick={() => selectedCheckpointNumber && unlockCheckpoint(selectedCheckpointNumber)}
                    >
                        <Unlock size={16} className="mr-2" />
                        Desbloquear tramo
                    </Button>
                </div>
            ) : (
                <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm space-y-3">
                    {selectedCheckpointNumber && (
                        <div className="rounded-3xl border border-teal/10 bg-teal/5 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-dark/55">
                                        Preguntas guia
                                    </p>
                                    <h3 className="mt-1 text-base font-bold text-teal-dark">
                                        Activa la conversacion del tramo
                                    </h3>
                                </div>
                                <BookOpen size={18} className="mt-1 shrink-0 text-teal/70" />
                            </div>

                            {selectedCheckpoint?.questions?.length ? (
                                <div className="mt-3 grid gap-2">
                                    {selectedCheckpoint.questions.map((question, index) => (
                                        <button
                                            key={`${selectedCheckpoint.id}-question-${index}`}
                                            type="button"
                                            onClick={() => handleUseQuestion(question)}
                                            className="rounded-2xl border border-teal/10 bg-white px-4 py-3 text-left text-sm font-medium leading-6 text-grey/75 transition hover:border-teal/30 hover:text-teal-dark"
                                        >
                                            {question}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-grey/55">
                                    Aun no hay preguntas guia para este tramo.
                                    {isAdminOrMod ? " Puedes anadirlas desde Gestionar > Plan de lectura." : ""}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <Avatar fallback="YO" className="w-8 h-8 text-xs bg-teal/10 text-teal" />
                        <textarea
                            className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-sm placeholder:text-grey/40 min-h-[66px]"
                            placeholder={
                                activeArea === "general"
                                    ? "Comparte una idea sin spoilers para todo el club..."
                                    : activeArea === "announcements"
                                        ? "Publica un aviso para el club..."
                                        : "Comenta este tramo de lectura..."
                            }
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            disabled={!canPostInArea}
                        />
                    </div>

                    {!canPostInArea && (
                        <p className="rounded-2xl bg-coral/5 px-3 py-2 text-xs font-medium text-coral">
                            Solo moderadores y administradores pueden publicar avisos del club.
                        </p>
                    )}

                    {selectedCheckpointNumber && (
                        <p className="rounded-2xl bg-teal/5 px-3 py-2 text-xs text-teal-dark/70">
                            Este comentario quedara asociado al tramo {selectedCheckpointNumber}. Los lectores que no hayan llegado aun veran el hilo protegido.
                        </p>
                    )}

                    <div className="flex flex-col gap-3 border-t border-grey/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-grey/60 hover:text-grey-dark">
                                <input
                                    type="checkbox"
                                    checked={isSpoilerPost}
                                    onChange={(e) => setIsSpoilerPost(e.target.checked)}
                                    className="rounded text-teal focus:ring-teal/20"
                                />
                                Contiene spoilers
                            </label>

                            {isAdminOrMod && activeArea !== "announcements" && (
                                <label className="flex items-center gap-2 cursor-pointer text-xs text-grey/60 hover:text-grey-dark">
                                    <input
                                        type="checkbox"
                                        checked={isAnnouncementPost}
                                        onChange={(e) => setIsAnnouncementPost(e.target.checked)}
                                        className="rounded text-teal focus:ring-teal/20"
                                    />
                                    Publicar como aviso del club
                                </label>
                            )}
                        </div>
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={handleCreatePost}
                            disabled={!newPostContent.trim() || isPosting || !canPostInArea}
                            className="w-full sm:w-auto"
                        >
                            {isPosting ? "Publicando..." : "Publicar"}
                        </Button>
                    </div>

                    {isAdminOrMod && activeArea !== "announcements" && (
                        <div className="border-t border-grey/10 pt-3">
                            <div className="rounded-3xl border border-teal/10 bg-teal/5 p-4">
                                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-dark/55">
                                            Mensaje de voz
                                        </p>
                                        <p className="text-sm font-bold text-teal-dark">
                                            {isRequestingMicrophone
                                                ? "Permite el microfono en el navegador"
                                                : isRecording
                                                    ? "Grabando audio"
                                                    : voiceFile
                                                        ? "Audio listo para publicar"
                                                        : "Graba o adjunta un audio del moderador"}
                                        </p>
                                    </div>
                                    {isRecording && (
                                        <div className="inline-flex items-center gap-2 rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">
                                            <span className="h-2 w-2 rounded-full bg-coral" />
                                            {Math.floor(recordingElapsedSeconds / 60)}:{String(recordingElapsedSeconds % 60).padStart(2, "0")}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <input
                                        type="text"
                                        value={voiceTitle}
                                        onChange={(event) => setVoiceTitle(event.target.value)}
                                        placeholder="Nombre del audio"
                                        className="h-10 flex-1 rounded-2xl border border-grey/10 bg-white px-3 text-sm outline-none transition focus:border-teal/30"
                                        maxLength={120}
                                        disabled={isVoiceBusy}
                                    />
                                    <div className="flex gap-2">
                                        {isRecording ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                onClick={stopRecording}
                                                className="flex-1 sm:flex-none"
                                            >
                                                <Square size={15} className="mr-2" />
                                                Detener grabacion
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={startRecording}
                                                disabled={isUploadingVoice || isRequestingMicrophone}
                                                className="flex-1 sm:flex-none"
                                            >
                                                <Mic size={15} className="mr-2" />
                                                {isRequestingMicrophone ? "Esperando permiso..." : "Grabar"}
                                            </Button>
                                        )}

                                        {!isRecording && !isRequestingMicrophone && (
                                            <label className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center rounded-2xl border border-grey/20 bg-white px-4 text-sm font-medium text-grey-dark transition hover:bg-grey/5 sm:flex-none">
                                                <Upload size={15} className="mr-2" />
                                                Subir archivo
                                                <input
                                                    type="file"
                                                    accept="audio/webm,audio/mp4,audio/mpeg,audio/ogg,audio/wav,audio/*"
                                                    className="hidden"
                                                    onChange={handleVoiceFileChange}
                                                    disabled={isUploadingVoice}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {isRequestingMicrophone && (
                                    <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-medium text-grey/60">
                                        Chrome esta esperando tu permiso. Cuando aceptes, este bloque cambiara a modo grabacion y aparecera el boton para detener.
                                    </p>
                                )}

                                {voicePreviewUrl && (
                                    <div className="mt-3 rounded-2xl border border-teal/10 bg-white p-3">
                                        <audio
                                            controls
                                            src={voicePreviewUrl}
                                            className="w-full"
                                            onLoadedMetadata={(event) => {
                                                const duration = event.currentTarget.duration;
                                                if (Number.isFinite(duration)) setVoiceDuration(Math.round(duration));
                                            }}
                                        />
                                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={clearVoiceDraft}
                                                disabled={isUploadingVoice}
                                            >
                                                Descartar
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={handleCreateVoiceMessage}
                                                disabled={!voiceFile || isUploadingVoice || !canPostInArea}
                                            >
                                                {isUploadingVoice ? "Subiendo a Supabase..." : "Publicar audio"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-8 text-grey/40 text-sm">Cargando conversacion...</div>
                ) : feedItems.length > 0 && !isFutureCheckpoint ? (
                    feedItems.map(item => {
                        if (item.type === "voice") {
                            const message = item.data;
                            const checkpointLabel = message.checkpointIndex != null
                                ? checkpoints[message.checkpointIndex - 1]?.title
                                    ? `Tramo ${message.checkpointIndex} - ${checkpoints[message.checkpointIndex - 1].title}`
                                    : `Tramo ${message.checkpointIndex}`
                                : undefined;

                            return (
                                <ClubVoiceMessageCard
                                    key={`voice-${message.id}`}
                                    {...message}
                                    checkpointLabel={checkpointLabel}
                                    onPin={isAdminOrMod ? () => handlePinVoice(message.id, !!message.isPinned) : undefined}
                                    onDelete={isAdminOrMod ? () => handleDeleteVoice(message.id) : undefined}
                                />
                            );
                        }

                        const post = item.data;
                        const checkpointLabel = post.checkpointIndex != null
                            ? checkpoints[post.checkpointIndex - 1]?.title
                                ? `Tramo ${post.checkpointIndex} - ${checkpoints[post.checkpointIndex - 1].title}`
                                : `Tramo ${post.checkpointIndex}`
                            : undefined;
                        return (
                            <PostCard
                                key={`post-${post.id}`}
                                {...post}
                                checkpointLabel={checkpointLabel}
                                globalShowSpoilers={showSpoilers}
                                onLike={() => handleLike(post.id)}
                                onDelete={post.isAuthor || isAdminOrMod ? () => handleDelete(post.id) : undefined}
                            />
                        );
                    })
                ) : !isFutureCheckpoint ? (
                    <div className="rounded-3xl border border-dashed border-teal/15 bg-white/50 px-5 py-8 text-center text-sm text-grey/45">
                        {emptyText}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
