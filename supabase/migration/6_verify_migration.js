#!/usr/bin/env node
/**
 * Verify the migration was successful by comparing data counts
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.migration') });

const OLD_URL = process.env.OLD_SUPABASE_URL;
const OLD_KEY = process.env.OLD_SUPABASE_ANON_KEY;
const NEW_URL = process.env.NEW_SUPABASE_URL;
const NEW_KEY = process.env.NEW_SUPABASE_SERVICE_KEY;

const oldSupabase = createClient(OLD_URL, OLD_KEY);
const newSupabase = createClient(NEW_URL, NEW_KEY);

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

async function getTableCount(supabase, tableName) {
    const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error(`Error counting ${tableName}:`, error);
        return null;
    }

    return count;
}

async function verifyTable(tableName) {
    console.log(`🔍 Verifying ${tableName}...`);

    const oldCount = await getTableCount(oldSupabase, tableName);
    const newCount = await getTableCount(newSupabase, tableName);

    const match = oldCount === newCount;
    const status = match ? '✅' : '❌';

    console.log(`   ${status} Old: ${oldCount} | New: ${newCount}`);

    return {
        table: tableName,
        oldCount,
        newCount,
        match,
    };
}

async function main() {
    console.log('🚀 Starting migration verification...\n');
    console.log(`Old instance: ${OLD_URL}`);
    console.log(`New instance: ${NEW_URL}\n`);

    const results = [];

    for (const table of TABLES) {
        const result = await verifyTable(table);
        results.push(result);
    }

    console.log('\n📊 Verification Summary:');
    console.log('═══════════════════════════════════════════\n');

    const allMatch = results.every(r => r.match);

    if (allMatch) {
        console.log('🎉 SUCCESS! All tables match!');
    } else {
        console.log('⚠️  WARNING: Some tables do not match!');
        console.log('\nMismatched tables:');
        results
            .filter(r => !r.match)
            .forEach(r => {
                console.log(`  - ${r.table}: Old(${r.oldCount}) → New(${r.newCount})`);
            });
    }

    // Save verification report
    const reportPath = path.join(__dirname, 'imports', '_verification_report.json');
    const report = {
        verifiedAt: new Date().toISOString(),
        oldInstance: OLD_URL,
        newInstance: NEW_URL,
        allMatch,
        results,
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    process.exit(allMatch ? 0 : 1);
}

main().catch(console.error);
