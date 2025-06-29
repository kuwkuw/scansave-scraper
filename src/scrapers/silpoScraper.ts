import puppeteer from 'puppeteer';
import { ScrapedProduct, BASE_URLS, SELECTORS, CATEGORY_URLS } from '../../config';
import { saveProductsToDatabase } from '../db/products';

const baseUrl = BASE_URLS.silpo;
const selectors = SELECTORS.silpo;

function buildCategoryUrl(categoryUrl: string): string {
  return categoryUrl.startsWith('http') ? categoryUrl : baseUrl + categoryUrl;
}

/**
 * Scrapes a specific category page on Silpo's website.
 * @param categoryUrl The URL of the category page to scrape.
 * @param categoryName The name of the category (e.g., "Dairy").
 * @param categoryPath Optional category path for the product URLs.
 * @returns A promise that resolves to an array of ScrapedProduct objects.
 */
async function scrapeSilpoCategory(categoryUrl: string, categoryName: string, categoryPath?: string): Promise<ScrapedProduct[]> {
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
    console.log(`[Silpo] Navigating to category: ${categoryName} (${fullCategoryUrl})`);
    // Navigate to the URL and wait until the DOM is loaded (but not necessarily all JS executed)
    await page.goto(fullCategoryUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // --- CRITICAL STEP: WAIT FOR JAVASCRIPT TO LOAD DYNAMIC CONTENT ---
    // This is the most common point of failure. You must identify a selector
    // that only appears AFTER the product listings are fully loaded by JavaScript.
    try {
      await page.waitForSelector(selectors.productCard, { timeout: 20000 });
      console.log(`[Silpo] Product cards detected. Starting data extraction...`);
    } catch (e) {
      console.warn(`[Silpo] Timed out waiting for product cards on ${categoryUrl}. Page might be empty or selectors are incorrect.`, e);
      return []; // If products don't load, return an empty array
    }

    // --- Extract Product Data ---
    // `page.evaluate()` executes a function directly in the browser's context.
    // This is efficient because Puppeteer doesn't need to constantly communicate
    // between Node.js and the browser for each element.
    const extractedData: ScrapedProduct[] = await page.evaluate((selectors, storeName, currentCategoryName, categoryUrl) => {
      const scrapedItems: ScrapedProduct[] = []; // Array to hold the extracted products

      // Get all product card elements on the page
      const productCards = Array.from(document.querySelectorAll(selectors.productCard));
      console.log(`Found ${productCards.length} product cards on page: ${currentCategoryName}`);
      if (productCards.length > 0) {
        // Log the outer HTML of the first product card for debugging
        console.log('First product card HTML:', productCards[0].outerHTML);
      }

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
            price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.'));
          }

          let oldPrice: number | undefined;
          if (oldPriceElement) {
            let oldPriceText = oldPriceElement.textContent?.trim() || '';
            oldPrice = parseFloat(oldPriceText.replace(/[^\d.,]/g, '').replace(',', '.'));
          }

          const imageUrl = imageElement ? imageElement.src : undefined;
          const productUrl = productLinkElement ? productLinkElement.href : '';

          // Log extracted values for debugging
          console.log({ name, price, oldPrice, imageUrl, productUrl });

          // Basic validation before adding to results
          if (name !== 'N/A' && !isNaN(price) && price > 0) {
            const product: ScrapedProduct = {
              name,
              price,
              oldPrice,
              imageUrl,
              store: storeName,
              category: currentCategoryName,
              lastUpdated: new Date().toISOString(),
              productUrl,
              categoryUrl: categoryUrl,
            };

            scrapedItems.push(product);
          }
        } catch (innerError) {
          console.warn(`[Silpo] Error processing a product card: ${innerError}`);
        }
      });
      return scrapedItems;
    }, selectors, 'Silpo', categoryName, categoryPath ? categoryPath : categoryUrl); // Arguments passed to the page.evaluate function

    // Ensure lastUpdated is a string (ISO) for ScrapedProduct compatibility
    products.push(...extractedData.map(product => ({
      ...product,
      lastUpdated: typeof product.lastUpdated === 'string' ? product.lastUpdated : new Date(product.lastUpdated).toISOString(),
    })));

    console.log(`[Silpo] Finished extraction for ${categoryName}. Total products: ${products.length}.`);

  } catch (error) {
    console.error(`[Silpo] Fatal error during scraping of category ${categoryName}:`, error);
  } finally {
    // Ensure the browser is closed even if an error occurs
    await browser.close();
  }

  return products;
}

export { scrapeSilpoCategory };