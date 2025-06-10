import { IsOptional, IsString } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { UserRole } from './user-role.model';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  password_hash!: string;

  @Column({ length: 100 })
  first_name!: string;

  @Column({ length: 100 })
  last_name!: string;

  @Column({ length: 100 })
  identification_type!: string;

  @Column({ length: 80, nullable: true })
  identification_number?: string;

  @Column({ type: 'date', nullable: true })
  birth_date?: Date;

  @Column({ length: 100, nullable: true })
  address?: string;

  @Column({ length: 10, nullable: false })
  @IsOptional()
  @IsString({ message: 'El género debe ser una cadena de texto' })
  gender!: string;

  @Column({ nullable: true })
  city_id?: number;

  @Column({ length: 80 })
  phone!: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE
  })
  status!: UserStatus;

  @Column({ length: 255, nullable: true })
  session_token?: string;

  @Column({ default: false })
  verified!: boolean;

  @Column({ length: 100, nullable: true })
  pubname?: string;

  @Column({ length: 100, nullable: true })
  privname?: string;

  @Column({ type: 'text', nullable: true })
  imagebs64?: string;

  @Column({ length: 255, nullable: true })
  path?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relationships
  @OneToMany(() => UserRole, userRole => userRole.user)
  user_roles!: UserRole[];
}