import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ServiceCategory {
  CONSULTATION = 'consultation',
  THERAPY = 'therapy',
  ASSESSMENT = 'assessment',
  WORKSHOP = 'workshop',
  OTHER = 'other'
}

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('increment')
  service_id!: number;

  @Column({ length: 200 })
  service_name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  base_price!: number;

  @Column()
  duration_minutes!: number;

  @Column({
    type: 'enum',
    enum: ServiceCategory
  })
  category!: ServiceCategory;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ type: 'json', nullable: true })
  metadata?: any;

   @Column({ type: 'varchar', length: 500, nullable: true })
  image_url?: string;


  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}