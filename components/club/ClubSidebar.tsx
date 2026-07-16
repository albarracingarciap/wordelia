import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { PollWidget } from "./polls/PollWidget";
import { AlertCircle, BookOpen, CalendarClock, CheckCircle2, ChevronDown, Clock, Flag, ShieldAlert, X, XCircle } from "lucide-react";
import { getMyClubReports, reportClubProblem, updateClubBookDetails } from "@/app/app/clubs/[id]/actions";
import { createClient } from "@/utils/supabase/client";

interface PollOption {
    id: string;
    text: string;
    votes: number;
}

interface PollHistoryItem {
    id: string;
    question: string;
    endedAt?: string | null;
    options: PollOption[];
    totalVotes: number;
    winner?: PollOption | null;
}

interface ClubBook {
    id?: string | null;
    title?: string | null;
    cover_url?: string | null;
    page_count?: number | null;
    description?: string | null;
    isbn?: string | null;
    publisher?: string | null;
    author?: { name?: string | null } | null;
    authors?: { name?: string | null } | null;
}

interface ClubSidebarClub {
    id?: string;
    memberCount?: number;
    userRole?: string | null;
    rules?: string[] | null;
    currentBook?: {
        book?: ClubBook | null;
    } | null;
}

interface ClubSidebarProps {
    club?: ClubSidebarClub | null;
    activePoll?: React.ComponentProps<typeof PollWidget>["poll"];
    pollHistory?: PollHistoryItem[];
    onOpenCreatePoll?: () => void;
    onScheduleWinner?: (winnerText: string) => void;
}

type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

interface MyReportEvent {
    id: string;
    status: ReportStatus;
    note?: string | null;
    created_at: string;
    actor?: {
        full_name?: string | null;
        username?: string | null;
        avatar_url?: string | null;
    } | null;
}

interface MyClubReport {
    id: string;
    reason: string;
    details: string;
    status: ReportStatus;
    created_at: string;
    resolved_at?: string | null;
    events?: MyReportEvent[];
}

const REPORT_REASONS = [
    "Spoiler fuera de lugar",
    "Contenido ofensivo",
    "Comportamiento inadecuado",
    "Información incorrecta",
    "Error técnico",
    "Otro motivo",
];

const MAX_COVER_FILE_SIZE = 5 * 1024 * 1024;

function buildCoverFileName(title: string, fileName: string) {
    const extension = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const safeTitle = title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50) || "portada";

    return `${Date.now()}-${safeTitle}.${extension}`;
}

const REPORT_STATUS_META: Record<ReportStatus, { label: string; icon: React.ReactNode; className: string }> = {
    open: {
        label: "Abierto",
        icon: <ShieldAlert size={12} />,
        className: "border-coral/20 bg-coral/10 text-coral",
    },
    reviewing: {
        label: "En revisión",
        icon: <Clock size={12} />,
        className: "border-amber-200 bg-amber-100 text-amber-700",
    },
    resolved: {
        label: "Resuelto",
        icon: <CheckCircle2 size={12} />,
        className: "border-teal/20 bg-teal/10 text-teal",
    },
    dismissed: {
        label: "Descartado",
        icon: <XCircle size={12} />,
        className: "border-grey/10 bg-grey/10 text-grey/60",
    },
};

