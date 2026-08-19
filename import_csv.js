/**
 * Allianz Payment Tracker - CSV Import Utility Script (Node.js)
 * 
 * Usage:
 *   node import_csv.js [path-to-csv-file]
 * 
 * Example:
 *   node import_csv.js sample_students.csv
 * 
 * You can set SUPABASE_URL and SUPABASE_KEY via environment variables
 * or edit the constants below.
 */

const fs = require('fs');
const path = require('path');

// Configure your Supabase Credentials here or via ENV
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://YOUR_SUPABASE_PROJECT.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_ANON_KEY';

/**
 * Simple Robust CSV Parser for handling quotes and commas
 */
function parseCSV(content) {
    const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];

    // Parse header
    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
    
    // Find column indexes
    const cursoIdx = headers.findIndex(h => h === 'curso' || h === 'class' || h === 'grado');
    const nameIdx = headers.findIndex(h => h === 'nombre' || h === 'name' || h === 'student' || h === 'alumno');

    if (cursoIdx === -1 || nameIdx === -1) {
        throw new Error(`CSV headers must contain 'Curso' and 'Nombre' columns. Found: ${headers.join(', ')}`);
    }

    const records = [];
    for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length === 0 || row.every(cell => !cell.trim())) continue;
        
        const curso = (row[cursoIdx] || '').trim();
        const name = (row[nameIdx] || '').trim();

        if (name && curso) {
            records.push({
                name: name,
                curso: curso,
                paid_status: false
            });
        }
    }

    return records;
}

function parseCSVLine(text) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            if (inQuotes && text[i + 1] === '"') {
                cur += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            result.push(cur);
            cur = '';
        } else {
            cur += c;
        }
    }
    result.push(cur);
    return result;
}

/**
 * Batch insert records to Supabase via REST API
 */
async function importToSupabase(records) {
    if (!SUPABASE_URL || SUPABASE_URL.includes('YOUR_SUPABASE_PROJECT')) {
        console.error('\n❌ ERROR: Please configure SUPABASE_URL and SUPABASE_KEY in import_csv.js or via environment variables.');
        process.exit(1);
    }

    console.log(`\n🚀 Connecting to Supabase at: ${SUPABASE_URL}`);
    console.log(`📦 Preparing to import ${records.length} students...`);

    const endpoint = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/students`;
    
    // Batch in chunks of 50
    const chunkSize = 50;
    let insertedTotal = 0;

    for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        console.log(`⏳ Uploading batch ${Math.floor(i / chunkSize) + 1} (${chunk.length} records)...`);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(chunk)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to insert batch: HTTP ${response.status} - ${errorText}`);
        }

        insertedTotal += chunk.length;
    }

    console.log(`\n✅ SUCCESS: Successfully imported all ${insertedTotal} students into the 'students' table!`);
}

// CLI Execution Entry Point
async function main() {
    const filePath = process.argv[2] || path.join(__dirname, 'sample_students.csv');

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        console.log('Usage: node import_csv.js <path-to-csv>');
        process.exit(1);
    }

    console.log(`📄 Reading CSV file: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    try {
        const records = parseCSV(fileContent);
        console.log(`✅ Parsed ${records.length} valid student rows:`);
        console.table(records.slice(0, 5));
        if (records.length > 5) console.log(`... and ${records.length - 5} more`);

        await importToSupabase(records);
    } catch (err) {
        console.error('❌ Error during import:', err.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { parseCSV, importToSupabase };
