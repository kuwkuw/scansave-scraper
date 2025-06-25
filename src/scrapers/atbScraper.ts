import puppeteer from 'puppeteer';
import { ScrapedProduct, SELECTORS, CATEGORY_URLS } from '../../config';
import { saveProductsToDatabase } from '../db/products';

const baseUrl = 'https://www.atbmarket.com';
const selectors = SELECTORS.atb;

function buildCategoryUrl(categoryUrl: string): string {
  return categoryUrl.startsWith('http') ? categoryUrl : baseUrl + categoryUrl;
}

/**
 * Scrapes a specific category page on ATB's website.
 * @param categoryUrl The URL of the category page to scrape.
 * @param categoryName The name of the category (e.g., "Dairy").
 * @param categoryPath Optional category path for the product categoryUrl.
 * @returns A promise that resolves to an array of ScrapedProduct objects.
 */
export async function scrapeAtbCategory(categoryUrl: string, categoryName: string, categoryPath?: string): Promise<ScrapedProduct[]> {
  const fullCategoryUrl = buildCategoryUrl(categoryUrl);

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
    console.log(`[ATB] Navigating to category: ${categoryName} (${fullCategoryUrl})`);
    await page.goto(fullCategoryUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    try {
      await page.waitForSelector(selectors.productCard, { timeout: 20000 });
      console.log(`[ATB] Product cards detected. Starting data extraction...`);
    } catch (e) {
      console.warn(`[ATB] Timed out waiting for product cards on ${categoryUrl}. Page might be empty or selectors are incorrect.`, e);
      return [];
    }

    const extractedData: ScrapedProduct[] = await page.evaluate((selectors, storeName, currentCategoryName, categoryUrl) => {
      const scrapedItems: ScrapedProduct[] = [];
      const productCards = Array.from(document.querySelectorAll(selectors.productCard));
      productCards.forEach(card => {
        try {
          const nameElement = card.querySelector(selectors.productName);
          const priceElement = card.querySelector(selectors.currentPrice);
          const imageElement = card.querySelector(selectors.imageUrl) as HTMLImageElement | null;
          const productLinkElement = card.querySelector(selectors.productLink) as HTMLAnchorElement | null;

          const name = nameElement?.textContent?.trim() || 'Unknown Product';
          let price = 0;
          if (priceElement) {
            let priceText = priceElement.textContent?.trim() || '';
            price = parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.'));
          }
          const imageUrl = imageElement ? imageElement.src : undefined;
          const productUrl = productLinkElement ? productLinkElement.href : '';

          if (name !== 'N/A' && !isNaN(price) && price > 0) {
            const product: ScrapedProduct = {
              name,
              price,
              store: storeName,
              category: currentCategoryName,
              lastUpdated: new Date().toISOString(),
              productUrl,
              imageUrl,
              categoryUrl: categoryUrl,
            };
            scrapedItems.push(product);
          }
        } catch (innerError) {
          console.warn(`[ATB] Error processing a product card: ${innerError}`);
        }
      });
      return scrapedItems;
    }, selectors, 'ATB', categoryName, categoryPath ? categoryPath : categoryUrl);

    products.push(...extractedData.map(product => ({
      ...product,
      lastUpdated: typeof product.lastUpdated === 'string' ? product.lastUpdated : new Date(product.lastUpdated).toISOString(),
    })));

    console.log(`[ATB] Finished extraction for ${categoryName}. Total products: ${products.length}.`);

  } catch (error) {
    console.error(`[ATB] Fatal error during scraping of category ${categoryName}:`, error);
  } finally {
    await browser.close();
  }

  return products;
} 