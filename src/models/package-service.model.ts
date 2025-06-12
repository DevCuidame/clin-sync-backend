import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Package } from './package.model';
import { Service } from './service.model';

@Entity('package_services')
export class PackageService {
  @PrimaryGeneratedColumn('increment')
  package_service_id!: number;

  @Column()
  package_id!: number;

  @Column()
  service_id!: number;

  @Column()
  sessions_included!: number;

  @CreateDateColumn()
  created_at!: Date;

  // Relaciones
  @ManyToOne(() => Package, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'package_id' })
  package!: Package;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service!: Service;
}

// Interfaz para crear un nuevo PackageService
export interface CreatePackageServiceDto {
  package_id: number;
  service_id: number;
  sessions_included: number;
}

// Interfaz para actualizar un PackageService
export interface UpdatePackageServiceDto {
  package_id?: number;
  service_id?: number;
  sessions_included?: number;
}

// Interfaz para respuesta con datos relacionados
export interface PackageServiceResponse {
  package_service_id: number;
  package_id: number;
  service_id: number;
  sessions_included: number;
  created_at: Date;
  package?: {
    package_id: number;
    package_name: string;
    description?: string;
    price: number;
    total_sessions: number;
    validity_days: number;
  };
  service?: {
    service_id: number;
    service_name: string;
    description?: string;
    base_price: number;
    duration_minutes: number;
    category: string;
  };
}