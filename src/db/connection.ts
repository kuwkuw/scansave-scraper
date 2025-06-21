import { createConnection, getConnection, Connection, ConnectionOptions } from 'typeorm';
import { Product } from './product.entity';

const connectionOptions: ConnectionOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'root',
  database: process.env.DB_NAME || 'scansave',
  entities: [Product],
  synchronize: false,
};

export async function getOrCreateConnection(): Promise<Connection> {
  try {
    return getConnection();
  } catch (e) {
    return createConnection(connectionOptions);
  }
}
