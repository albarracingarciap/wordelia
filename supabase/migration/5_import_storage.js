#!/usr/bin/env node
/**
 * Import all files to storage buckets in new instance
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.migration') });

const NEW_URL = process.env.NEW_SUPABASE_URL;
const NEW_KEY = process.env.NEW_SUPABASE_SERVICE_KEY;

const supabase = createClient(NEW_URL, NEW_KEY);

const EXPORT_DIR = path.join(__dirname, 'exports', 'storage');
const BUCKETS = ['avatars'];

async function ensureBucketExists(bucketName) {
    console.log(`🔍 Checking if bucket '${bucketName}' exists...`);

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('❌ Error listing buckets:', error);
        throw error;
    }

    const bucketExists = buckets.some(b => b.name === bucketName);

    if (!bucketExists) {
        console.log(`📦 Creating bucket '${bucketName}'...`);
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
        });

        if (createError) {
            console.error(`❌ Error creating bucket '${bucketName}':`, createError);
            throw createError;
        }

        console.log(`✅ Bucket '${bucketName}' created`);
    } else {
        console.log(`✅ Bucket '${bucketName}' already exists`);
    }
}

async function importBucket(bucketName) {
    console.log(`\n📦 Importing bucket: ${bucketName}...`);

    const bucketDir = path.join(EXPORT_DIR, bucketName);

    if (!fs.existsSync(bucketDir)) {
        console.log(`   ⚠️  No export directory found for ${bucketName}, skipping`);
        return 0;
    }

    // Read manifest
    const manifestPath = path.join(bucketDir, '_manifest.json');
    if (!fs.existsSync(manifestPath)) {
        console.log(`   ⚠️  No manifest found for ${bucketName}, skipping`);
        return 0;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    if (!manifest || manifest.length === 0) {
        console.log(`   No files to import for ${bucketName}`);
        return 0;
    }

    console.log(`   Found ${manifest.length} files to import`);

    await ensureBucketExists(bucketName);

    let uploadedCount = 0;

    for (const file of manifest) {
        const filePath = path.join(bucketDir, file.name);

        if (!fs.existsSync(filePath)) {
            console.log(`   ⚠️  File not found: ${file.name}`);
            continue;
        }

        try {
            const fileBuffer = fs.readFileSync(filePath);

            console.log(`   Uploading: ${file.name}`);

            const { error } = await supabase.storage
                .from(bucketName)
                .upload(file.name, fileBuffer, {
                    contentType: file.contentType || 'application/octet-stream',
                    upsert: true,
                });

            if (error) {
                console.error(`   ❌ Failed to upload ${file.name}:`, error.message);
            } else {
                uploadedCount++;
            }
        } catch (error) {
            console.error(`   ❌ Error uploading ${file.name}:`, error.message);
        }
    }

    console.log(`✅ Uploaded ${uploadedCount} files to ${bucketName}`);
    return uploadedCount;
}

async function main() {
    console.log('🚀 Starting storage import to new Supabase instance...\n');
    console.log(`Target: ${NEW_URL}\n`);

    const stats = {};

    for (const bucket of BUCKETS) {
        try {
            const count = await importBucket(bucket);
            stats[bucket] = count;
        } catch (error) {
            console.error(`Failed to import bucket ${bucket}`);
            stats[bucket] = 'ERROR';
        }
    }

    // Save summary
    const summaryPath = path.join(__dirname, 'imports', '_storage_import_summary.json');
    if (!fs.existsSync(path.join(__dirname, 'imports'))) {
        fs.mkdirSync(path.join(__dirname, 'imports'), { recursive: true });
    }

    const summary = {
        importedAt: new Date().toISOString(),
        targetInstance: NEW_URL,
        buckets: stats,
        totalFiles: Object.values(stats).reduce((sum, count) =>
            typeof count === 'number' ? sum + count : sum, 0
        ),
    };

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log('\n📊 Storage Import Summary:');
    console.log(JSON.stringify(summary, null, 2));
    console.log('\n✅ Storage import completed!');
}

main().catch(console.error);
