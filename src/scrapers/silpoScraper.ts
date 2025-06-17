// backend/src/scrapers/silpoScraper.ts
import puppeteer, { Page } from 'puppeteer';
import { SUPERMARKET_CONFIGS, ScrapedProduct } from '../../config';
import type { SupermarketConfig } from '../../config';

// Get the specific configuration for Silpo
const config = SUPERMARKET_CONFIGS.silpo;

/**
 * Scrapes a specific category page on Silpo's website.
 * @param categoryUrl The URL of the category page to scrape.
 * @param categoryName The name of the category (e.g., "Dairy").
 * @returns A promise that resolves to an array of ScrapedProduct objects.
 */
async function scrapeSilpoCategory(categoryUrl: string, categoryName: string): Promise<ScrapedProduct[]> {
  // If the categoryUrl is a relative path, prepend the baseUrl
  let fullCategoryUrl = categoryUrl.startsWith('http') ? categoryUrl : config.baseUrl + categoryUrl;

  // Launch a new headless browser instance with improved options
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--window-size=1920x1080',
      '--lang=uk-UA'
    ]
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const resourceType = req.resourceType();
    if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  const products: ScrapedProduct[] = [];

  try {
    console.log(`[${config.name}] Navigating to category: ${categoryName} (${fullCategoryUrl})`);
    // Navigate to the URL and wait until the DOM is loaded (but not necessarily all JS executed)
    await page.goto(fullCategoryUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // --- CRITICAL STEP: WAIT FOR JAVASCRIPT TO LOAD DYNAMIC CONTENT ---
    // This is the most common point of failure. You must identify a selector
    // that only appears AFTER the product listings are fully loaded by JavaScript.
    try {
      await page.waitForSelector(config.selectors.productCard, { timeout: 20000 });
      console.log(`[${config.name}] Product cards detected. Starting data extraction...`);
    } catch (e) {
      console.warn(`[${config.name}] Timed out waiting for product cards on ${categoryUrl}. Page might be empty or selectors are incorrect.`, e);
      return []; // If products don't load, return an empty array
    }

    // --- Extract Product Data ---
    // `page.evaluate()` executes a function directly in the browser's context.
    // This is efficient because Puppeteer doesn't need to constantly communicate
    // between Node.js and the browser for each element.
    const extractedData = await page.evaluate((selectors, storeName, currentCategoryName) => {
      const scrapedItems: ScrapedProduct[] = []; // Array to hold the extracted products

      // Get all product card elements on the page
      const productCards = Array.from(document.querySelectorAll(selectors.productCard));

      productCards.forEach(card => {
        try {
          // Query selectors *within* the context of the current product card
          const nameElement = card.querySelector(selectors.productName);
          const priceElement = card.querySelector(selectors.currentPrice);
          const oldPriceElement = card.querySelector(selectors.oldPrice);
          const imageElement = card.querySelector(selectors.imageUrl);
          const productLinkElement = card.querySelector(selectors.productLink);

          // Extract text content and attributes with proper type validation
          const name = nameElement?.textContent?.trim() || 'Unknown Product';

          let price = 0;
          if (priceElement) {
            let priceText = priceElement.textContent?.trim() || '';
            // Use the parsePrice function from config for consistent cleaning
            price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.'));
          }

          let oldPrice: number | undefined;
          if (oldPriceElement) {
            let oldPriceText = oldPriceElement.textContent?.trim() || '';
            oldPrice = parseFloat(oldPriceText.replace(/[^\d.,]/g, '').replace(',', '.'));
          }

          const imageUrl = imageElement ? (imageElement as HTMLImageElement).src : undefined;
          const productUrl = productLinkElement ? (productLinkElement as HTMLAnchorElement).href : undefined;

          // Basic validation before adding to results
          if (name !== 'N/A' && !isNaN(price) && price > 0) {
            scrapedItems.push({
              name,
              price,
              oldPrice,
              imageUrl,
              store: storeName, // From config
              category: currentCategoryName, // From function argument
              lastUpdated: new Date(), // Current time of scrape
              productUrl: productUrl || categoryUrl, // Use specific product URL if found, else category URL
            });
          }
        } catch (innerError) {
          console.warn(`[${storeName}] Error processing a product card: ${innerError}`);
          // You might want to log the HTML of the problematic card for debugging
        }
      });
      return scrapedItems;
    }, config.selectors, config.name, categoryName); // Arguments passed to the page.evaluate function

    products.push(...extractedData);

    // --- Pagination Logic (Conceptual) ---
    // This part is highly website-specific. Here's a conceptual example for a "Next Page" button.
    // Many sites use infinite scroll, which requires simulating scrolling down.
    //
    // const nextPageButton = await page.$(config.selectors.nextPageButton);
    // if (nextPageButton) {
    //   console.log(`[${config.name}] Found 'Next Page' button. Clicking...`);
    //   await Promise.all([
    //     nextPageButton.click(),
    //     page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }), // Wait for page navigation
    //     // Or if it's infinite scroll, wait for new products to load after scrolling:
    //     // page.waitForFunction(() => document.querySelectorAll('.product-card').length > initialProductCount)
    //   ]);
    //   console.log(`[${config.name}] Navigated to next page. Recursively scraping...`);
    //   // Recursively call this function to scrape the next page and combine results
    //   const moreProducts = await scrapeSilpoCategory(page.url(), categoryName); // Use the new URL after navigation
    //   products.push(...moreProducts);
    // } else {
    //   console.log(`[${config.name}] No 'Next Page' button found or end of pagination.`);
    // }

    console.log(`[${config.name}] Finished extraction for ${categoryName}. Total products: ${products.length}.`);

  } catch (error) {
    console.error(`[${config.name}] Fatal error during scraping of category ${categoryName}:`, error);
  } finally {
    // Ensure the browser is closed even if an error occurs
    await browser.close();
  }

  return products;
}

export { scrapeSilpoCategory };