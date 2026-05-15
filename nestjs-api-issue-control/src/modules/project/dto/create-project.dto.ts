export class CreateProjectDto { // DTO สำหรับสร้าง project ใหม่
  gitlabProjectId: number;
  pathWithNamespace: string;
  name: string;
  projectType?: string;
  status?: number;
}
