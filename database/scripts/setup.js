// Database Setup Script
// Script để thiết lập và khởi tạo database

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPostgresPool, connectMongoDB } from '../config/database.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to run SQL migrations
const runMigrations = async () => {
  const pool = getPostgresPool();
  const migrationDir = path.join(__dirname, '../postgresql/migrations');
  
  try {
    // Get all migration files
    const migrationFiles = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log('Running PostgreSQL migrations...');
    
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
      await pool.query(sql);
    }
    
    console.log('PostgreSQL migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
};

// Function to seed PostgreSQL data
const seedPostgreSQL = async () => {
  const pool = getPostgresPool();
  
  try {
    console.log('Seeding PostgreSQL data...');
    const seedSQL = fs.readFileSync(path.join(__dirname, '../postgresql/seed_data.sql'), 'utf8');
    await pool.query(seedSQL);
    console.log('PostgreSQL data seeded successfully');
  } catch (error) {
    console.error('PostgreSQL seeding error:', error);
    throw error;
  }
};

// Function to create MongoDB indexes
const createMongoIndexes = async () => {
  const db = await connectMongoDB();
  
  try {
    console.log('Creating MongoDB indexes...');
    
    // Comments indexes
    await db.collection('comments').createIndex({ eventId: 1 });
    await db.collection('comments').createIndex({ userId: 1 });
    await db.collection('comments').createIndex({ createdAt: -1 });
    await db.collection('comments').createIndex({ parentId: 1 });
    
    // User activities indexes
    await db.collection('user_activities').createIndex({ userId: 1 });
    await db.collection('user_activities').createIndex({ activityType: 1 });
    await db.collection('user_activities').createIndex({ timestamp: -1 });
    await db.collection('user_activities').createIndex({ eventId: 1 });
    
    // Event analytics indexes
    await db.collection('event_analytics').createIndex({ eventId: 1 });
    await db.collection('event_analytics').createIndex({ date: -1 });
    await db.collection('event_analytics').createIndex({ eventId: 1, date: -1 });
    
    // System logs indexes
    await db.collection('system_logs').createIndex({ level: 1 });
    await db.collection('system_logs').createIndex({ service: 1 });
    await db.collection('system_logs').createIndex({ timestamp: -1 });
    await db.collection('system_logs').createIndex({ userId: 1 });
    
    // Notifications queue indexes
    await db.collection('notifications_queue').createIndex({ userId: 1 });
    await db.collection('notifications_queue').createIndex({ status: 1 });
    await db.collection('notifications_queue').createIndex({ scheduledAt: 1 });
    await db.collection('notifications_queue').createIndex({ priority: 1 });
    
    // Search index indexes
    await db.collection('search_index').createIndex({ eventId: 1 });
    await db.collection('search_index').createIndex({ category: 1 });
    await db.collection('search_index').createIndex({ status: 1 });
    await db.collection('search_index').createIndex({ startTime: 1 });
    await db.collection('search_index').createIndex({ 
      searchText: 'text',
      title: 'text',
      description: 'text',
      location: 'text'
    });
    
    // User preferences indexes
    await db.collection('user_preferences').createIndex({ userId: 1 });
    
    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('MongoDB index creation error:', error);
    throw error;
  }
};

// Main setup function
const setup = async () => {
  try {
    console.log('Starting database setup...');
    
    // Run PostgreSQL migrations
    await runMigrations();
    
    // Seed PostgreSQL data
    await seedPostgreSQL();
    
    // Create MongoDB indexes
    await createMongoIndexes();
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  } 
};

// Run setup if this file is executed directly
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
    setup();
}  

export {
  runMigrations,
  seedPostgreSQL,
  createMongoIndexes,
  setup
};