function formatReportDate(date: string) {
    return new Date(date).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function ReportStatusBadge({ status }: { status: ReportStatus }) {
    const meta = REPORT_STATUS_META[status];

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.className}`}>
            {meta.icon}
            {meta.label}
        </span>
    );
}

function formatClosedDate(date?: string | null) {
    if (!date) return "Fecha no disponible";
    return new Date(date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function PollHistoryWidget({
    polls = [],
    canSchedule = false,
    onScheduleWinner,
}: {
    polls?: PollHistoryItem[];
    canSchedule?: boolean;
    onScheduleWinner?: (winnerText: string) => void;
}) {
    if (!polls.length) return null;

    const latestWinnerPollId = polls.find((poll) => poll.winner && poll.winner.votes > 0)?.id;

    return (
        <Card className="rounded-3xl">
            <div className="mb-4">
                <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-teal-dark">Últimas decisiones</h4>
                <p className="mt-1 text-xs text-grey/55">Histórico de votaciones cerradas.</p>
            </div>
            <div className="space-y-4">
                {polls.map((poll) => {
                    const winner = poll.winner;
                    const winnerPercentage = poll.totalVotes > 0 && winner
                        ? Math.round((winner.votes / poll.totalVotes) * 100)
                        : 0;

                    return (
                        <details key={poll.id} className="group rounded-2xl border border-teal/10 bg-cream/25 p-3">
                            <summary className="cursor-pointer list-none">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold leading-snug text-teal-dark">{poll.question}</p>
                                        <p className="mt-1 text-xs text-grey/55">
                                            {poll.totalVotes} votos · Cerrada el {formatClosedDate(poll.endedAt)}
                                        </p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-grey/50">
                                        Ver
                                    </span>
                                </div>
                                {winner && (
                                    <div className="mt-3 rounded-xl bg-white px-3 py-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-grey/40">Ganó</p>
                                        <p className="mt-1 text-sm font-bold text-teal-dark">
                                            {winner.text} <span className="text-grey/50">{winnerPercentage}%</span>
                                        </p>
                                        {canSchedule && onScheduleWinner && poll.id === latestWinnerPollId && (
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    event.stopPropagation();
                                                    onScheduleWinner(winner.text);
                                                }}
                                                className="mt-2.5 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-teal px-3 text-xs font-bold text-white transition-colors hover:bg-teal-dark"
                                            >
                                                <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                                                Programar libro ganador
                                            </button>
                                        )}
                                    </div>
                                )}
                            </summary>
                            <div className="mt-3 space-y-2 border-t border-teal/10 pt-3">
                                {poll.options.map((option) => {
                                    const percentage = poll.totalVotes > 0
                                        ? Math.round((option.votes / poll.totalVotes) * 100)
                                        : 0;
                                    const isWinner = winner?.id === option.id;

                                    return (
                                        <div key={option.id}>
                                            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                                                <span className={`font-bold ${isWinner ? "text-teal-dark" : "text-grey/70"}`}>
                                                    {option.text}
                                                </span>
                                                <span className="text-grey/50">{percentage}%</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-white">
                                                <div
                                                    className={`h-full rounded-full ${isWinner ? "bg-teal" : "bg-grey/30"}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </details>
                    );
                })}
            </div>
        </Card>
    );
}

function BookWidget({
    book,
    clubId,
    canEdit,
    onBookUpdated,
    isOpen,
    onOpen,
    onClose,
}: {
    book: ClubBook;
    clubId?: string;
    canEdit?: boolean;
    onBookUpdated?: (book: ClubBook) => void;
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
}) {
    const author = book.author?.name || book.authors?.name || "Autor desconocido";

    return (
        <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
            <div className="relative h-48 bg-grey/10">
                {book.cover_url ? (
                    <>
                        <Image
                            src={book.cover_url}
                            alt={book.title || "Portada"}
                            fill
                            className="object-cover opacity-50 blur-md"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative h-36 w-24 overflow-hidden rounded shadow-lg">
                                <Image src={book.cover_url} alt={book.title || "Portada"} fill className="object-cover" />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-grey/40">
                        Sin imagen
                    </div>
                )}
            </div>
            <div className="p-4 text-center">
                <h3 className="text-lg font-bold text-grey-dark">{book.title || "Libro desconocido"}</h3>
                <p className="mb-4 text-sm text-grey/60">{author}</p>
                <Button variant="outline" size="sm" className="w-full" onClick={onOpen}>
                    Ver ficha
                </Button>
            </div>

            <ClubBookDetailsModal
                isOpen={isOpen}
                onClose={onClose}
                book={book}
                clubId={clubId}
                author={author}
                canEdit={canEdit}
                onUpdated={onBookUpdated}
            />
        </div>
    );
}

