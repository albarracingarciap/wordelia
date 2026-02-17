'use server';

import { createClient } from '@/utils/supabase/server';
import { BookSearchResult } from '@/lib/isbndb';

export interface CuratedCollection {
    id: string;
    slug: string;
    name: string;
    description: string;
    tag_line: string;
    icon: string;
    color_theme: string;
    display_order: number;
}

export interface CuratedCollectionWithBooks extends CuratedCollection {
    books: BookSearchResult[];
}

/**
 * Get all curated collections (metadata only, no books)
 */
export async function getCuratedCollections(): Promise<CuratedCollection[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('curated_collections')
        .select('*')
        .order('display_order', { ascending: true });

    if (error) {
        console.error('Error fetching curated collections:', error);
        return [];
    }

    return data || [];
}

/**
 * Get all collections with their books
 */
export async function getAllCuratedCollectionsWithBooks(): Promise<CuratedCollectionWithBooks[]> {
    const supabase = await createClient();

    // Get all collections
    const { data: collections, error: collectionsError } = await supabase
        .from('curated_collections')
        .select('*')
        .order('display_order', { ascending: true });

    if (collectionsError) {
        console.error('Error fetching curated collections:', collectionsError);
        return [];
    }

    if (!collections || collections.length === 0) {
        return [];
    }

    // Get all books for all collections
    const collectionsWithBooks: CuratedCollectionWithBooks[] = [];

    for (const collection of collections) {
        const { data: books, error: booksError } = await supabase
            .from('curated_collection_books')
            .select('isbn, book_data, display_order')
            .eq('collection_id', collection.id)
            .order('display_order', { ascending: true });

        if (booksError) {
            console.error(`Error fetching books for collection ${collection.slug}:`, booksError);
            collectionsWithBooks.push({
                ...collection,
                books: [],
            });
            continue;
        }

        // Map book_data to BookSearchResult
        const bookResults: BookSearchResult[] = (books || [])
            .map((book) => book.book_data as BookSearchResult)
            .filter((book) => book !== null);

        collectionsWithBooks.push({
            ...collection,
            books: bookResults,
        });
    }

    return collectionsWithBooks;
}

/**
 * Get a specific collection with its books
 */
export async function getCollectionBooks(collectionSlug: string): Promise<CuratedCollectionWithBooks | null> {
    const supabase = await createClient();

    // Get collection metadata
    const { data: collection, error: collectionError } = await supabase
        .from('curated_collections')
        .select('*')
        .eq('slug', collectionSlug)
        .single();

    if (collectionError || !collection) {
        console.error(`Error fetching collection ${collectionSlug}:`, collectionError);
        return null;
    }

    // Get books for this collection
    const { data: books, error: booksError } = await supabase
        .from('curated_collection_books')
        .select('isbn, book_data, display_order')
        .eq('collection_id', collection.id)
        .order('display_order', { ascending: true });

    if (booksError) {
        console.error(`Error fetching books for collection ${collectionSlug}:`, booksError);
        return {
            ...collection,
            books: [],
        };
    }

    // Map book_data to BookSearchResult
    const bookResults: BookSearchResult[] = (books || [])
        .map((book) => book.book_data as BookSearchResult)
        .filter((book) => book !== null);

    return {
        ...collection,
        books: bookResults,
    };
}

/**
 * Get book data for preview modal by ISBN
 */
export async function getBookForPreview(isbn: string): Promise<BookSearchResult | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('curated_collection_books')
        .select('book_data')
        .eq('isbn', isbn)
        .single();

    if (error || !data) {
        console.error(`Error fetching book preview for ISBN ${isbn}:`, error);
        return null;
    }

    return data.book_data as BookSearchResult;
}
