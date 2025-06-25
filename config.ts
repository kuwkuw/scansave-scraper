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

// Unified category mapping for all supermarkets
export const CATEGORY_URLS = {
  special_offers: {
    silpo: '/category/spetsialni-propozytsii-5189',
    atb: '/catalog/economy',
  },
  akcija_7dniv: {
    silpo: null,
    atb: '/catalog/388-aktsiya-7-dniv',
  },
  novelties: {
    silpo: null,
    atb: '/catalog/novetly',
  },
  fruits_vegetables: {
    silpo: '/category/frukty-ovochi-4788',
    atb: '/catalog/287-ovochi-ta-frukti',
  },
  meat: {
    silpo: '/category/m-iaso-4411',
    atb: '/catalog/maso',
  },
  fish: {
    silpo: '/category/ryba-4430',
    atb: '/catalog/593-riba',
  },
  sausages_delicacies: {
    silpo: '/category/kovbasni-vyroby-i-m-iasni-delikatesy-4731',
    atb: '/catalog/360-kovbasa-i-m-yasni-delikatesi',
  },
  cheese: {
    silpo: '/category/syry-1468',
    atb: '/catalog/siri',
  },
  bread_bakery: {
    silpo: '/category/khlib-ta-vypichka-5121',
    atb: '/catalog/325-khlibobulochni-virobi',
  },
  ready_meals: {
    silpo: '/category/gotovi-stravy-i-kulinariia-4761',
    atb: '/catalog/502-kulinariya',
  },
  dairy_eggs: {
    silpo: '/category/molochni-produkty-ta-iaitsia-234',
    atb: '/catalog/molocni-produkti-ta-ajca',
  },
  groceries_canned: {
    silpo: '/category/bakaliia-i-konservy-4870',
    atb: '/catalog/285-bakaliya',
  },
  sauces_spices: {
    silpo: '/category/sousy-i-spetsii-4938',
    atb: '/catalog/305-pripravi-ta-marinadi',
  },
  sweets: {
    silpo: '/category/solodoshchi-498',
    atb: '/catalog/299-konditers-ki-virobi',
  },
  snacks_chips: {
    silpo: '/category/sneky-ta-chypsy-5016',
    atb: '/catalog/cipsi-sneki',
  },
  coffee_tea: {
    silpo: '/category/kava-chai-359',
    atb: '/catalog/kava-caj',
  },
  drinks: {
    silpo: '/category/napoi-52',
    atb: '/catalog/307-napoi',
  },
  frozen: {
    silpo: '/category/zamorozhena-produktsiia-264',
    atb: '/catalog/322-zamorozheni-produkti',
  },
  alcohol: {
    silpo: '/category/alkogol-22',
    atb: '/catalog/292-alkogol-i-tyutyun',
  },
  cigarettes_gum: {
    silpo: '/category/sygarety-stiky-zhuiky-4384',
    atb: '/catalog/sigareti',
  },
  flowers_garden: {
    silpo: '/category/kvity-tovary-dlia-sadu-ta-gorodu-476',
    atb: '/catalog/400-sad-ta-gorod',
  },
  home: {
    silpo: '/category/dlia-domu-567',
    atb: '/catalog/358-tovari-dlya-domu',
  },
  hygiene_beauty: {
    silpo: '/category/gigiiena-ta-krasa-4519',
    atb: '/catalog/290-gigiena-i-kosmetika',
  },
  kids: {
    silpo: '/category/dytiachi-tovary-449',
    atb: '/catalog/373-tovari-dlya-ditey',
  },
  pets: {
    silpo: '/category/dlia-tvaryn-653',
    atb: '/catalog/436-tovari-dlya-tvarin',
  },
  // TEMPLATE: Add new categories or supermarkets as needed
  // vegan_products: {
  //   silpo: '/category/vegan-products-9999',
  //   atb: null,
  //   novus: '/catalog/vegan-novus',
  // },
};

// Old SUPERMARKET_CONFIGS is commented out for reference
// export const SUPERMARKET_CONFIGS = { ... } // <-- commented out

// Interface for the structured product data after scraping
export interface ScrapedProduct {
  name: string;
  price: number;
  oldPrice?: number; // Optional, if there's a discount
  imageUrl?: string;
  store: string; // Name of the store (e.g., "Silpo")
  category: string; // Category name (e.g., "Dairy")
  lastUpdated: string; // Use ISO string for serialization compatibility
  productUrl: string; // Direct URL to the product on the store's website
  categoryUrl?: string; // URL of the product's category
}

// Unified selectors mapping for all supermarkets
export const SELECTORS = {
  silpo: {
    productCard: '.products-list__item',
    productName: '.product-card__title',
    currentPrice: '.product-card-price__displayPrice',
    oldPrice: '.product-card-price__displayOldPrice',
    imageUrl: '.product-card__product-img',
    productLink: 'a.product-card',
    nextPageButton: '.pagination__button--next', // Placeholder, verify!
  },
  atb: {
    productCard: 'article.catalog-item',
    productName: '.catalog-item__title a',
    currentPrice: '.product-price__top',
    oldPrice: '.product-price__bottom',
    imageUrl: '.catalog-item__img',
    productLink: '.catalog-item__title a',
    nextPageButton: '.pagination__next', // Placeholder, verify if pagination exists
  },
  // TEMPLATE: Add new supermarkets as needed
  // novus: {
  //   productCard: '...',
  //   productName: '...',
  //   ...
  // },
};

// Unified base URLs for all supermarkets
export const BASE_URLS = {
  silpo: 'https://silpo.ua',
  atb: 'https://www.atbmarket.com',
  // Add more supermarkets as needed
};