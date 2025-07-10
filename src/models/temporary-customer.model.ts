import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.model';
import { Purchase } from './purchase.model';

export enum IdentificationType {
  CC = 'CC', // Cédula de Ciudadanía
  CE = 'CE', // Cédula de Extranjería
  TI = 'TI', // Tarjeta de Identidad
  PP = 'PP', // Pasaporte
  NIT = 'NIT' // Número de Identificación Tributaria
}

@Entity('temporary_customers')
export class TemporaryCustomer {
  @PrimaryGeneratedColumn()
  temp_customer_id!: number;

  @Column({ length: 100 })
  first_name!: string;

  @Column({ length: 100 })
  last_name!: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ length: 255, nullable: true })
  email?: string;

  @Column({ length: 50, nullable: true })
  identification_number?: string;

  @Column({ 
    type: 'enum', 
    enum: IdentificationType, 
    default: IdentificationType.CC 
  })
  identification_type!: IdentificationType;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at!: Date;

  @Column({ nullable: true })
  created_by?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User;

  @OneToMany(() => Purchase, purchase => purchase.temporaryCustomer)
  purchases!: Purchase[];
}