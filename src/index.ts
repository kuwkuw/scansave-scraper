// This is the main script to run your scrapers.
// You would typically schedule this script to run periodically (e.g., daily)
// using tools like Cron jobs on a server, or cloud functions (AWS Lambda, Google Cloud Functions).

import { scrapeSilpoCategory } from './scrapers/silpoScraper';
import { scrapeAtbCategory } from './scrapers/atbScraper';
import { CATEGORY_URLS, BASE_URLS } from '../config';
import { saveProductsToDatabase } from './db/products';// Function to handle data persistence

/**
 * Main function to orchestrate the scraping process for all configured supermarkets.
 */
async function runAllScrapers() {
  try {
    console.log('🚀 Starting Supermarket Scrapers 🚀');
    console.log(`Current Time (EEST): ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}`);

    const args = process.argv.slice(2);
    const marketArg = args[0]?.toLowerCase();

    // --- Run Silpo Scraper ---
    if (!marketArg || marketArg === 'silpo') {
      console.log('\n--- Running Silpo Scraper ---');
      for (const [categoryKey, urls] of Object.entries(CATEGORY_URLS)) {
        const categoryPath = urls.silpo;
        if (!categoryPath) continue;
        const categoryName = categoryKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const categoryUrl = categoryPath.startsWith('http') ? categoryPath : BASE_URLS.silpo + categoryPath;
        console.log('\n' + '='.repeat(50));
        console.log(`[Silpo] Scraping ${categoryName} category`);
        console.log(`[Silpo] URL: ${categoryUrl}`);
        console.log(`[Silpo] Time: ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}`);
        console.log('='.repeat(50));
        try {
          const products = await scrapeSilpoCategory(categoryUrl, categoryName, categoryPath);
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
    }

    // --- Run ATB Scraper ---
    if (!marketArg || marketArg === 'atb') {
      console.log('\n--- Running ATB Scraper ---');
      for (const [categoryKey, urls] of Object.entries(CATEGORY_URLS)) {
        const categoryPath = urls.atb;
        if (!categoryPath) continue;
        const categoryName = categoryKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const categoryUrl = categoryPath.startsWith('http') ? categoryPath : BASE_URLS.atb + categoryPath;
        console.log('\n' + '='.repeat(50));
        console.log(`[ATB] Scraping ${categoryName} category`);
        console.log(`[ATB] URL: ${categoryUrl}`);
        console.log(`[ATB] Time: ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}`);
        console.log('='.repeat(50));
        try {
          const products = await scrapeAtbCategory(categoryUrl, categoryName, categoryPath);
          if (products.length > 0) {
            console.log(`[ATB] ✅ Found ${products.length} products in ${categoryName}`);
            console.log('First product example:', JSON.stringify(products[0], null, 2));
            await saveProductsToDatabase(products);
          } else {
            console.log(`[ATB] ⚠️ No products found in ${categoryName} category.`);
          }
        } catch (error) {
          console.error(`[ATB] ❌ Error scraping ${categoryName} category:`, error);
        }
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