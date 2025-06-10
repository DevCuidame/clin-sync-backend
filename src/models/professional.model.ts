import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.model';

export enum ProfessionalStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_APPROVAL = 'pending_approval'
}

@Entity('professionals')
export class Professional {
  @PrimaryGeneratedColumn('increment')
  professional_id!: number;

  @Column()
  user_id!: number;

  @Column({ length: 100, unique: true })
  license_number!: string;

  @Column({ length: 200, nullable: true })
  specialization?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourly_rate?: number;

  @Column({ nullable: true })
  experience_years?: number;

  @Column({
    type: 'enum',
    enum: ProfessionalStatus,
    default: ProfessionalStatus.PENDING_APPROVAL
  })
  status!: ProfessionalStatus;

  @Column({ type: 'json', nullable: true })
  availability_config?: any;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relaciones
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}