// This file would handle sending the scraped data to your actual database or backend API.
// For now, it provides a mock function that simply logs the data.

import { ScrapedProduct } from "../../config";
import { createConnection, getConnection, getRepository } from 'typeorm';
import { Product } from './product.entity';

export async function saveProductsToDatabase(products: ScrapedProduct[]): Promise<void> {
  console.log(`\n--- Directly Saving ${products.length} Products to Database ---`);

  if (products.length === 0) {
    console.log('No products to save.');
    return;
  }

  // Try to get existing connection or create a new one
  let connection;
  try {
    connection = getConnection();
  } catch (e) {
    connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'root',
      database: process.env.DB_NAME || 'scansave',
      entities: [Product],
      synchronize: false, // DB schema should already exist
    });
  }

  const productRepo = getRepository(Product);
  try {
    const productEntities = products.map(p => productRepo.create({
      name: p.name,
      price: p.price,
      oldPrice: p.oldPrice,
      imageUrl: p.imageUrl,
      store: p.store,
      category: p.category,
      lastUpdated: p.lastUpdated,
      productUrl: p.productUrl,
    }));
    await productRepo.save(productEntities);
    console.log(`Saved ${productEntities.length} products.`);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error saving products to database:', error.message);
    } else {
      console.error('Error saving products to database:', error);
    }
  }
  console.log('--------------------------------------------------');
}