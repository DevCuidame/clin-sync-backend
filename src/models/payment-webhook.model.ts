import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PaymentTransaction } from './payment-transaction.model';

export enum WebhookStatus {
  RECEIVED = 'received',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed'
}

@Entity('payment_webhooks')
export class PaymentWebhook {
  @PrimaryGeneratedColumn('increment')
  webhook_id!: number;

  @Column()
  transaction_id!: number;

  @Column({ length: 100 })
  provider!: string;

  @Column({ length: 100 })
  event_type!: string;

  @Column({ type: 'json' })
  payload!: any;

  @Column({
    type: 'enum',
    enum: WebhookStatus,
    default: WebhookStatus.RECEIVED
  })
  status!: WebhookStatus;

  @Column({ length: 500, nullable: true })
  signature?: string;

  @CreateDateColumn()
  received_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  processed_at?: Date;

  @Column({ type: 'text', nullable: true })
  error_message?: string;

  // Relaciones
  @ManyToOne(() => PaymentTransaction)
  @JoinColumn({ name: 'transaction_id' })
  transaction!: PaymentTransaction;
}