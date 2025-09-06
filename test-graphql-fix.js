#!/usr/bin/env node

// Test script to verify the GraphQL fix works
async function testGraphQLFix() {
  console.log('🧪 Testing GraphQL latest noun ID detection...\n');
  
  const graphqlUrl = 'https://api.goldsky.com/api/public/project_cldf2o9pqagp43svvbk5u3kmo/subgraphs/nouns/prod/gn';
  
  // Test the old way (just get first result)
  console.log('📊 Testing OLD method (first result from desc order)...');
  try {
    const oldQuery = `
      query GetNouns($first: Int!, $skip: Int!) {
        nouns(
          first: $first, 
          skip: $skip, 
          orderBy: id, 
          orderDirection: desc
        ) {
          id
        }
      }
    `;
    
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: oldQuery,
        variables: { first: 1, skip: 0 }
      })
    });
    
    const data = await response.json();
    const oldResult = data.data?.nouns?.[0]?.id;
    console.log(`   Result: ${oldResult}`);
    
  } catch (error) {
    console.error('   Error:', error.message);
  }
  
  // Test the new way (check multiple pages for max)
  console.log('\n📊 Testing NEW method (scan pages for true max)...');
  try {
    let maxId = 0;
    let skip = 0;
    const batchSize = 1000;
    
    // Check first few pages to find the actual maximum
    for (let page = 0; page < 5; page++) {
      console.log(`   Checking page ${page + 1} (skip: ${skip})...`);
      
      const query = `
        query GetNouns($first: Int!, $skip: Int!) {
          nouns(
            first: $first, 
            skip: $skip, 
            orderBy: id, 
            orderDirection: desc
          ) {
            id
          }
        }
      `;
      
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: { first: batchSize, skip }
        })
      });
      
      const data = await response.json();
      const nouns = data.data?.nouns || [];
      
      if (nouns.length === 0) {
        console.log(`   No more nouns found on page ${page + 1}`);
        break;
      }
      
      // Find max ID in this batch
      const ids = nouns.map(noun => parseInt(noun.id));
      const batchMaxId = Math.max(...ids);
      const batchMinId = Math.min(...ids);
      maxId = Math.max(maxId, batchMaxId);
      
      console.log(`   Page ${page + 1}: ${nouns.length} nouns, ID range: ${batchMinId} - ${batchMaxId}`);
      
      // If we got less than a full batch, we've reached the end
      if (nouns.length < batchSize) {
        console.log(`   Reached end (got ${nouns.length} < ${batchSize})`);
        break;
      }
      
      skip += batchSize;
    }
    
    console.log(`\n✅ NEW method result: ${maxId}`);
    
    if (maxId >= 1630) {
      console.log('🎉 SUCCESS! Found the correct latest noun ID');
    } else {
      console.log('❌ ISSUE: Still not finding the expected latest noun ID');
    }
    
  } catch (error) {
    console.error('   Error:', error.message);
  }
}

testGraphQLFix().catch(console.error);
