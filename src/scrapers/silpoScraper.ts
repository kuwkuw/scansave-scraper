import puppeteer from 'puppeteer';
import { SUPERMARKET_CONFIGS, ScrapedProduct } from '../../config';

const config = SUPERMARKET_CONFIGS.silpo;

function buildCategoryUrl(categoryUrl: string): string {
  return categoryUrl.startsWith('http') ? categoryUrl : config.baseUrl + categoryUrl;
}

/**
 * Scrapes a specific category page on Silpo's website.
 * @param categoryUrl The URL of the category page to scrape.
 * @param categoryName The name of the category (e.g., "Dairy").
 * @returns A promise that resolves to an array of ScrapedProduct objects.
 */
async function scrapeSilpoCategory(categoryUrl: string, categoryName: string): Promise<ScrapedProduct[]> {
  const fullCategoryUrl = buildCategoryUrl(categoryUrl);

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
    const extractedData: ScrapedProduct[] = await page.evaluate((selectors, storeName, currentCategoryName) => {
      const scrapedItems: ScrapedProduct[] = []; // Array to hold the extracted products

      // Get all product card elements on the page
      const productCards = Array.from(document.querySelectorAll(selectors.productCard));

      productCards.forEach(card => {
        try {
          // Query selectors *within* the context of the current product card
          const nameElement = card.querySelector(selectors.productName);
          const priceElement = card.querySelector(selectors.currentPrice);
          const oldPriceElement = card.querySelector(selectors.oldPrice);
          const imageElement = card.querySelector(selectors.imageUrl) as HTMLImageElement | null;
          const productLinkElement = card.querySelector(selectors.productLink) as HTMLAnchorElement | null;

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

          const imageUrl = imageElement ? imageElement.src : undefined;
          const productUrl = productLinkElement ? productLinkElement.href : undefined;

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