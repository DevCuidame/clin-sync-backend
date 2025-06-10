import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Professional } from './professional.model';

export enum SlotStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled'
}

@Entity('time_slots')
export class TimeSlot {
  @PrimaryGeneratedColumn('increment')
  slot_id!: number;

  @Column()
  professional_id!: number;

  @Column({ type: 'date' })
  slot_date!: Date;

  @Column({ type: 'time' })
  start_time!: string;

  @Column({ type: 'time' })
  end_time!: string;

  @Column()
  duration_minutes!: number;

  @Column({
    type: 'enum',
    enum: SlotStatus,
    default: SlotStatus.AVAILABLE
  })
  status!: SlotStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price_override?: number;

  @Column({ default: 1 })
  max_bookings!: number;

  @Column({ default: 0 })
  current_bookings!: number;

  @Column({ type: 'json', nullable: true })
  metadata?: any;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relaciones
  @ManyToOne(() => Professional)
  @JoinColumn({ name: 'professional_id' })
  professional!: Professional;
}