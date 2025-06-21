import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column('decimal')
  price!: number;

  @Column('decimal', { nullable: true })
  oldPrice?: number;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column()
  store!: string;

  @Column()
  category!: string;

  @Column('timestamptz')
  lastUpdated!: Date;

  @Column({ name: 'product_url' })
  productUrl!: string;
}
