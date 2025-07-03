import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Professional } from './professional.model';

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday'
}

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('increment')
  schedule_id!: number;

  @Column()
  professional_id!: number;

  @Column({
    type: 'enum',
    enum: DayOfWeek
  })
  day_of_week!: DayOfWeek;

  @Column({ type: 'time' })
  start_time!: string;

  @Column({ type: 'time' })
  end_time!: string;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ type: 'date', nullable: true })
  valid_from?: Date;

  @Column({ type: 'date', nullable: true })
  valid_until?: Date;

  // Campos para manejo de descansos
  @Column({ default: false })
  has_break!: boolean;

  @Column({ type: 'time', nullable: true })
  break_start_time?: string;

  @Column({ type: 'time', nullable: true })
  break_end_time?: string;

  @Column({ length: 100, nullable: true })
  break_description?: string;

  @CreateDateColumn()
  created_at!: Date;

  // Relaciones
  @ManyToOne(() => Professional)
  @JoinColumn({ name: 'professional_id' })
  professional!: Professional;
}