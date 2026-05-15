import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, ManyToOne, JoinColumn, ManyToMany } from 'typeorm';
import { Product } from '../product/product.entity';
import { Users } from '../users/users.entity';
import { Labels } from '../labels/labels.entity';

@Entity('project')
export class Project {
  @PrimaryGeneratedColumn({ type: 'int' })
  public id: number;

  @Column({
    name: 'gitlab_project_id',
    type: 'int',
    unique: true,
    nullable: true,
  })
  public gitlabProjectId: number;

  @Column({
    name: 'path_with_namespace',
    type: 'varchar',
    length: 255,
  })
  public pathWithNamespace: string;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 255,
  })
  public name: string;

  @Column({
    name: 'project_type',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  public projectType: string;

  @Column({
    name: 'status',
    type: 'int',
    nullable: true,
  })
  public status: number;

  @Column({
    name: 'user_id',
    type: 'int',
  })
  public userId: number;

  @Column({
    name: 'created_by',
    type: 'int',
    nullable: true,
  })
  public createdBy: number;

  @Column({
    name: 'updated_by',
    type: 'int',
    nullable: true,
  })
  public updatedBy: number;

  @Column({
    name: 'delete_by',
    type: 'int',
    nullable: true,
  })
  public deleteBy: number;

  @Column({
    name: 'created_at',
    type: 'datetime',
  })
  public createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'datetime',
  })
  public updatedAt: Date;

  @Column({
    name: 'delete_at',  // ใช้ delete_at แทน deleted_at
    type: 'datetime',
    nullable: true,
  })
  public deletedAt: Date;

  // เพิ่ม relation กลับ Product
  @OneToMany(() => Product, product => product.project, { cascade: true })
  public products: Product[];

  // relation  Users
  @ManyToOne(() => Users, user => user.id)
  @JoinColumn({ name: 'user_id' })
  public user: Users;

}
