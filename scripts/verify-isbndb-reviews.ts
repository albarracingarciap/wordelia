import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });

const ISBNDB_API_URL = "https://api2.isbndb.com";

async function verifyReviews(isbn: string) {
    const apiKey = process.env.ISBNDB_API_KEY;
    if (!apiKey) {
        console.error("❌ ISBNDB_API_KEY is missing");
        return;
    }

    console.log(`Checking reviews for ISBN: ${isbn}...`);
    const url = `${ISBNDB_API_URL}/book/${isbn}`;

    try {
        const response = await fetch(url, {
            headers: {
                "Authorization": apiKey
            }
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(text);
            return;
        }

        const data = await response.json();
        console.log("Full Book Data Keys:", Object.keys(data.book));

        if ('reviews' in data.book) {
            console.log("\nFound 'reviews' field:");
            console.log(JSON.stringify(data.book.reviews, null, 2));
        } else {
            console.log("\n'reviews' field NOT found in response.");
            // Print all keys to be sure
            console.log("Keys available:", Object.keys(data.book));
        }

    } catch (error) {
        console.error("Exception:", error);
    }
}

// Check a few popular books that likely have reviews
const isbnsToCheck = [
    '9780590353427', // Harry Potter 1
    '9780132350884', // Clean Code
    '9780439064873', // Harry Potter 2
    '9780743273565', // The Great Gatsby
    '9780451524935', // 1984
    '9780061120084', // To Kill a Mockingbird
    '9780307277671', // The Da Vinci Code
];

async function main() {
    for (const isbn of isbnsToCheck) {
        await verifyReviews(isbn);
        console.log("---------------------------------------------------");
        // small delay
        await new Promise(r => setTimeout(r, 1000));
    }
}

main();
