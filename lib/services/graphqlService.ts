// Note: Using direct fetch instead of Apollo Client

// Import fetch for server-side usage
// Note: Using dynamic import in top-level requires Node.js environment with fetch polyfill

// Note: Apollo client setup removed - using direct fetch approach instead

export interface GraphQLNoun {
  id: string;
  seed: {
    background: string;
    body: string;
    accessory: string;
    head: string;
    glasses: string;
  };
  owner: {
    id: string;
  };
}

export interface GraphQLNounDetail extends GraphQLNoun {
  votes: Array<{
    id: string;
    support: boolean;
    votes: string;
    blockNumber: string;
    voter: {
      id: string;
    };
    proposal: {
      id: string;
      title: string;
      status: string;
    };
  }>;
}

/**
 * Fetch nouns from GraphQL API using direct fetch
 */
export async function fetchNounsFromGraphQL(
  skip: number = 0,
  first: number = 1000
): Promise<GraphQLNoun[]> {
  try {
    const query = `
      query GetNouns($first: Int!, $skip: Int!) {
        nouns(
          first: $first, 
          skip: $skip, 
          orderBy: id, 
          orderDirection: desc
        ) {
          id
          seed {
            background
            body
            accessory
            head
            glasses
          }
          owner {
            id
          }
        }
      }
    `;

    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://api.goldsky.com/api/public/project_cldf2o9pqagp43svvbk5u3kmo/subgraphs/nouns/prod/gn';
    
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          first,
          skip
        }
      })
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    console.log(`📦 GraphQL returned ${result.data?.nouns?.length || 0} nouns`);
    return result.data?.nouns || [];
  } catch (error) {
    console.error('Error fetching nouns from GraphQL:', error);
    throw new Error(`GraphQL fetch failed: ${error}`);
  }
}

/**
 * Fetch a single noun with full details from GraphQL
 */
export async function fetchNounDetailFromGraphQL(id: string): Promise<GraphQLNounDetail | null> {
  try {
    const query = `
      query GetNounDetail($id: String!) {
        noun(id: $id) {
          id
          seed {
            background
            body
            accessory
            head
            glasses
          }
          owner {
            id
          }
          votes(first: 100, orderBy: blockNumber, orderDirection: desc) {
            id
            support
            votes
            blockNumber
            voter {
              id
            }
            proposal {
              id
              title
              status
            }
          }
        }
      }
    `;

    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://api.goldsky.com/api/public/project_cldf2o9pqagp43svvbk5u3kmo/subgraphs/nouns/prod/gn';
    
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { id }
      })
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data?.noun || null;
  } catch (error) {
    console.error('Error fetching noun detail from GraphQL:', error);
    throw new Error(`GraphQL noun detail fetch failed: ${error}`);
  }
}

/**
 * Get the latest noun ID from GraphQL
 */
export async function getLatestNounIdFromGraphQL(): Promise<number> {
  try {
    const nouns = await fetchNounsFromGraphQL(0, 1);
    if (nouns.length === 0) {
      throw new Error('No nouns found in GraphQL');
    }
    return parseInt(nouns[0].id);
  } catch (error) {
    console.error('Error getting latest noun ID:', error);
    throw error;
  }
}

/**
 * Fetch all nouns after a certain ID (for sync)
 */
export async function fetchNewNounsFromGraphQL(afterId: number): Promise<GraphQLNoun[]> {
  const BATCH_SIZE = 1000;
  const allNouns: GraphQLNoun[] = [];
  let skip = 0;
  let hasMore = true;

  try {
    console.log(`🔄 Fetching new nouns after ID ${afterId}...`);

    while (hasMore) {
      const batch = await fetchNounsFromGraphQL(skip, BATCH_SIZE);
      
      if (batch.length === 0) {
        hasMore = false;
        break;
      }

      // Filter nouns that are newer than afterId
      const newNouns = batch.filter(noun => parseInt(noun.id) > afterId);
      
      if (newNouns.length === 0) {
        // We've reached nouns older than afterId, stop fetching
        hasMore = false;
        break;
      }

      allNouns.push(...newNouns);

      // If we got fewer than BATCH_SIZE nouns, we've reached the end
      if (batch.length < BATCH_SIZE) {
        hasMore = false;
      } else {
        skip += BATCH_SIZE;
      }

      // Small delay to be respectful to the API
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Fetched ${allNouns.length} new nouns from GraphQL`);
    return allNouns;
  } catch (error) {
    console.error('Error fetching new nouns:', error);
    throw error;
  }
}

/**
 * Convert GraphQL noun to our database format
 */
export function convertGraphQLNoun(graphqlNoun: GraphQLNoun) {
  return {
    id: parseInt(graphqlNoun.id),
    background: parseInt(graphqlNoun.seed.background),
    body: parseInt(graphqlNoun.seed.body),
    accessory: parseInt(graphqlNoun.seed.accessory),
    head: parseInt(graphqlNoun.seed.head),
    glasses: parseInt(graphqlNoun.seed.glasses),
    owner_address: graphqlNoun.owner.id.toLowerCase()
  };
}
