#!/usr/bin/env node
/**
 * Export all files from storage buckets
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, '.env.migration') });

const OLD_URL = process.env.OLD_SUPABASE_URL;
const OLD_KEY = process.env.OLD_SUPABASE_ANON_KEY;

const supabase = createClient(OLD_URL, OLD_KEY);

const EXPORT_DIR = path.join(__dirname, 'exports', 'storage');
const BUCKETS = ['avatars'];

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        const file = fs.createWriteStream(destPath);
        protocol.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => { }); // Delete the file on error
            reject(err);
        });
    });
}

async function exportBucket(bucketName) {
    console.log(`📦 Exporting bucket: ${bucketName}...`);

    const bucketDir = path.join(EXPORT_DIR, bucketName);
    if (!fs.existsSync(bucketDir)) {
        fs.mkdirSync(bucketDir, { recursive: true });
    }

    // List all files in bucket
    const { data: files, error } = await supabase
        .storage
        .from(bucketName)
        .list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

    if (error) {
        console.error(`❌ Error listing files in ${bucketName}:`, error);
        throw error;
    }

    if (!files || files.length === 0) {
        console.log(`   No files found in ${bucketName}`);
        return 0;
    }

    console.log(`   Found ${files.length} files`);

    let downloadedCount = 0;
    const fileManifest = [];

    for (const file of files) {
        if (file.name === '.emptyFolderPlaceholder') continue;

        try {
            // Get public URL
            const { data: urlData } = supabase
                .storage
                .from(bucketName)
                .getPublicUrl(file.name);

            const fileUrl = urlData.publicUrl;
            const destPath = path.join(bucketDir, file.name);

            console.log(`   Downloading: ${file.name}`);
            await downloadFile(fileUrl, destPath);

            fileManifest.push({
                name: file.name,
                size: file.metadata?.size,
                contentType: file.metadata?.mimetype,
                downloadedAt: new Date().toISOString(),
            });

            downloadedCount++;
        } catch (error) {
            console.error(`   ❌ Failed to download ${file.name}:`, error.message);
        }
    }

    // Save manifest
    const manifestPath = path.join(bucketDir, '_manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(fileManifest, null, 2));

    console.log(`✅ Downloaded ${downloadedCount} files from ${bucketName}\n`);
    return downloadedCount;
}

async function main() {
    console.log('🚀 Starting storage export from old Supabase instance...\n');

    const stats = {};

    for (const bucket of BUCKETS) {
        try {
            const count = await exportBucket(bucket);
            stats[bucket] = count;
        } catch (error) {
            console.error(`Failed to export bucket ${bucket}`);
            stats[bucket] = 'ERROR';
        }
    }

    // Save summary
    const summaryPath = path.join(EXPORT_DIR, '_storage_summary.json');
    const summary = {
        exportedAt: new Date().toISOString(),
        buckets: stats,
        totalFiles: Object.values(stats).reduce((sum, count) =>
            typeof count === 'number' ? sum + count : sum, 0
        ),
    };

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log('📊 Storage Export Summary:');
    console.log(JSON.stringify(summary, null, 2));
    console.log('\n✅ Storage export completed!');
}

main().catch(console.error);
