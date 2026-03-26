#!/usr/bin/env node
import pkg from 'better-sqlite3';
const Database = pkg.default || pkg;

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, '../data/test.db'));

console.log('Testing SQLite...');

try {
  db.exec(`CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY, name TEXT)`);
  console.log('✓ Table created');
  
  db.exec(`INSERT INTO test_table (name) VALUES ('test')`);
  console.log('✓ Data inserted');
  
  const result = db.prepare(`SELECT * FROM test_table`).all();
  console.log('✓ Data queried:', result);
  
  db.close();
  console.log('✓ Test passed!');
} catch (error) {
  console.error('✗ Test failed:', error.message);
  process.exit(1);
}
