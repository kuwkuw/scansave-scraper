// backend/config.ts
// This file holds the configurations (URLs, CSS Selectors) for each supermarket.
// You MUST update the 'selectors' with actual values from the websites!

export interface SupermarketConfig {
  name: string;
  baseUrl: string;
  categories: {
    [key: string]: string;
  };
  selectors: {
    productCard: string;
    productName: string;
    currentPrice: string;
    oldPrice?: string;
    imageUrl: string;
    productLink: string;
    nextPageButton?: string;
  };
  parsePrice: (text: string) => number;
}

export const SUPERMARKET_CONFIGS = {
  silpo: {
    name: 'Silpo',
    baseUrl: 'https://silpo.ua',
    categories: {
      special_offers: '/category/spetsialni-propozytsii-5189',
      fruits_vegetables: '/category/frukty-ovochi-4788',
      meat: '/category/m-iaso-4411',
      fish: '/category/ryba-4430',
      sausages_delicacies: '/category/kovbasni-vyroby-i-m-iasni-delikatesy-4731',
      cheese: '/category/syry-1468',
      bread_bakery: '/category/khlib-ta-vypichka-5121',
      ready_meals: '/category/gotovi-stravy-i-kulinariia-4761',
      dairy_eggs: '/category/molochni-produkty-ta-iaitsia-234',
      private_labels: '/category/vlasni-marky-5202',
      lavka_tradytsii: '/category/lavka-tradytsii-4487',
      healthy_food: '/category/zdorove-kharchuvannia-4864',
      groceries_canned: '/category/bakaliia-i-konservy-4870',
      sauces_spices: '/category/sousy-i-spetsii-4938',
      sweets: '/category/solodoshchi-498',
      snacks_chips: '/category/sneky-ta-chypsy-5016',
      coffee_tea: '/category/kava-chai-359',
      drinks: '/category/napoi-52',
      frozen: '/category/zamorozhena-produktsiia-264',
      alcohol: '/category/alkogol-22',
      cigarettes_gum: '/category/sygarety-stiky-zhuiky-4384',
      flowers_garden: '/category/kvity-tovary-dlia-sadu-ta-gorodu-476',
      home: '/category/dlia-domu-567',
      hygiene_beauty: '/category/gigiiena-ta-krasa-4519',
      kids: '/category/dytiachi-tovary-449',
      pets: '/category/dlia-tvaryn-653',
    },
    selectors: {
      // Selector for a single product card/container
      productCard: '.products-list__item',
      // Product name inside the card
      productName: '.product-card__title',
      // Current price
      currentPrice: '.product-card-price__displayPrice',
      // Old price (optional)
      oldPrice: '.product-card-price__displayOldPrice',
      // Product image
      imageUrl: '.product-card__product-img',
      // Product link (the card itself is a link)
      productLink: 'a.product-card',
      
      // Pagination or "load more" button selectors (if applicable)
      // Example: <button class="pagination__next">Next</button>
      nextPageButton: '.pagination__button--next', // This is a placeholder, verify!
    },
    // Function to parse the price text, if it needs specific cleaning
    parsePrice: (priceText: string): number => {
      // Basic cleaning: remove non-numeric characters (except commas/periods)
      // and replace comma with period for consistent float parsing.
      const cleanedText = priceText.replace(/[^\d.,]/g, '').replace(',', '.');
      return parseFloat(cleanedText);
    }
  },
  // --- Add configurations for other supermarkets as you implement their scrapers ---
  atb: {
    name: 'ATB',
    baseUrl: 'https://www.atbmarket.com',
    // --- IMPORTANT: Update these URLs with actual category URLs from ATB.ua ---
    categories: {
      dairy: 'https://www.atbmarket.com/catalog/produkty/molochni-produkti-syr-yaytsya', // Verify this URL!
    },
    selectors: {
      // --- IMPORTANT: Update these CSS Selectors by inspecting ATB.ua's HTML ---
      productCard: '.product-item', // Example, verify!
      productName: '.product-item__title', // Example, verify!
      currentPrice: '.product-item__price-current', // Example, verify!
      imageUrl: '.product-item__image img', // Example, verify!
      productLink: '.product-item__link', // Example, verify!
      nextPageButton: '.pager__next', // Example, verify!
    },
    parsePrice: (priceText: string): number => {
      const cleanedText = priceText.replace(/[^\d.,]/g, '').replace(',', '.');
      return parseFloat(cleanedText);
    }
  }
};

// Interface for the structured product data after scraping
export interface ScrapedProduct {
  name: string;
  price: number;
  oldPrice?: number; // Optional, if there's a discount
  imageUrl?: string;
  store: string; // Name of the store (e.g., "Silpo")
  category: string; // Category name (e.g., "Dairy")
  lastUpdated: Date;
  productUrl: string; // Direct URL to the product on the store's website
}