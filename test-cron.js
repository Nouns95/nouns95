#!/usr/bin/env node

// Simple script to test the cron job locally
// Usage: node test-cron.js [your-vercel-domain]

const domain = process.argv[2] || 'your-app.vercel.app';
const cronSecret = process.env.CRON_SECRET || '6994525134';

async function testCronEndpoint(endpoint, name) {
  console.log(`\n🧪 Testing ${name}...`);
  console.log(`URL: https://${domain}${endpoint}`);
  
  try {
    const response = await fetch(`https://${domain}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error(`❌ ${name} failed`);
    } else {
      console.log(`✅ ${name} succeeded`);
    }
    
  } catch (error) {
    console.error(`❌ ${name} error:`, error.message);
  }
}

async function main() {
  if (!process.argv[2]) {
    console.log('❗ Please provide your Vercel domain:');
    console.log('   node test-cron.js your-app.vercel.app');
    console.log('\n💡 You can find your domain in the Vercel dashboard');
    return;
  }
  
  console.log(`🔍 Testing cron jobs on: https://${domain}`);
  console.log(`🔑 Using CRON_SECRET: ${cronSecret.substring(0, 4)}...`);
  
  // Test all cron endpoints
  await testCronEndpoint('/api/cron/sync-nouns', 'Noun Sync');
  await testCronEndpoint('/api/cron/sync-ens', 'ENS Sync');
  await testCronEndpoint('/api/cron/sync-images', 'Image Sync');
  
  console.log('\n✨ Testing complete!');
}

main().catch(console.error);
