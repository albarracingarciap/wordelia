#!/usr/bin/env node
/**
 * Generate SQL INSERT statements from exported JSON data
 * This bypasses RLS policies by inserting directly via SQL
 */

const fs = require('fs');
const path = require('path');

const EXPORT_DIR = path.join(__dirname, 'exports');
const OUTPUT_FILE = path.join(__dirname, 'import_data.sql');

const TABLES = [
    'profiles',
    'authors',
    'books',
    'user_books',
    'lists',
    'list_items',
    'reading_sessions',
    'book_notes',
    'badges',
    'user_badges',
];

function escapeString(str) {
    if (str === null || str === undefined) return 'NULL';
    if (typeof str === 'boolean') return str ? 'true' : 'false';
    if (typeof str === 'number') return str;
    if (typeof str === 'object') return `'${JSON.stringify(str).replace(/'/g, "''")}'`;
    return `'${String(str).replace(/'/g, "''")}'`;
}

function generateInsertStatements(tableName, data) {
    if (!data || data.length === 0) return '';

    const lines = [];
    lines.push(`\n-- Importing ${tableName} (${data.length} records)`);
    lines.push(`-- Temporarily disable triggers and RLS`);
    lines.push(`ALTER TABLE public.${tableName} DISABLE TRIGGER ALL;`);

    for (const record of data) {
        const columns = Object.keys(record);
        const values = columns.map(col => escapeString(record[col]));

        const sql = `INSERT INTO public.${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;`;
        lines.push(sql);
    }

    lines.push(`ALTER TABLE public.${tableName} ENABLE TRIGGER ALL;`);
    lines.push(`SELECT COUNT(*) as ${tableName}_count FROM public.${tableName};`);

    return lines.join('\n');
}

function main() {
    console.log('📝 Generating SQL import script...\n');

    const sqlStatements = [];
    sqlStatements.push('-- DATA IMPORT SCRIPT');
    sqlStatements.push('-- Generated automatically from exported JSON data\n');
    sqlStatements.push('BEGIN;');
    sqlStatements.push('-- Disable RLS for import');
    sqlStatements.push('SET session_replication_role = replica;\n');

    let totalRecords = 0;

    for (const table of TABLES) {
        const filePath = path.join(EXPORT_DIR, `${table}.json`);

        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  No export file for ${table}`);
            continue;
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`✅ ${table}: ${data.length} records`);

        sqlStatements.push(generateInsertStatements(table, data));
        totalRecords += data.length;
    }

    sqlStatements.push('\n-- Re-enable RLS');
    sqlStatements.push('SET session_replication_role = DEFAULT;');
    sqlStatements.push('COMMIT;');
    sqlStatements.push(`\n-- Total records to import: ${totalRecords}`);

    fs.writeFileSync(OUTPUT_FILE, sqlStatements.join('\n'));

    console.log(`\n📄 SQL script generated: ${OUTPUT_FILE}`);
    console.log(`📊 Total records: ${totalRecords}`);
    console.log('\nNext steps:');
    console.log('1. scp supabase/migration/import_data.sql root@195.35.2.136:/tmp/');
    console.log('2. docker cp /tmp/import_data.sql d29b30086867:/import_data.sql');
    console.log('3. docker exec -it d29b30086867 psql -U postgres -d postgres -f /import_data.sql');
}

main();
