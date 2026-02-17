#!/usr/bin/env node
/**
 * Import all data to the new Supabase instance
 * Imports data in dependency order to respect foreign keys
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.migration') });

const NEW_URL = process.env.NEW_SUPABASE_URL;
const NEW_KEY = process.env.NEW_SUPABASE_SERVICE_KEY;

const supabase = createClient(NEW_URL, NEW_KEY);

const EXPORT_DIR = path.join(__dirname, 'exports');

// Tables to import in dependency order (respect foreign keys)
const TABLES = [
    'profiles',       // No dependencies
    'authors',        // No dependencies
    'books',          // Depends on authors
    'user_books',     // Depends on profiles, books
    'lists',          // Depends on profiles
    'list_items',     // Depends on lists, books
    'reading_sessions', // Depends on profiles, books
    'book_notes',     // Depends on profiles, books
    'badges',         // No dependencies
    'user_badges',    // Depends on profiles, badges
];

async function importTable(tableName) {
    console.log(`📦 Importing ${tableName}...`);

    const filePath = path.join(EXPORT_DIR, `${tableName}.json`);

    if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️  No export file found for ${tableName}, skipping`);
        return 0;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data || data.length === 0) {
        console.log(`   No data to import for ${tableName}`);
        return 0;
    }

    console.log(`   Found ${data.length} records to import`);

    // Import in batches
    const batchSize = 100;
    let importedCount = 0;

    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        const { error } = await supabase
            .from(tableName)
            .insert(batch);

        if (error) {
            console.error(`   ❌ Error importing batch ${i / batchSize + 1}:`, error);

            // Try inserting one by one to identify problematic records
            console.log(`   Trying to insert records individually...`);
            for (const record of batch) {
                const { error: singleError } = await supabase
                    .from(tableName)
                    .insert([record]);

                if (singleError) {
                    console.error(`   ❌ Failed to insert record:`, record.id || 'unknown');
                    console.error(`      Error:`, JSON.stringify(singleError, null, 2));
                } else {
                    importedCount++;
                }
            }
        } else {
            importedCount += batch.length;
            console.log(`   Imported ${importedCount}/${data.length} records...`);
        }
    }

    console.log(`✅ Imported ${importedCount} records to ${tableName}\n`);
    return importedCount;
}

async function main() {
    console.log('🚀 Starting data import to new Supabase instance...\n');
    console.log(`Target: ${NEW_URL}\n`);

    const stats = {};

    for (const table of TABLES) {
        try {
            const count = await importTable(table);
            stats[table] = count;
        } catch (error) {
            console.error(`Failed to import ${table}:`, error);
            stats[table] = 'ERROR';
        }
    }

    // Save import summary
    const summaryPath = path.join(__dirname, 'imports', '_import_summary.json');
    if (!fs.existsSync(path.join(__dirname, 'imports'))) {
        fs.mkdirSync(path.join(__dirname, 'imports'), { recursive: true });
    }

    const summary = {
        importedAt: new Date().toISOString(),
        targetInstance: NEW_URL,
        tables: stats,
        totalRecords: Object.values(stats).reduce((sum, count) =>
            typeof count === 'number' ? sum + count : sum, 0
        ),
    };

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log('📊 Import Summary:');
    console.log(JSON.stringify(summary, null, 2));
    console.log('\n✅ Data import completed!');
}

main().catch(console.error);
