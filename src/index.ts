// This is the main script to run your scrapers.
// You would typically schedule this script to run periodically (e.g., daily)
// using tools like Cron jobs on a server, or cloud functions (AWS Lambda, Google Cloud Functions).

import { scrapeSilpoCategory } from './scrapers/silpoScraper';
// import { scrapeAtbCategory } from './scrapers/atbScraper'; // Uncomment and import when you create atbScraper.ts
import { SUPERMARKET_CONFIGS } from '../config';
import { saveProductsToDatabase } from './db/products';// Function to handle data persistence

/**
 * Main function to orchestrate the scraping process for all configured supermarkets.
 */
async function runAllScrapers() {
  try {
    console.log('🚀 Starting Supermarket Scrapers 🚀');
    console.log(`Current Time (EEST): ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}`);
    console.log('\nDebug: Loading configuration...');
    console.log('Configuration:', JSON.stringify(SUPERMARKET_CONFIGS.silpo, null, 2));

    // --- Run Silpo Scraper ---
    console.log('\n--- Running Silpo Scraper ---');
    
    // Test with a single category first
    const categoriesToScrape = {
      dairy_eggs: 'Dairy & Eggs'
    } as const;

    console.log('Debug: Starting category iteration...');
    
    for (const [categoryKey, categoryName] of Object.entries(categoriesToScrape)) {
      const categoryPath = SUPERMARKET_CONFIGS.silpo.categories[categoryKey as keyof typeof SUPERMARKET_CONFIGS.silpo.categories];
      const categoryUrl = categoryPath.startsWith('http') ? categoryPath : SUPERMARKET_CONFIGS.silpo.baseUrl + categoryPath;
      console.log('\n' + '='.repeat(50));
      console.log(`[Silpo] Testing ${categoryName} category scraper`);
      console.log(`[Silpo] URL: ${categoryUrl}`);
      console.log(`[Silpo] Time: ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}`);
      console.log('='.repeat(50));
      
      try {
        console.log('Debug: Calling scrapeSilpoCategory...');
        const products = await scrapeSilpoCategory(
          categoryUrl,
          categoryName
        );
        
        console.log('Debug: Products returned:', products.length);
        
        if (products.length > 0) {
          console.log(`[Silpo] ✅ Found ${products.length} products in ${categoryName}`);
          console.log('First product example:', JSON.stringify(products[0], null, 2));
          await saveProductsToDatabase(products);
        } else {
          console.log(`[Silpo] ⚠️ No products found in ${categoryName} category.`);
        }
      } catch (error) {
        console.error(`[Silpo] ❌ Error scraping ${categoryName} category:`, error);
      }
    }
  } catch (error) {
    console.error('An unhandled error occurred during scraping:', error);
  }

  console.log('\n✅ All configured scrapers finished. ✅');
}

// Execute the main function to start the scraping process
console.log('Debug: Script started');
runAllScrapers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});