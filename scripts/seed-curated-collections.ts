#!/usr/bin/env tsx

/**
 * Seed script for curated collections
 * Reads CSV file and populates the database with curated collections and books
 * Fetches book data from ISBNdb API and caches it in the database
 * 
 * Usage:
 *   npx tsx scripts/seed-curated-collections.ts
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { getBookByISBN } from '../lib/isbndb';
import * as fs from 'fs';

// Collection metadata
const COLLECTIONS_METADATA = [
    {
        slug: 'ritmo-cardiaco',
        name: 'Ritmo Cardíaco',
        description: 'Tensión narrativa que te mantendrá despierto',
        tag_line: 'No apto para leer antes de dormir',
        icon: 'heart-pulse',
        color_theme: 'red-orange',
        display_order: 1,
    },
    {
        slug: 'densidad-mundo',
        name: 'Densidad del Mundo',
        description: 'Universos complejos donde perderse (literalmente)',
        tag_line: 'Necesitarás un mapa mental',
        icon: 'network',
        color_theme: 'blue-purple',
        display_order: 2,
    },
    {
        slug: 'coeficiente-debate',
        name: 'Coeficiente de Debate',
        description: 'Libros que polarizan y generan conversación',
        tag_line: 'Imposible leerlos sin querer hablar con alguien',
        icon: 'scale',
        color_theme: 'yellow-orange',
        display_order: 3,
    },
    {
        slug: 'nivel-prosa',
        name: 'Nivel de Prosa',
        description: 'Belleza estética en cada página',
        tag_line: 'Para leer despacio y subrayar cada página',
        icon: 'feather',
        color_theme: 'green-gold',
        display_order: 4,
    },
    {
        slug: 'curva-aprendizaje',
        name: 'Curva de Aprendizaje',
        description: 'Ensayo narrativo que te hará más sabio',
        tag_line: 'Sal de este libro sabiendo más que cuando entraste',
        icon: 'lightbulb',
        color_theme: 'blue-grey',
        display_order: 5,
    },
];

interface CSVRow {
    collection_id: string;
    isbn: string;
    order: number;
    notes: string;
}

async function parseCSV(filePath: string): Promise<CSVRow[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    const rows: CSVRow[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',');
        if (parts.length < 4) {
            console.warn(`Skipping invalid line ${i + 1}: ${line}`);
            continue;
        }

        rows.push({
            collection_id: parts[0].trim(),
            isbn: parts[1].trim(),
            order: parseInt(parts[2].trim(), 10),
            notes: parts.slice(3).join(',').trim(), // Handle commas in notes
        });
    }

    return rows;
}

async function main() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const isbndbApiKey = process.env.ISBNDB_API_KEY;

    console.log('🔍 Checking environment variables...');
    console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌ Missing'}`);
    console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅' : '❌ Missing'}`);
    console.log(`  ISBNDB_API_KEY: ${isbndbApiKey ? '✅' : '❌ Missing'}`);
    console.log('');

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Missing Supabase credentials in .env.local file');
        console.error('');
        console.error('Please add the following to your .env.local file:');
        console.error('');
        console.error('  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
        console.error('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
        console.error('  ISBNDB_API_KEY=your_isbndb_key');
        console.error('');
        console.error('You can find these values in:');
        console.error('  - Supabase Dashboard > Settings > API');
        console.error('  - Look for "service_role" key (NOT the anon key)');
        process.exit(1);
    }

    if (!isbndbApiKey) {
        console.error('❌ Missing ISBNDB_API_KEY in .env.local file');
        console.error('Please add: ISBNDB_API_KEY=your_isbndb_key');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚀 Starting curated collections seed process...\n');

    // Step 1: Create collections
    console.log('📚 Creating collections...');
    const createdCollections: { [slug: string]: string } = {};

    for (const collection of COLLECTIONS_METADATA) {
        const { data, error } = await supabase
            .from('curated_collections')
            .upsert(collection, { onConflict: 'slug' })
            .select('id, slug')
            .single();

        if (error) {
            console.error(`❌ Error creating collection ${collection.slug}:`, error);
            continue;
        }

        createdCollections[data.slug] = data.id;
        console.log(`✅ Created/updated collection: ${collection.name} (${collection.slug})`);
    }

    console.log(`\n✅ ${Object.keys(createdCollections).length} collections created\n`);

    // Step 2: Parse CSV
    const csvPath = path.join(process.cwd(), 'libros_explorar.csv');
    console.log(`📄 Reading CSV file: ${csvPath}`);

    let csvRows: CSVRow[];
    try {
        csvRows = await parseCSV(csvPath);
        console.log(`✅ Parsed ${csvRows.length} books from CSV\n`);
    } catch (error) {
        console.error('❌ Error reading CSV file:', error);
        process.exit(1);
    }

    // Step 3: Fetch book data and insert
    console.log('🔍 Fetching book data from ISBNdb and inserting...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const row of csvRows) {
        const collectionId = createdCollections[row.collection_id];

        if (!collectionId) {
            console.warn(`⚠️  Unknown collection: ${row.collection_id} for ISBN ${row.isbn}`);
            errorCount++;
            continue;
        }

        console.log(`  Fetching ${row.isbn} (${row.notes})...`);

        try {
            // Fetch book data from ISBNdb
            const bookData = await getBookByISBN(row.isbn);

            if (!bookData) {
                console.warn(`  ⚠️  No data found for ISBN ${row.isbn}`);
                errorCount++;
                continue;
            }

            // Insert or update book in collection
            const { error } = await supabase
                .from('curated_collection_books')
                .upsert(
                    {
                        collection_id: collectionId,
                        isbn: row.isbn,
                        book_data: bookData,
                        display_order: row.order,
                    },
                    { onConflict: 'collection_id,isbn' }
                );

            if (error) {
                console.error(`  ❌ Error inserting book ${row.isbn}:`, error);
                errorCount++;
            } else {
                console.log(`  ✅ ${bookData.title}`);
                successCount++;
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.error(`  ❌ Error processing ISBN ${row.isbn}:`, error);
            errorCount++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Seed Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully seeded: ${successCount} books`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📚 Total collections: ${Object.keys(createdCollections).length}`);
    console.log('='.repeat(60));

    if (errorCount > 0) {
        console.log('\n⚠️  Some books failed to seed. Check the logs above for details.');
        process.exit(1);
    } else {
        console.log('\n🎉 All books seeded successfully!');
    }
}

main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
