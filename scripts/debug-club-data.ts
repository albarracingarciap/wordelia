import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBookData() {
    const { data, error } = await supabase
        .from('official_clubs')
        .select('slug, name, book_data')
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Sample club data:');
        console.log('Slug:', data[0].slug);
        console.log('Name:', data[0].name);
        console.log('\nbook_data structure:');
        console.log(JSON.stringify(data[0].book_data, null, 2));

        const bookData = data[0].book_data as any;
        console.log('\ncover_url value:', bookData?.cover_url);
        console.log('image value:', bookData?.image);
    }
}

checkBookData();