function ClubBookDetailsModal({
    isOpen,
    onClose,
    book,
    clubId,
    author,
    canEdit,
    onUpdated,
}: {
    isOpen: boolean;
    onClose: () => void;
    book: ClubBook;
    clubId?: string;
    author: string;
    canEdit?: boolean;
    onUpdated?: (book: ClubBook) => void;
}) {
    const router = useRouter();
    const [isEditing, setIsEditing] = React.useState(false);
    const [title, setTitle] = React.useState(book.title || "");
    const [authorName, setAuthorName] = React.useState(author);
    const [pages, setPages] = React.useState(book.page_count ? String(book.page_count) : "");
    const [isbn, setIsbn] = React.useState(book.isbn || "");
    const [publisher, setPublisher] = React.useState(book.publisher || "");
    const [coverUrl, setCoverUrl] = React.useState(book.cover_url || "");
    const [description, setDescription] = React.useState(book.description || "");
    const [coverFile, setCoverFile] = React.useState<File | null>(null);
    const [coverPreview, setCoverPreview] = React.useState("");
    const [errorMessage, setErrorMessage] = React.useState("");
    const [isSaving, setIsSaving] = React.useState(false);
    const coverInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (!isOpen) return;
        setIsEditing(false);
        setTitle(book.title || "");
        setAuthorName(author);
        setPages(book.page_count ? String(book.page_count) : "");
        setIsbn(book.isbn || "");
        setPublisher(book.publisher || "");
        setCoverUrl(book.cover_url || "");
        setDescription(book.description || "");
        setCoverFile(null);
        setCoverPreview("");
        setErrorMessage("");
        if (coverInputRef.current) coverInputRef.current.value = "";
    }, [author, book, isOpen]);

    React.useEffect(() => {
        return () => {
            if (coverPreview) URL.revokeObjectURL(coverPreview);
        };
    }, [coverPreview]);

    const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setErrorMessage("Selecciona una imagen valida para la portada.");
            event.target.value = "";
            return;
        }

        if (file.size > MAX_COVER_FILE_SIZE) {
            setErrorMessage("La imagen no puede superar los 5 MB.");
            event.target.value = "";
            return;
        }

        setErrorMessage("");
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
    };

    const uploadCoverFile = async (file: File) => {
        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
            throw new Error("Inicia sesion para subir una portada.");
        }

        const filePath = `${userData.user.id}/${buildCoverFileName(title || "portada", file.name)}`;
        const { error: uploadError } = await supabase.storage
            .from("book-covers")
            .upload(filePath, file, {
                cacheControl: "3600",
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) throw new Error(uploadError.message || "No hemos podido subir la portada.");

        const { data } = supabase.storage.from("book-covers").getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleSave = async () => {
        if (!clubId || !book.id || !title.trim() || isSaving) return;

        setIsSaving(true);
        setErrorMessage("");

        try {
            const uploadedCoverUrl = coverFile ? await uploadCoverFile(coverFile) : "";
            const parsedPages = Number.parseInt(pages, 10);
            const result = await updateClubBookDetails(clubId, book.id, {
                title,
                author: authorName,
                coverUrl: uploadedCoverUrl || coverUrl,
                description,
                pageCount: Number.isFinite(parsedPages) && parsedPages > 0 ? parsedPages : null,
                isbn,
                publisher,
            });

            if (result?.error) {
                setErrorMessage(result.error);
                return;
            }

            if (result?.book) {
                onUpdated?.(result.book as ClubBook);
            }

            setIsEditing(false);
            onClose();
            router.refresh();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "No se pudo actualizar la ficha.");
        } finally {
            setIsSaving(false);
        }
    };

    const previewUrl = coverPreview || coverUrl;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Editar ficha" : "Ficha del libro"} size="lg">
            <div className="max-h-[76vh] overflow-y-auto pr-1">
                <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
                    <div>
                        <div className="relative mx-auto flex aspect-[2/3] w-36 items-center justify-center overflow-hidden rounded-2xl bg-grey/10 shadow-sm sm:w-full">
                            {previewUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={previewUrl} alt={title || "Portada"} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-grey/40">
                                    <BookOpen size={28} />
                                    <span className="text-xs">Sin imagen</span>
                                </div>
                            )}
                        </div>

                        {isEditing && (
                            <div className="mt-3 space-y-2">
                                <label className="flex h-10 cursor-pointer items-center justify-center rounded-2xl bg-teal px-3 text-sm font-bold text-white transition-colors hover:bg-teal-dark">
                                    Subir imagen
                                    <input ref={coverInputRef} type="file" accept="image/*" className="sr-only" onChange={handleCoverChange} />
                                </label>
                                {previewUrl && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCoverFile(null);
                                            setCoverPreview("");
                                            setCoverUrl("");
                                            if (coverInputRef.current) coverInputRef.current.value = "";
                                        }}
                                        className="flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-grey/10 text-sm font-bold text-grey/60"
                                    >
                                        <X size={14} />
                                        Quitar
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-4">
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Titulo *</span>
                                <input value={title} onChange={(event) => setTitle(event.target.value)} className="h-12 w-full rounded-2xl border border-grey/10 px-4 outline-none focus:border-teal" />
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Autor</span>
                                <input value={authorName} onChange={(event) => setAuthorName(event.target.value)} className="h-12 w-full rounded-2xl border border-grey/10 px-4 outline-none focus:border-teal" />
                            </label>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Paginas</span>
                                    <input value={pages} onChange={(event) => setPages(event.target.value)} inputMode="numeric" className="h-12 w-full rounded-2xl border border-grey/10 px-4 outline-none focus:border-teal" />
                                </label>
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">ISBN</span>
                                    <input value={isbn} onChange={(event) => setIsbn(event.target.value)} className="h-12 w-full rounded-2xl border border-grey/10 px-4 outline-none focus:border-teal" />
                                </label>
                            </div>
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Editorial</span>
                                <input value={publisher} onChange={(event) => setPublisher(event.target.value)} className="h-12 w-full rounded-2xl border border-grey/10 px-4 outline-none focus:border-teal" />
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">URL portada</span>
                                <input
                                    value={coverUrl}
                                    onChange={(event) => {
                                        setCoverUrl(event.target.value);
                                        if (event.target.value.trim()) {
                                            setCoverFile(null);
                                            setCoverPreview("");
                                        }
                                    }}
                                    placeholder="https://..."
                                    className="h-12 w-full rounded-2xl border border-grey/10 px-4 outline-none focus:border-teal"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Sinopsis</span>
                                <textarea
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    rows={4}
                                    className="w-full resize-none rounded-2xl border border-grey/10 px-4 py-3 outline-none focus:border-teal"
                                />
                            </label>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-2xl font-bold leading-tight text-teal-dark">{book.title || "Libro desconocido"}</h3>
                            <p className="mt-1 text-lg text-grey/60">{author}</p>
                            <div className="mt-5 grid grid-cols-2 gap-3 border-y border-teal/10 py-4 text-sm">
                                <div>
                                    <span className="block text-xs font-bold uppercase tracking-[0.14em] text-grey/40">Paginas</span>
                                    <span className="font-bold text-grey-dark">{book.page_count || "Sin dato"}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-bold uppercase tracking-[0.14em] text-grey/40">ISBN</span>
                                    <span className="font-bold text-grey-dark">{book.isbn || "Sin dato"}</span>
                                </div>
                            </div>
                            <div className="mt-5">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Sinopsis</p>
                                <p className="mt-2 text-sm leading-6 text-grey/70">{book.description || "Sin sinopsis disponible."}</p>
                            </div>
                        </div>
                    )}
                </div>

                {errorMessage && (
                    <p className="mt-4 rounded-2xl border border-coral/20 bg-coral/10 px-4 py-3 text-sm font-bold text-coral">
                        {errorMessage}
                    </p>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_1.2fr]">
                    {isEditing ? (
                        <>
                            <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                                Cancelar
                            </Button>
                            <Button type="button" onClick={handleSave} disabled={!title.trim() || isSaving}>
                                {isSaving ? "Guardando..." : "Guardar cambios"}
                            </Button>
                        </>
                    ) : (
                        <>
                            {book.id ? (
                                <Link href={`/app/libros/${book.id}`} className="inline-flex h-12 items-center justify-center rounded-2xl border border-teal/20 text-sm font-bold text-teal transition-colors hover:bg-teal/5">
                                    Abrir ficha completa
                                </Link>
                            ) : (
                                <Button type="button" variant="ghost" onClick={onClose}>
                                    Cerrar
                                </Button>
                            )}
                            {canEdit ? (
                                <Button type="button" onClick={() => setIsEditing(true)}>
                                    Editar ficha
                                </Button>
                            ) : (
                                <Button type="button" onClick={onClose}>
                                    Cerrar
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
}

function ReportProblemModal({
    isOpen,
    onClose,
    clubId,
    onReported,
}: {
    isOpen: boolean;
    onClose: () => void;
    clubId?: string;
    onReported?: () => void;
}) {
    const [reason, setReason] = React.useState(REPORT_REASONS[0]);
    const [details, setDetails] = React.useState("");
    const [status, setStatus] = React.useState<"idle" | "sending" | "sent">("idle");
    const [errorMessage, setErrorMessage] = React.useState("");

    React.useEffect(() => {
        if (!isOpen) {
            setReason(REPORT_REASONS[0]);
            setDetails("");
            setStatus("idle");
            setErrorMessage("");
        }
    }, [isOpen]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!details.trim() || status === "sending") return;

        setStatus("sending");
        setErrorMessage("");

        const result = await reportClubProblem(clubId || "", reason, details);

        if (result?.error) {
            setStatus("idle");
            setErrorMessage(result.error);
            return;
        }

        setStatus("sent");
        onReported?.();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Reportar problema" size="sm" className="-translate-y-6 sm:translate-y-0">
            {status === "sent" ? (
                <div className="space-y-5">
                    <div className="rounded-2xl bg-teal/5 px-4 py-5 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal text-white">
                            <CheckCircle2 size={24} />
                        </div>
                        <h4 className="mt-4 text-lg font-bold text-teal-dark">Reporte recibido</h4>
                        <p className="mt-2 text-sm leading-6 text-grey/65">
                            Gracias por ayudar a cuidar la conversación. Revisaremos este aviso cuanto antes.
                        </p>
                    </div>
                    <Button type="button" onClick={onClose} className="w-full">
                        Entendido
                    </Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <p className="text-sm leading-6 text-grey/65">
                        Cuéntanos qué ocurre en este club. Tu reporte ayuda a mantener una comunidad tranquila y segura.
                    </p>

                    <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">
                            Motivo
                        </span>
                        <div className="relative">
                            <select
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                className="h-12 w-full appearance-none rounded-2xl border border-grey/10 bg-white px-4 pr-10 text-sm font-bold text-grey-dark outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/10"
                            >
                                {REPORT_REASONS.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-teal/60" size={18} />
                        </div>
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">
                            Descripción
                        </span>
                        <textarea
                            value={details}
                            onChange={(event) => setDetails(event.target.value)}
                            rows={4}
                            placeholder="Añade un poco de contexto para que podamos revisarlo bien..."
                            className="min-h-32 w-full resize-none rounded-2xl border border-grey/10 bg-white px-4 py-3 text-sm leading-6 text-grey-dark outline-none transition placeholder:text-grey/30 focus:border-teal focus:ring-2 focus:ring-teal/10"
                        />
                    </label>

                    <div className="flex items-start gap-2 rounded-2xl bg-cream/70 px-3 py-3 text-xs leading-5 text-grey/60">
                        <AlertCircle className="mt-0.5 shrink-0 text-teal/60" size={16} />
                        <span>No avisaremos públicamente de tu reporte ni compartiremos tu nombre con el club.</span>
                    </div>

                    {errorMessage && (
                        <p className="rounded-2xl bg-coral/10 px-3 py-3 text-sm font-bold text-coral">
                            {errorMessage}
                        </p>
                    )}

                    <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={!clubId || !details.trim() || status === "sending"} className="w-full">
                            {status === "sending" ? "Enviando..." : "Enviar reporte"}
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
}

function MyReportsModal({
    isOpen,
    onClose,
    reports,
}: {
    isOpen: boolean;
    onClose: () => void;
    reports: MyClubReport[];
}) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Mis reportes" size="md" className="-translate-y-6 sm:translate-y-0">
            {reports.length === 0 ? (
                <div className="rounded-2xl bg-cream/70 px-4 py-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal/5 text-teal/50">
                        <Flag size={22} />
                    </div>
                    <h4 className="mt-4 text-lg font-bold text-teal-dark">Aún no tienes reportes</h4>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-grey/60">
                        Cuando envíes un reporte desde este club, podrás seguir su estado aquí.
                    </p>
                </div>
            ) : (
                <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
                    {reports.map((report) => (
                        <div key={report.id} className="rounded-3xl border border-teal/10 bg-white px-4 py-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h4 className="font-bold text-teal-dark">{report.reason}</h4>
                                    <p className="mt-1 text-xs text-grey/50">{formatReportDate(report.created_at)}</p>
                                </div>
                                <ReportStatusBadge status={report.status} />
                            </div>

                            <p className="mt-4 rounded-2xl bg-cream/60 px-3 py-3 text-sm leading-6 text-grey/70">
                                {report.details}
                            </p>

                            {report.events && report.events.length > 0 ? (
                                <div className="mt-4 border-t border-teal/10 pt-4">
                                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-grey/45">
                                        Seguimiento
                                    </p>
                                    <div className="space-y-3">
                                        {report.events.map((event) => (
                                            <div key={event.id} className="border-l-2 border-teal/15 pl-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <ReportStatusBadge status={event.status} />
                                                    <span className="text-xs text-grey/50">
                                                        {formatReportDate(event.created_at)}
                                                    </span>
                                                </div>
                                                {event.note && (
                                                    <p className="mt-2 text-sm leading-6 text-grey/70">{event.note}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-4 rounded-2xl bg-teal/5 px-3 py-3 text-xs leading-5 text-grey/60">
                                    El equipo del club todavía no ha añadido seguimiento a este reporte.
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    );
}

function RulesWidget({ rules, clubId }: { rules?: string[] | null; clubId?: string }) {
    const [isReportOpen, setIsReportOpen] = React.useState(false);
    const [isMyReportsOpen, setIsMyReportsOpen] = React.useState(false);
    const [myReports, setMyReports] = React.useState<MyClubReport[]>([]);
    const [isLoadingReports, setIsLoadingReports] = React.useState(false);

    const loadMyReports = React.useCallback(async () => {
        if (!clubId) return;

        setIsLoadingReports(true);
        const reports = await getMyClubReports(clubId);
        setMyReports(reports as MyClubReport[]);
        setIsLoadingReports(false);
    }, [clubId]);

    React.useEffect(() => {
        loadMyReports();
    }, [loadMyReports]);

    const activeReports = myReports.filter((report) => report.status === "open" || report.status === "reviewing").length;

    return (
        <Card>
            <h4 className="mb-3 text-sm font-bold text-grey-dark">Reglas del club</h4>
            <ul className="space-y-2 text-xs text-grey/70">
                {rules && rules.length > 0 ? (
                    rules.map((rule) => (
                        <li key={rule} className="flex gap-2"><span>•</span> {rule}</li>
                    ))
                ) : (
                    <>
                        <li className="flex gap-2"><span>•</span> Sin spoilers fuera de hilos</li>
                        <li className="flex gap-2"><span>•</span> Respeto en debates</li>
                    </>
                )}
            </ul>
            {myReports.length > 0 && (
                <button
                    type="button"
                    onClick={() => setIsMyReportsOpen(true)}
                    className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-teal/10 bg-teal/5 px-3 py-3 text-left transition hover:border-teal/25 hover:bg-teal/10"
                >
                    <span>
                        <span className="block text-xs font-bold text-teal-dark">Mis reportes</span>
                        <span className="mt-0.5 block text-[11px] text-grey/55">
                            {activeReports > 0 ? `${activeReports} en seguimiento` : "Todos revisados"}
                        </span>
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-teal shadow-sm">
                        {myReports.length}
                    </span>
                </button>
            )}
            <div className="mt-4 border-t border-black/5 pt-3 text-center">
                <button
                    type="button"
                    onClick={() => setIsReportOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-grey/45 transition-colors hover:text-coral"
                >
                    <Flag size={12} />
                    {isLoadingReports ? "Cargando..." : "Reportar problema"}
                </button>
            </div>
            <ReportProblemModal
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                clubId={clubId}
                onReported={loadMyReports}
            />
            <MyReportsModal
                isOpen={isMyReportsOpen}
                onClose={() => setIsMyReportsOpen(false)}
                reports={myReports}
            />
        </Card>
    );
}

export function ClubSidebar({ club, activePoll, pollHistory = [], onOpenCreatePoll, onScheduleWinner }: ClubSidebarProps) {
    const currentBook = club?.currentBook?.book;
    const hasActiveBook = !!currentBook;
    const canCreatePoll = club?.userRole === "admin" || club?.userRole === "moderator";
    const canEditBook = canCreatePoll;
    const [localBook, setLocalBook] = React.useState<ClubBook | null>(currentBook || null);

    const [isBookModalOpen, setIsBookModalOpen] = React.useState(false);

    React.useEffect(() => {
        setLocalBook(currentBook || null);
    }, [currentBook]);

    return (
        <div className="space-y-6">
            {!hasActiveBook && (
                <>
                    <PollWidget
                        poll={activePoll || null}
                        canCreate={canCreatePoll}
                        onCreateClick={() => onOpenCreatePoll?.()}
                    />
                    <PollHistoryWidget polls={pollHistory} canSchedule={canCreatePoll} onScheduleWinner={onScheduleWinner} />
                </>
            )}

            {hasActiveBook && localBook && (
                <>
                    <BookWidget
                        book={localBook}
                        clubId={club?.id}
                        canEdit={canEditBook}
                        onBookUpdated={setLocalBook}
                        isOpen={isBookModalOpen}
                        onOpen={() => setIsBookModalOpen(true)}
                        onClose={() => setIsBookModalOpen(false)}
                    />
                    <PollWidget
                        poll={activePoll || null}
                        canCreate={canCreatePoll}
                        onCreateClick={() => onOpenCreatePoll?.()}
                    />
                    <PollHistoryWidget polls={pollHistory} canSchedule={canCreatePoll} onScheduleWinner={onScheduleWinner} />
                </>
            )}

            <RulesWidget rules={club?.rules} clubId={club?.id} />
        </div>
    );
}
