import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Professional } from './professional.model';
import { Service } from './service.model';

@Entity('professional_services')
export class ProfessionalService {
  @PrimaryGeneratedColumn('increment')
  prof_service_id!: number;

  @Column()
  professional_id!: number;

  @Column()
  service_id!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  custom_price?: number;

  @Column({ nullable: true })
  custom_duration?: number;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  // Relaciones
  @ManyToOne(() => Professional)
  @JoinColumn({ name: 'professional_id' })
  professional!: Professional;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'service_id' })
  service!: Service;
}