import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { UserRole } from './user-role.model';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('increment')
  role_id!: number;

  @Column({ length: 100, unique: true })
  role_name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  permissions?: any;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  // Relaciones
  @OneToMany(() => UserRole, userRole => userRole.role)
  userRoles!: UserRole[];
}