
export interface BookSearchResult {
    id: string;
    title: string;
    authors: string[];
    cover_url: string | null;
    description: string | null;
    isbn: string | null;
    page_count: number | null;
    published_date: string | null;
    publisher: string | null;
    categories: string[];
    average_rating: number | null;
    ratings_count: number | null;
    language: string | null;
    source: 'google' | 'db';
}

const GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes";

export async function searchGoogleBooks(query: string, maxResults: number = 20): Promise<BookSearchResult[]> {
    if (!query) return [];

    try {
        const url = `${GOOGLE_BOOKS_API_URL}?q=${encodeURIComponent(query)}&maxResults=${maxResults}&printType=books`;
        const response = await fetch(url);

        if (!response.ok) {
            console.error("Google Books API error:", response.statusText);
            return [];
        }

        const data = await response.json();

        if (!data.items) return [];

        return data.items.map((item: any) => {
            const info = item.volumeInfo;
            const identifiers = info.industryIdentifiers || [];
            const isbn13 = identifiers.find((id: any) => id.type === "ISBN_13")?.identifier;
            const isbn10 = identifiers.find((id: any) => id.type === "ISBN_10")?.identifier;

            return {
                id: item.id,
                title: info.title,
                authors: info.authors || [],
                cover_url: info.imageLinks?.thumbnail?.replace("http://", "https://")
                    || info.imageLinks?.smallThumbnail?.replace("http://", "https://")
                    || null,
                description: info.description || null,
                isbn: isbn13 || isbn10 || null,
                page_count: info.pageCount || null,
                published_date: info.publishedDate || null,
                publisher: info.publisher || null,
                categories: info.categories || [],
                average_rating: info.averageRating || null,
                ratings_count: info.ratingsCount || null,
                language: info.language || null,
                source: 'google'
            };
        });

    } catch (error) {
        console.error("Error fetching from Google Books:", error);
        return [];
    }
}

export async function getBookById(googleBookId: string): Promise<BookSearchResult | null> {
    try {
        const url = `${GOOGLE_BOOKS_API_URL}/${googleBookId}`;
        const response = await fetch(url);

        if (!response.ok) return null;

        const item = await response.json();
        const info = item.volumeInfo;
        const identifiers = info.industryIdentifiers || [];
        const isbn13 = identifiers.find((id: any) => id.type === "ISBN_13")?.identifier;
        const isbn10 = identifiers.find((id: any) => id.type === "ISBN_10")?.identifier;

        return {
            id: item.id,
            title: info.title,
            authors: info.authors || [],
            cover_url: info.imageLinks?.thumbnail?.replace("http://", "https://")
                || info.imageLinks?.smallThumbnail?.replace("http://", "https://")
                || null,
            description: info.description || null,
            isbn: isbn13 || isbn10 || null,
            page_count: info.pageCount || null,
            published_date: info.publishedDate || null,
            publisher: info.publisher || null,
            categories: info.categories || [],
            average_rating: info.averageRating || null,
            ratings_count: info.ratingsCount || null,
            language: info.language || null,
            source: 'google'
        };

    } catch (error) {
        console.error("Error fetching book details:", error);
        return null;
    }
}
