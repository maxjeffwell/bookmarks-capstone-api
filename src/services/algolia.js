import { liteClient as algoliasearch } from 'algoliasearch/lite';

const appId = import.meta.env.VITE_ALGOLIA_APP_ID;
const searchApiKey = import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY;
const indexName = import.meta.env.VITE_ALGOLIA_INDEX_NAME;

// Check if Algolia is configured
export const isAlgoliaConfigured = () => {
  return !!(appId && searchApiKey && indexName && searchApiKey !== 'your-search-only-api-key-here');
};

// Create Algolia client
let searchClient = null;

if (isAlgoliaConfigured()) {
  searchClient = algoliasearch(appId, searchApiKey);
  console.log('✅ Algolia search initialized');
} else {
  console.warn('⚠️ Algolia not configured. Add VITE_ALGOLIA_SEARCH_API_KEY to .env.local');
  // Create a mock client that returns empty results
  searchClient = {
    search: () => Promise.resolve({ results: [{ hits: [], nbHits: 0 }] })
  };
}

export { searchClient, indexName };
