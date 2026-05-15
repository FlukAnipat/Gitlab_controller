import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn} from 'typeorm';
import { Users } from '../users/users.entity';

@Entity('labels')
export class Labels {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  public name: string;

  @Column({ name: 'color', type: 'varchar', length: 20 })
  public color: string;

  //0 = task_type 1 = project 2 = status 3 = role
  @Column({ name: 'type', type: 'int', default: 0 })
  public type: number;

  //ใช้เฉพาะ type=1 (project) เช่น "รอเรียกเก็บ", "อยู่ระหว่างดำเนินการ"
  @Column({ name: 'status', type: 'varchar', length: 20, nullable: true })
  public status: string;

  @Column({ name: 'created_at', type: 'datetime' })
  public createdAt: Date;

  @Column({ name: 'updated_at', type: 'datetime' })
  public updatedAt: Date;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  public createdBy: number;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  public updatedBy: number;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  public deletedAt: Date;

  @Column({ name: 'deleted_by', type: 'int', nullable: true })
  public deletedBy: number;

  @ManyToOne(() => Users, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  public createdByUser: Users;
}

