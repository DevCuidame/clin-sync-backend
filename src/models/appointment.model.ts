// src/models/appointment.model.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.model';
import { Professional } from './professional.model';
import { Service } from './service.model';

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('increment')
  appointment_id!: number;

  @Column()
  user_id!: number;

  @Column()
  professional_id!: number;

  @Column()
  service_id!: number;

  @Column({ nullable: true })
  user_session_id?: number;

  @Column({ type: 'timestamp' })
  scheduled_at!: Date;

  @Column()
  duration_minutes!: number;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED
  })
  status!: AppointmentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  cancellation_reason?: string;

  @Column({ default: false })
  reminder_sent?: boolean;

  @Column({ nullable: true, length: 255 })
  google_calendar_event_id?: string;


  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
  
}