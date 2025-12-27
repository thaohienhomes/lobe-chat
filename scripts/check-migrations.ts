import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function testBundledApps() {
  try {
    console.log('=== Bundled Apps Test ===\n');

    // Get all bundled apps
    const apps =
      await sql`SELECT id, title, description, category, is_public FROM bundled_apps ORDER BY title`;
    console.log(`Found ${apps.length} bundled apps:\n`);

    for (const app of apps) {
      console.log(`📦 ${app.title}`);
      console.log(`   ID: ${app.id}`);
      console.log(`   Category: ${app.category || 'N/A'}`);
      console.log(`   Public: ${app.is_public ? 'Yes' : 'No'}`);
      console.log(`   Description: ${app.description?.slice(0, 80)}...`);
      console.log('');
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

await testBundledApps();
