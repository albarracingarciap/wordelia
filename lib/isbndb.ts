
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
    source: 'isbndb' | 'google' | 'db';
}

const ISBNDB_API_URL = "https://api2.isbndb.com";

interface ISBNdbBook {
    title: string;
    authors?: string[];
    image?: string;
    isbn13?: string;
    isbn10?: string;
    publisher?: string;
    date_published?: string;
    pages?: number;
    synopsis?: string;
    subjects?: string[];
    language?: string;
    // ... other fields
}

interface ISBNdbSearchResponse {
    total: number;
    books: ISBNdbBook[];
}

interface ISBNdbBookResponse {
    book: ISBNdbBook;
}

export async function searchISBNdb(query: string, page: number = 1, pageSize: number = 20): Promise<BookSearchResult[]> {
    if (!query) return [];

    const apiKey = process.env.ISBNDB_API_KEY;
    if (!apiKey) {
        console.error("ISBNDB_API_KEY is missing");
        return [];
    }

    try {
        // Search by generic query (matches title, author, etc.)
        const url = `${ISBNDB_API_URL}/books/${encodeURIComponent(query)}?page=${page}&pageSize=${pageSize}`;

        const response = await fetch(url, {
            headers: {
                "Authorization": apiKey
            }
        });

        if (!response.ok) {
            console.error(`ISBNdb API error: ${response.status} ${response.statusText}`);
            return [];
        }

        const data: ISBNdbSearchResponse = await response.json();

        if (!data.books) return [];

        return data.books.map(mapISBNdbBook);

    } catch (error) {
        console.error("Error fetching from ISBNdb:", error);
        return [];
    }
}

export async function getBookByISBN(isbn: string): Promise<BookSearchResult | null> {
    const apiKey = process.env.ISBNDB_API_KEY;
    if (!apiKey) return null;

    try {
        const url = `${ISBNDB_API_URL}/book/${isbn}`;

        const response = await fetch(url, {
            headers: {
                "Authorization": apiKey
            }
        });

        if (!response.ok) {
            if (response.status !== 404) {
                console.error(`ISBNdb API error for ISBN ${isbn}: ${response.status}`);
            }
            return null;
        }

        const data: ISBNdbBookResponse = await response.json();
        return mapISBNdbBook(data.book);

    } catch (error) {
        console.error("Error fetching book details from ISBNdb:", error);
        return null;
    }
}

function mapISBNdbBook(item: ISBNdbBook): BookSearchResult {
    return {
        id: item.isbn13 || item.isbn10 || "", // ISBNdb doesn't have a separate ID, use ISBN as ID
        title: item.title,
        authors: item.authors || [],
        cover_url: item.image || null,
        description: item.synopsis || null,
        isbn: item.isbn13 || item.isbn10 || null,
        page_count: item.pages || null,
        published_date: item.date_published ? new Date(item.date_published).toISOString() : null,
        publisher: item.publisher || null,
        categories: item.subjects || [],
        average_rating: null, // ISBNdb doesn't standardize ratings like Google
        ratings_count: null,
        language: item.language || "en", // Default assumption or null
        source: 'isbndb'
    };
}
