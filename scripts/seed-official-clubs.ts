import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { getBookByISBN } from '../lib/isbndb';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isbndbApiKey = process.env.ISBNDB_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials. Please check your .env.local file.');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

if (!isbndbApiKey) {
    console.error('❌ Missing ISBNdb API key. Please check your .env.local file.');
    console.error('Required: ISBNDB_API_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Official clubs configuration
const OFFICIAL_CLUBS = [
    {
        slug: 'mundo-distopico',
        name: 'Club Oficial: Mundo Distópico',
        description: 'Explora sociedades futuras controladas y la lucha por la libertad a través de clásicos distópicos que desafían nuestra percepción del futuro.',
        isbn: '9781644730539', // Fahrenheit 451
        theme_color: 'from-orange-500 to-red-600',
        theme_icon: 'Flame',
        is_featured: false,
        display_order: 1,
    },
    {
        slug: 'resistencia-psicologica',
        name: 'Club Oficial: Resistencia Psicológica',
        description: 'Descubre historias de personajes que enfrentan opresión y manipulación mental, manteniendo su humanidad contra sistemas totalitarios.',
        isbn: '9788499890944', // 1984
        theme_color: 'from-gray-600 to-blue-800',
        theme_icon: 'Eye',
        is_featured: false,
        display_order: 2,
    },
    {
        slug: 'justicia-social',
        name: 'Club Oficial: Justicia Social',
        description: 'Análisis profundo de obras que cuestionan prejuicios y desigualdades, promoviendo reflexión sobre la justicia y la moralidad.',
        isbn: '9788491392255', // Matar a un Ruiseñor
        theme_color: 'from-green-600 to-yellow-600',
        theme_icon: 'Scale',
        is_featured: false,
        display_order: 3,
    },
    {
        slug: 'alegoria-social',
        name: 'Club Oficial: Alegoría Social',
        description: 'Lecturas que utilizan metáforas poderosas para comentar sobre la condición humana y las estructuras sociales contemporáneas.',
        isbn: '9788490628720', // Ensayo sobre la ceguera
        theme_color: 'from-slate-700 to-gray-900',
        theme_icon: 'EyeOff',
        is_featured: false,
        display_order: 4,
    },
    {
        slug: 'club-del-mes',
        name: 'Club del Mes',
        description: 'Nuestro club destacado: una exploración de la resistencia femenina y el control reproductivo en sociedades opresivas.',
        isbn: '9788415631804', // El cuento de la criada
        theme_color: 'from-red-500 to-pink-600',
        theme_icon: 'Users',
        is_featured: true,
        display_order: 0,
    },
];

// Fetch book data from ISBNdb using the lib function
async function fetchBookData(isbn: string) {
    try {
        const bookData = await getBookByISBN(isbn);
        return bookData;
    } catch (error) {
        console.error(`❌ Error fetching book data for ISBN ${isbn}:`, error);
        return null;
    }
}

// Main seed function
async function seedOfficialClubs() {
    console.log('🌱 Starting official clubs seed...\n');

    for (const club of OFFICIAL_CLUBS) {
        console.log(`📚 Processing: ${club.name}`);
        console.log(`   ISBN: ${club.isbn}`);

        // Fetch book data from ISBNdb
        const bookData = await fetchBookData(club.isbn);

        if (!bookData) {
            console.log(`   ⚠️  Skipping ${club.name} - could not fetch book data\n`);
            continue;
        }

        console.log(`   ✅ Book data fetched: ${bookData.title}`);

        // Insert club into database
        const { data, error } = await supabase
            .from('official_clubs')
            .upsert(
                {
                    slug: club.slug,
                    name: club.name,
                    description: club.description,
                    book_isbn: club.isbn,
                    book_data: bookData,
                    start_date: '2026-03-15',
                    theme_color: club.theme_color,
                    theme_icon: club.theme_icon,
                    is_featured: club.is_featured,
                    display_order: club.display_order,
                },
                {
                    onConflict: 'slug',
                }
            )
            .select();

        if (error) {
            console.error(`   ❌ Error inserting club:`, error);
        } else {
            console.log(`   ✅ Club inserted/updated successfully`);
            if (club.is_featured) {
                console.log(`   ⭐ Marked as featured club`);
            }
        }

        console.log('');

        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log('✅ Seed completed!\n');
    console.log('Summary:');
    console.log(`- ${OFFICIAL_CLUBS.length} official clubs processed`);
    console.log(`- Start date: March 15, 2026`);
    console.log(`- 1 featured club (Club del Mes)`);
}

// Run seed
seedOfficialClubs()
    .then(() => {
        console.log('\n🎉 All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    });
