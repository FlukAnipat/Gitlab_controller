import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from '../product/product.entity';
import { Project } from '../project/project.entity';

@Entity('issue')
@Index(['productId', 'gitlabIid'], { unique: true })
export class Issue {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  public id: number;

  @Column({ name: 'project_id', type: 'int', nullable: true })
  public projectId: number;

  @Column({ name: 'product_id', type: 'int', nullable: true })
  public productId: number;

  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  public product: Product;

  @ManyToOne(() => Project, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'project_id', referencedColumnName: 'id' })
  public project: Project;

  @Column({ name: 'gitlab_issue_id', type: 'int', nullable: true })
  public gitlabIssueId: number;

  @Column({ name: 'gitlab_iid', type: 'int', nullable: true })
  public gitlabIid: number;

  @Column({ name: 'name', type: 'varchar', length: 500 })
  public name: string;

  @Column({ name: 'title', type: 'varchar', length: 500 })
  public title: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  public description: string;

  @Column({ name: 'issue_type', type: 'varchar', length: 50, default: 'issue' })
  public issueType: string;

  @Column({ name: 'state', type: 'varchar', length: 50, nullable: true })
  public state: string;

  @Column({ name: 'web_url', type: 'text', nullable: true })
  public webUrl: string;

  @Column({ name: 'confidential', type: 'boolean', default: false })
  public confidential: boolean;

  @Column({ name: 'locked', type: 'boolean', default: false })
  public locked: boolean;

  @Column({ name: 'milestone', type: 'varchar', length: 255, nullable: true })
  public milestone: string;

  @Column({ name: 'labels', type: 'simple-array', nullable: true })
  public labels: string[];

  @Column({ name: 'author_name', type: 'varchar', length: 255, nullable: true })
  public authorName: string;

  @Column({ name: 'author_username', type: 'varchar', length: 255, nullable: true })
  public authorUsername: string;

  @Column({ name: 'assignee_name', type: 'varchar', length: 255, nullable: true })
  public assigneeName: string;

  @Column({ name: 'assignee_username', type: 'varchar', length: 255, nullable: true })
  public assigneeUsername: string;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  public closedAt: Date;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  public dueDate: Date;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  public startDate: Date;

  @Column({ name: 'time_estimate', type: 'int', nullable: true, default: 0 })
  public timeEstimate: number;

  @Column({ name: 'time_spent', type: 'int', nullable: true, default: 0 })
  public timeSpent: number;

  @Column({ name: 'weight', type: 'int', nullable: true })
  public weight: number;

  @Column({ name: 'parent_id', type: 'int', nullable: true })
  public parentId: number;

  @Column({ name: 'parent_iid', type: 'int', nullable: true })
  public parentIid: number;

  @Column({ name: 'parent_title', type: 'varchar', length: 500, nullable: true })
  public parentTitle: string;

  @Column({ name: 'created_at', type: 'datetime' })
  public createdAt: Date;

  @Column({ name: 'updated_at', type: 'datetime' })
  public updatedAt: Date;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  public createdBy: number;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  public updatedBy: number;

  @Column({ name: 'delete_at', type: 'datetime', nullable: true })
  public deletedAt: Date;

  @Column({ name: 'delete_by', type: 'int', nullable: true })
  public deleteBy: number;
}
