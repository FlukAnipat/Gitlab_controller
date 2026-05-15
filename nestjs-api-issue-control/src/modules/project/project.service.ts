import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { In, Repository } from 'typeorm';
import { Project } from './project.entity';
import { GitlabService } from '../../service/git/git.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ProjectService extends TypeOrmCrudService<Project> {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private gitlabService: GitlabService,
    private usersService: UsersService,
  ) {
    super(projectRepository);
  }

  // คืนค่า GitLab project IDs ที่ user มีสิทธิ์เข้าถึง
  async getAccessibleGitlabProjectIds(userId: number, accessToken: string): Promise<number[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ดึง repositories จาก GitLab
        const repositories = await this.gitlabService.getUserRepositories(accessToken);
        // 2. แปลงเป็น number[] แล้วกรองค่าที่ valid
        const projectIds = (repositories || [])
          .map((r: any) => Number(r?.id))
          .filter((id: number) => Number.isFinite(id));
        resolve(projectIds);
      } catch (error) {
        reject(new Error(`Failed to get accessible project IDs: ${error.message}`));
      }
    });
  }

  // ดึง system projects ที่ user เป็นสมาชิกใน GitLab project นั้น
  async getAccessibleProjectsForUser(userId: number): Promise<Project[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ดึง valid token ของ user
        const accessToken = await this.usersService.getValidAccessToken(userId);

        // 2. ดึง gitlab project ids ที่ user เข้าถึงได้
        const gitlabProjectIds = await this.getAccessibleGitlabProjectIds(userId, accessToken);
        if (!gitlabProjectIds.length) return resolve([]);

        // 3. map กลับมาเป็น system projects ใน DB
        const projects = await this.projectRepository.find({
          where: {
            gitlabProjectId: In(gitlabProjectIds),
            deletedAt: null,
          },
          order: { id: 'ASC' },
        });

        resolve(projects);
      } catch (error) {
        reject(new Error(`Failed to get accessible projects for user: ${error.message}`));
      }
    });
  }

  // คืนค่า system project ids ที่ user มีสิทธิ์เข้าถึง
  async getAccessibleProjectIdsForUser(userId: number): Promise<number[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const projects = await this.getAccessibleProjectsForUser(userId);
        resolve((projects || []).map((project) => Number(project.id)).filter((id) => Number.isFinite(id)));
      } catch (error) {
        reject(error);
      }
    });
  }

  // หา project ตาม project type + status
  async getAccessibleProjectByContext(
    userId: number,
    params: { projectType?: string; status?: number },
  ): Promise<Project | null> {
    return new Promise(async (resolve, reject) => {
      try {
        const projects = await this.getAccessibleProjectsForUser(userId);
        const normalizedType = String(params.projectType || '').trim().toLowerCase();
        const desiredStatus = params.status;

        const matches = (project: Project) => {
          const sameType = normalizedType ? String(project?.projectType || '').toLowerCase() === normalizedType : true;
          const sameStatus = desiredStatus !== undefined && desiredStatus !== null ? Number(project?.status) === Number(desiredStatus) : true;
          return sameType && sameStatus;
        };

        const project = projects.find(matches)
          || projects.find((item) => {
            const sameType = normalizedType ? String(item?.projectType || '').toLowerCase() === normalizedType : true;
            return sameType;
          })
          || null;

        resolve(project);
      } catch (error) {
        reject(error);
      }
    });
  }

  // ตรวจว่า user เข้าถึง project นี้ได้หรือไม่จาก GitLab membership
  async assertUserCanAccessProject(projectId: number, userId: number): Promise<Project> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. หา project ก่อน
        const project = await this.projectRepository.findOne({
          where: { id: projectId, deletedAt: null },
        });
        if (!project) return reject(new NotFoundException(`Project #${projectId} not found`));

        // 2. ดึงรายชื่อ project ที่ user เข้าถึงได้จาก GitLab
        const accessibleProjectIds = await this.getAccessibleProjectIdsForUser(userId);

        // 3. ถ้า project นี้ไม่อยู่ในชุดที่เข้าถึงได้ ให้ reject
        if (!accessibleProjectIds.includes(Number(project.id))) {
          return reject(new ForbiddenException('You are not a member of this GitLab project'));
        }

        resolve(project);
      } catch (error) {
        reject(error);
      }
    });
  }

  // ดึง milestones ของ project จาก GitLab โดยใช้ system id
  async getMilestones(projectId: number, userId: number): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. หา project จาก system id → ได้ gitlabProjectId จริง
        const project = await this.projectRepository.findOne({ where: { id: projectId } });
        if (!project?.gitlabProjectId) return resolve([]);

        // 2. ดึง valid token (refresh อัตโนมัติถ้า expired)
        const accessToken = await this.usersService.getValidAccessToken(userId);

        // 3. ดึง milestones จาก GitLab
        const milestones = await this.gitlabService.getProjectMilestones(
          project.gitlabProjectId,
          accessToken,
        );
        resolve(milestones);
      } catch (error) {
        reject(new Error(`Failed to get milestones: ${error.message}`));
      }
    });
  }

  // ตรวจสอบไฟล์ว่าเป็นรูปภาพหรือไม่
  private validateImageFile(file: { buffer: Buffer; originalname: string; mimetype: string }): void {
    // 1. ตรวจสอบว่าเป็น image file หรือไม่
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    // 2. ตรวจสอบขนาดไฟล์ (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.buffer && file.buffer.length > maxSize) {
      throw new BadRequestException('File size too large. Maximum size is 10MB');
    }
  }

  // อัปโหลดรูปภาพจาก editor ไป GitLab แล้วคืน { url, markdown }
  async uploadFile(projectId: number, file: { buffer: Buffer; originalname: string; mimetype: string }, userId: number): Promise<{ url: string; markdown: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ตรวจสอบไฟล์ว่าเป็นรูปภาพหรือไม่
        this.validateImageFile(file);

        // 2. หา project จาก system id → ได้ gitlabProjectId จริง
        const project = await this.projectRepository.findOne({ where: { id: projectId } });
        if (!project?.gitlabProjectId) {
          return reject(new BadRequestException('Project not found or no GitLab project'));
        }

        // 3. ดึง valid token จาก DB (refresh อัตโนมัติถ้า expired)
        const accessToken = await this.usersService.getValidAccessToken(userId);

        // 4. upload ไปที่ GitLab → service คืน absolute URL แล้ว
        //    url format: https://gitlab.com/-/project/{gitlabProjectId}/uploads/{hash}/file.png
        const result = await this.gitlabService.uploadProjectFile(
          Number(project.gitlabProjectId),
          { buffer: file.buffer, originalname: file.originalname, mimetype: file.mimetype },
          accessToken,
        );

        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to upload file: ${error.message}`));
      }
    });
  }
}
