// Moved from src/api/product.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column('decimal', { nullable: false })
  price!: number;

  @Column('decimal', { nullable: true })
  oldPrice?: number;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ nullable: true })
  store!: string;

  @Column({ nullable: true })
  category!: string;

  @Column({ type: 'timestamp', nullable: false })
  lastUpdated!: Date;

  @Column({ name: 'product_url', nullable: false })
  productUrl!: string;
}
