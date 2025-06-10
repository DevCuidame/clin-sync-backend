import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.model';
import { Role } from './role.model';

@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn('increment')
  user_role_id!: number;

  @Column()
  user_id!: number;

  @Column()
  role_id!: number;

  @CreateDateColumn()
  assigned_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  expires_at?: Date;

  @Column({ default: true })
  is_active!: boolean;

  // Relaciones
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Role, role => role.userRoles)
  @JoinColumn({ name: 'role_id' })
  role!: Role;
}