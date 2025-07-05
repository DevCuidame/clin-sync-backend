import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PackageService } from './package-service.model';

@Entity('packages')
export class Package {
  @PrimaryGeneratedColumn('increment')
  package_id!: number;

  @Column({ length: 200 })
  package_name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column()
  total_sessions!: number;

  @Column()
  validity_days!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount_percentage!: number;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ type: 'json', nullable: true })
  terms_conditions?: any;

  // Nuevo campo para imagen
  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relación con PackageService
  @OneToMany(() => PackageService, packageService => packageService.package)
  packageServices!: PackageService[];
}