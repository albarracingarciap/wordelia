"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getBookDetailsAction, importBookAction, checkBookExistsAction } from "../actions";
import { ArrowLeft, Book } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function ImportBookClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isbn = searchParams.get("isbn");

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alreadyExists, setAlreadyExists] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        author_name: "",
        description: "",
        cover_url: "",
        isbn: "",
        page_count: 0,
        published_date: "",
        genome_data: "{}"
    });

    useEffect(() => {
        async function fetchDetails() {
            if (!isbn) {
                setIsLoading(false);
                return;
            }
            try {
                // Check if already in our DB
                const exists = await checkBookExistsAction(isbn);
                setAlreadyExists(exists);

                if (!exists) {
                    const book = await getBookDetailsAction(isbn);
                    if (book) {
                        setFormData({
                            title: book.title || "",
                            author_name: book.authors?.[0] || "",
                            description: book.description || "",
                            cover_url: book.cover_url || "",
                            isbn: book.isbn || "",
                            page_count: book.page_count || 0,
                            published_date: book.published_date || "",
                            genome_data: "{}"
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to load book:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchDetails();
    }, [isbn]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let genomeObj = {};
            try {
                genomeObj = JSON.parse(formData.genome_data);
            } catch (e) {
                alert("El ADN Literario debe ser un JSON válido.");
                setIsSubmitting(false);
                return;
            }

            const payload = {
                ...formData,
                genome_data: genomeObj
            };

            const result = await importBookAction(payload);
            if (result.error) {
                alert(`Error: ${result.error}`);
            } else {
                alert("Libro importado correctamente.");
                router.push("/app/admin/catalogo");
            }
        } catch (error) {
            console.error(error);
            alert("Error al importar el libro");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-6 py-1"><div className="h-2 bg-slate-200 rounded"></div></div></div>;
    }

    if (!isbn) {
        return <div>Falta el parámetro ISBN.</div>;
    }

    if (alreadyExists) {
        return (
            <div className="max-w-2xl text-center py-12 border border-dashed border-border rounded-xl">
                <Book className="w-12 h-12 text-grey/20 mx-auto mb-4" />
                <h3 className="text-xl font-medium">Libro ya importado</h3>
                <p className="text-muted-foreground mt-2 mb-6">El libro con ISBN {isbn} ya existe en el catálogo de Wordelia.</p>
                <Link href="/app/admin/catalogo">
                    <Button variant="outline">Volver al catálogo</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/app/admin/catalogo" className="p-2 rounded-md hover:bg-accent text-muted-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Importar Libro</h1>
                    <p className="text-muted-foreground mt-1">
                        Revisa y edita los detalles antes de guardarlo en la base de datos de Wordelia.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border rounded-xl p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Cover Preview */}
                    <div className="w-full md:w-1/3 space-y-4">
                        <div className="aspect-[2/3] relative rounded-md border border-border bg-accent overflow-hidden">
                            {formData.cover_url ? (
                                <Image src={formData.cover_url} alt="Cover preview" fill className="object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                    <Book className="w-8 h-8 opacity-20" />
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1 line-clamp-1">URL Portada</label>
                            <Input name="cover_url" value={formData.cover_url} onChange={handleChange} className="text-xs" />
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="w-full md:w-2/3 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Título *</label>
                            <Input name="title" required value={formData.title} onChange={handleChange} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">Autor *</label>
                            <Input name="author_name" required value={formData.author_name} onChange={handleChange} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">ISBN</label>
                                <Input name="isbn" value={formData.isbn} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Páginas</label>
                                <Input type="number" name="page_count" value={formData.page_count} onChange={handleChange} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">Descripción</label>
                            <textarea
                                name="description"
                                rows={4}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">ADN Literario (JSON) 🧬</label>
                            <textarea
                                name="genome_data"
                                rows={3}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs ring-offset-background"
                                value={formData.genome_data}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-3">
                    <Link href="/app/admin/catalogo">
                        <Button type="button" variant="ghost">Cancelar</Button>
                    </Link>
                    <Button type="submit" variant="primary" disabled={isSubmitting || !formData.title}>
                        {isSubmitting ? "Importando..." : "Guardar en Wordelia"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
