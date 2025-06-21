// Moved from src/api/products.ts
import { ScrapedProduct } from "../../config";
import { getRepository } from 'typeorm';
import { Product } from './product.entity';
import { getOrCreateConnection } from './connection';

export async function saveProductsToDatabase(products: ScrapedProduct[]): Promise<void> {
  console.log(`\n--- Directly Saving ${products.length} Products to Database ---`);

  if (products.length === 0) {
    console.log('No products to save.');
    return;
  }

  await getOrCreateConnection();
  const productRepo = getRepository(Product);
  try {
    const productEntities = products.map(p => productRepo.create({
      name: p.name,
      price: p.price,
      oldPrice: p.oldPrice,
      imageUrl: p.imageUrl,
      store: p.store,
      category: p.category,
      lastUpdated: typeof p.lastUpdated === 'string' ? new Date(p.lastUpdated) : p.lastUpdated,
      productUrl: p.productUrl,
    }));
    await productRepo.save(productEntities);
    console.log(`Saved ${productEntities.length} products.`);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error saving products to database:', error.message);
    } else {
      console.error('Unknown error saving products to database:', error);
    }
  }
}
