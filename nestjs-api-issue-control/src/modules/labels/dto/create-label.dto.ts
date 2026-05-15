import { IsInt, Min, Max, IsOptional, IsString, IsArray } from "class-validator";

export class CreateLabelDto {
  name: string;
  color: string;
  // 0=task_type, 1=project, 2=status, 3=role
  @IsInt()
  @Min(0)
  @Max(3)
  type: number;

  // ใช้เฉพาะ type=1 (project) เช่น "รอเรียกเก็บ"
  @IsOptional()
  @IsString()
  status?: string;

  // GitLab Project IDs สำหรับ sync label ใช้กับ type=0,2,3 → sync ไปทุก id ที่ระบุ เช่น [101, 102]
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  gitlabProjectIds?: number[];
}