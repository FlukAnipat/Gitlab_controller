import { 
  IsString, 
  IsOptional, 
  IsNumber, 
  IsBoolean, 
  IsArray, 
  IsDate,
  MaxLength 
} from 'class-validator';

export class CreateProductDto { // DTO สำหรับสร้าง product ใหม่
  // Relations
  @IsOptional()
  @IsNumber()
  projectId?: number;

  @IsNumber()
  @IsOptional()
  gitlabProjectId?: number;

  @IsOptional()
  @IsNumber()
  gitlabIssueId?: number;

  @IsOptional()
  @IsNumber()
  gitlabIid?: number;

  // Basic Info
  @IsString()
  @MaxLength(500)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  issueType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  state?: string;

  // GitLab Properties
  @IsOptional()
  @IsString()
  webUrl?: string;

  @IsOptional()
  @IsBoolean()
  confidential?: boolean;

  @IsOptional()
  @IsBoolean()
  locked?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  milestone?: string;

  @IsOptional()
  @IsArray()
  labels?: string[];

  // User Info
  @IsOptional()
  @IsString()
  @MaxLength(255)
  authorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  authorUsername?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  assigneeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  assigneeUsername?: string;

  // Dates
  @IsOptional()
  @IsDate()
  closedAt?: Date;

  @IsOptional()
  @IsDate()
  dueDate?: Date;

  @IsOptional()
  @IsDate()
  startDate?: Date;

  // Time & Weight
  @IsOptional()
  @IsNumber()
  timeEstimate?: number;

  @IsOptional()
  @IsNumber()
  timeSpent?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  count?: number;
}
