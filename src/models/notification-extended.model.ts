import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.model';
import { Notification } from './notification.model';

export enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read'
}

export enum DeliveryChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app'
}

export enum QueueStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

export enum PreferenceType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app'
}

@Entity('notification_delivery_logs')
export class NotificationDeliveryLog {
  @PrimaryGeneratedColumn('increment')
  log_id!: number;

  @Column()
  notification_id!: number;

  @Column({
    type: 'enum',
    enum: DeliveryChannel
  })
  channel!: DeliveryChannel;

  @Column({
    type: 'enum',
    enum: DeliveryStatus
  })
  status!: DeliveryStatus;

  @Column({ type: 'text', nullable: true })
  error_message?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: any;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relaciones
  @ManyToOne(() => Notification)
  @JoinColumn({ name: 'notification_id' })
  notification!: Notification;
}

@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryGeneratedColumn('increment')
  preference_id!: number;

  @Column()
  user_id!: number;

  @Column({
    type: 'enum',
    enum: PreferenceType
  })
  type!: PreferenceType;

  @Column({ default: true })
  enabled!: boolean;

  @Column({ type: 'json', nullable: true })
  settings?: any;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relaciones
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

@Entity('notification_queue')
export class NotificationQueue {
  @PrimaryGeneratedColumn('increment')
  queue_id!: number;

  @Column()
  notification_id!: number;

  @Column({
    type: 'enum',
    enum: DeliveryChannel
  })
  channel!: DeliveryChannel;

  @Column({
    type: 'enum',
    enum: QueueStatus,
    default: QueueStatus.PENDING
  })
  status!: QueueStatus;

  @Column({ type: 'timestamp', nullable: true })
  scheduled_for?: Date;

  @Column({ default: 0 })
  retry_count!: number;

  @Column({ default: 3 })
  max_retries!: number;

  @Column({ type: 'text', nullable: true })
  error_message?: string;

  @Column({ type: 'json', nullable: true })
  payload?: any;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relaciones
  @ManyToOne(() => Notification)
  @JoinColumn({ name: 'notification_id' })
  notification!: Notification;
}

@Entity('notification_templates')
export class NotificationTemplate {
  @PrimaryGeneratedColumn('increment')
  template_id!: number;

  @Column({ length: 100, unique: true })
  name!: string;

  @Column({ length: 255 })
  subject!: string;

  @Column('text')
  body!: string;

  @Column({ type: 'json', nullable: true })
  variables?: string[];

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}