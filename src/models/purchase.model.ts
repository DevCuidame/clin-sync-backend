import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.model';
import { Package } from './package.model';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn('increment')
  purchase_id!: number;

  @Column()
  user_id!: number;

  @Column()
  package_id!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount_paid!: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  payment_status!: PaymentStatus;

  @Column({ length: 50, nullable: true })
  payment_method?: string;

  @Column({ length: 255, nullable: true })
  transaction_id?: string;

  @CreateDateColumn()
  purchase_date!: Date;

  @Column({ type: 'timestamp' })
  expires_at!: Date;

  @Column({ type: 'json', nullable: true })
  payment_details?: any;

  // Relaciones
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Package)
  @JoinColumn({ name: 'package_id' })
  package!: Package;
}