#!/usr/bin/env node
/**
 * Export all data from the old Supabase instance
 * This script exports data from all tables in JSON format
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.migration') });

const OLD_URL = process.env.OLD_SUPABASE_URL;
const OLD_KEY = process.env.OLD_SUPABASE_ANON_KEY;

const supabase = createClient(OLD_URL, OLD_KEY);

const EXPORT_DIR = path.join(__dirname, 'exports');

// Tables to export in dependency order
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

async function exportTable(tableName) {
  console.log(`📦 Exporting ${tableName}...`);
  
  let allData = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, from + batchSize - 1);
    
    if (error) {
      console.error(`❌ Error exporting ${tableName}:`, error);
      throw error;
    }
    
    if (!data || data.length === 0) break;
    
    allData = allData.concat(data);
    from += batchSize;
    
    console.log(`   Fetched ${allData.length} records...`);
    
    if (data.length < batchSize) break;
  }
  
  const filePath = path.join(EXPORT_DIR, `${tableName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));
  
  console.log(`✅ Exported ${allData.length} records from ${tableName}`);
  return allData.length;
}

async function main() {
  console.log('🚀 Starting data export from old Supabase instance...\n');
  
  // Create exports directory if it doesn't exist
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }
  
  const stats = {};
  
  for (const table of TABLES) {
    try {
      const count = await exportTable(table);
      stats[table] = count;
    } catch (error) {
      console.error(`Failed to export ${table}, continuing...`);
      stats[table] = 'ERROR';
    }
    console.log(''); // Empty line for readability
  }
  
  // Save export summary
  const summaryPath = path.join(EXPORT_DIR, '_export_summary.json');
  const summary = {
    exportedAt: new Date().toISOString(),
    tables: stats,
    totalRecords: Object.values(stats).reduce((sum, count) => 
      typeof count === 'number' ? sum + count : sum, 0
    ),
  };
  
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log('📊 Export Summary:');
  console.log(JSON.stringify(summary, null, 2));
  console.log('\n✅ Data export completed!');
}

main().catch(console.error);
