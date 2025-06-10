import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Purchase } from './purchase.model';

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('increment')
  transaction_id!: number;

  @Column()
  purchase_id!: number;

  @Column({ length: 100 })
  gateway_provider!: string;

  @Column({ length: 255, nullable: true })
  gateway_transaction_id?: string;

  @Column({ length: 255, nullable: true })
  payment_intent_id?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ length: 3, default: 'USD' })
  currency!: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING
  })
  status!: TransactionStatus;

  @Column({ type: 'json', nullable: true })
  gateway_response?: any;

  @Column({ type: 'json', nullable: true })
  webhook_data?: any;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date;

  // Relaciones
  @ManyToOne(() => Purchase)
  @JoinColumn({ name: 'purchase_id' })
  purchase!: Purchase;
}