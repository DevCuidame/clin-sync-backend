import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column()
  name!: string;

  // Relaciones
  @OneToMany(() => Township, township => township.department)
  townships!: Township[];
}

@Entity('townships')
export class Township {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column()
  department_id!: number;

  @Column()
  code!: string;

  @Column()
  name!: string;

  // Relaciones
  @ManyToOne(() => Department, department => department.townships)
  @JoinColumn({ name: 'department_id' })
  department!: Department;
}