import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.model';
import { Package } from './package.model';
import { PaymentTransaction } from './payment-transaction.model';
import { UserSession } from './user-session.model';
import { Service } from './service.model';
import { TemporaryCustomer } from './temporary-customer.model';

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

  // Hacer package_id opcional
  @Column({ nullable: true })
  package_id?: number;

  // Agregar service_id opcional
  @Column({ nullable: true })
  service_id?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount_paid!: number;

  // Agregar campo para tipo de compra
  @Column({
    type: 'enum',
    enum: ['package', 'service'],
    default: 'package'
  })
  purchase_type!: 'package' | 'service';

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

  @Column({ length: 255, nullable: true })
  reference?: string;

  @CreateDateColumn()
  purchase_date!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

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

  @OneToMany(() => PaymentTransaction, paymentTransaction => paymentTransaction.purchase)
  payment_transactions!: PaymentTransaction[];

  @OneToMany(() => UserSession, userSession => userSession.purchase)
  userSessions!: UserSession[];

  // Relación opcional con Service
  @ManyToOne(() => Service, { nullable: true })
  @JoinColumn({ name: 'service_id' })
  service?: Service;
  
  @Column({ nullable: true })
  temp_customer_id?: number;
  
  @ManyToOne(() => TemporaryCustomer, { nullable: true })
  @JoinColumn({ name: 'temp_customer_id' })
  temporaryCustomer?: TemporaryCustomer;
}