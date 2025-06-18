import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Purchase } from './purchase.model';
import { Service } from './service.model';
import { Appointment } from './appointment.model';

export enum UserSessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  EXHAUSTED = 'exhausted',
  CANCELLED = 'cancelled'
}

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('increment')
  user_session_id!: number;

  @Column()
  purchase_id!: number;

  @Column()
  service_id!: number;

  @Column()
  sessions_remaining!: number;

  @Column({ type: 'timestamp' })
  expires_at!: Date;

  @Column({
    type: 'enum',
    enum: UserSessionStatus,
    default: UserSessionStatus.ACTIVE
  })
  status!: UserSessionStatus;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relaciones
  @ManyToOne(() => Purchase, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_id' })
  purchase!: Purchase;

  @ManyToOne(() => Service, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'service_id' })
  service!: Service;

  @OneToMany(() => Appointment, appointment => appointment.user_session)
  appointments!: Appointment[];
}