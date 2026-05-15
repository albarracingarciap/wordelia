"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { ReadingForm, ReadingFormBook } from "@/components/registration/ReadingForm";
import { useRouter } from "next/navigation";
import * as React from "react";

export default function RegisterReadingPage() {
    const router = useRouter();
    const [books, setBooks] = React.useState<ReadingFormBook[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchBooks() {
            try {
                const { getCurrentBooks } = await import("@/app/app/mi-lectura/actions");
                const currentBooks = await getCurrentBooks();
                setBooks(currentBooks);
            } catch (error) {
                console.error("Error fetching books:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchBooks();
    }, []);

    return (
        <Container className="max-w-[720px]">
            {/* Header */}
            <SectionHeader
                eyebrow="MI LECTURA"
                title="Registrar lectura"
                subtitle="Un paso pequeño también cuenta."
                secondaryAction={{
                    label: "Volver",
                    onClick: () => router.back(),
                    variant: "ghost"
                }}
                className="mb-8"
            />

            <Card className="bg-[#FAF9F6]" >{/* cream-ish background specific to this card as per P-102 */}
                {isLoading ? (
                    <div className="text-center py-12 text-grey/40">Cargando libros...</div>
                ) : (
                    <ReadingForm
                        books={books}
                        onCancel={() => router.back()}
                        onSuccess={() => {
                            // In page flow, maybe go to success page or back to dashboards? for now back
                            router.push("/app/mi-lectura");
                        }}
                    />
                )}
            </Card>
        </Container>
    );
}
