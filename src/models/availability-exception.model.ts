import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Professional } from './professional.model';

export enum ExceptionType {
  UNAVAILABLE = 'unavailable',
  AVAILABLE = 'available',
  BREAK = 'break',
  VACATION = 'vacation'
}

@Entity('availability_exceptions')
export class AvailabilityException {
  @PrimaryGeneratedColumn('increment')
  exception_id!: number;

  @Column()
  professional_id!: number;

  @Column({ type: 'date' })
  exception_date!: Date;

  @Column({ type: 'time', nullable: true })
  start_time?: string;

  @Column({ type: 'time', nullable: true })
  end_time?: string;

  @Column({
    type: 'enum',
    enum: ExceptionType
  })
  type!: ExceptionType;

  @Column({ length: 255, nullable: true })
  reason?: string;

  @CreateDateColumn()
  created_at!: Date;

  // Relaciones
  @ManyToOne(() => Professional)
  @JoinColumn({ name: 'professional_id' })
  professional!: Professional;
}