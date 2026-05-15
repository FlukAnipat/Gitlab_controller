import { Injectable, NotFoundException, Logger, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { Project } from '../project/project.entity';
import { Labels } from '../labels/labels.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GitlabService } from '../../service/git/git.service';
import { ProjectService } from '../project/project.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ProductService extends TypeOrmCrudService<Product> {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Labels)
    private readonly labelsRepository: Repository<Labels>,
    private readonly gitlabService: GitlabService,
    private readonly projectService: ProjectService,
    private readonly usersService: UsersService,
  ) {
    super(productRepository);
  }

  // Private Helpers
  // แปลงวันที่เป็น string หรือ null
  // คง description เป็น HTML ส่งไป GitLab ตรงๆ
  // GitLab รับ HTML ได้ และ <img src="https://..."> จะไม่ถูก convert path
  private normalizeDescription(html: string): string {
    if (!html) return ''
    return html
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .trim()
  }

  // รองรับ Date | string | null | undefined ครบ
  private normalizeDateValue(value: any): string | null {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString().split('T')[0];
    return String(value);
  }

  // แปลงวินาที GitLab → นาที
  private mapGitlabSecondsToMinutes(seconds?: number): number {
    return Math.max(0, Math.round((Number(seconds) || 0) / 60));
  }

  // ดึง valid token จาก UsersService (refresh อัตโนมัติถ้า expired)
  private async getValidToken(userId: number): Promise<string> {
    return this.usersService.getValidAccessToken(userId);
  }

  // sync labels จาก DB ไป GitLab project ถ้ายังไม่มี เพื่อให้สีตรงกับระบบ
  private async ensureGitlabLabels(projectId: number, labels: any, accessToken: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const labelNames = Array.isArray(labels)
          ? labels.map((label) => String(label).trim()).filter(Boolean)
          : typeof labels === 'string'
          ? labels.split(',').map((label) => label.trim()).filter(Boolean)
          : [];

        if (!labelNames.length) {
          resolve();
          return;
        }

        const gitlabLabels = await this.gitlabService.getProjectLabels(projectId, accessToken);
        const existingNames = new Set((gitlabLabels || []).map((label) => String(label?.name || '').trim().toLowerCase()));
        const dbLabels = await this.labelsRepository.find();
        const dbLabelMap = new Map(
          (dbLabels || []).map((label) => [String(label?.name || '').trim().toLowerCase(), label.color || '#9E9E9E']),
        );

        for (const labelName of labelNames) {
          const normalized = String(labelName || '').trim().toLowerCase();
          if (!normalized) continue;
          const color = dbLabelMap.get(normalized) || '#9E9E9E';
          await this.gitlabService.updateLabelInGitlab(
            accessToken,
            projectId,
            labelName,
            labelName,
            color,
          );
          existingNames.add(normalized);
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  // หา project จาก gitlabProjectId
  private async getProjectByGitlabId(gitlabProjectId: number): Promise<Project> {
    return new Promise(async (resolve, reject) => {
      try {
        const project = await this.projectRepository.findOne({
          where: { gitlabProjectId, deletedAt: null },
        });
        if (!project) return reject(new HttpException(
          `Project with gitlabProjectId ${gitlabProjectId} not found`,
          HttpStatus.NOT_FOUND,
        ));
        resolve(project);
      } catch (error) {
        reject(error);
      }
    });
  }

  // หา project จาก userId (fallback กรณีไม่ส่ง projectId มา)
  private async getProjectByUserId(userId: number): Promise<Project> {
    return new Promise(async (resolve, reject) => {
      try {
        const accessibleProjects = await this.projectService.getAccessibleProjectsForUser(userId);
        const project = accessibleProjects.find((item) =>
          Number(item?.status) === 1 &&
          String(item?.projectType || '').toLowerCase() === 'product',
        ) || accessibleProjects.find((item) =>
          String(item?.projectType || '').toLowerCase() === 'product',
        ) || accessibleProjects.find((item) =>
          String(item?.name || '').toLowerCase().includes('product') ||
          String(item?.pathWithNamespace || '').toLowerCase().includes('product'),
        ) || accessibleProjects[0];

        if (!project) return reject(new NotFoundException(`No accessible project found for user ${userId}`));
        resolve(project);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async getProjectByLabelContext(userId: number): Promise<Project | null> {
    return this.projectService.getAccessibleProjectByContext(userId, {
      projectType: 'product',
      status: 1,
    });
  }

  private isActiveProductProject(project?: Project | null): boolean {
    return !!project && Number(project.status) === 1 && String(project.projectType || '').toLowerCase() === 'product';
  }

  // ตรวจสิทธิ์การเข้าถึง product จาก membership ของ project
  private async assertUserCanAccessProduct(productId: number, userId: number, withDeleted = true): Promise<Product> {
    return new Promise(async (resolve, reject) => {
      try {
        const product = await this.findOne({
          where: { id: productId },
          relations: ['project'],
          withDeleted,
        });
        if (!product) return reject(new NotFoundException(`Product #${productId} not found`));
        if (!product.projectId) return reject(new BadRequestException('Product นี้ไม่มี project reference'));

        await this.projectService.assertUserCanAccessProject(Number(product.projectId), userId);
        resolve(product);
      } catch (error) {
        reject(error);
      }
    });
  }

  // ดึง products ที่ user มีสิทธิ์เห็นตาม GitLab membership
  async getVisibleProducts(userId: number): Promise<Product[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const projects = await this.projectService.getAccessibleProjectsForUser(userId);
        const projectIds = projects.map((project) => Number(project.id)).filter((id) => Number.isFinite(id));
        if (!projectIds.length) return resolve([]);

        resolve(await this.productRepository.find({
          where: projectIds.map((projectId) => ({ projectId })),
          relations: ['project'],
          order: { createdAt: 'DESC' },
        }));
      } catch (error) {
        reject(error);
      }
    });
  }

  // ดึง product เดียวพร้อมตรวจสิทธิ์
  async getVisibleProductById(productId: number, userId: number): Promise<Product> {
    return this.assertUserCanAccessProduct(productId, userId, true);
  }

  // resolve project จาก dto — ลำดับ: gitlabProjectId → projectId → userId fallback
  private async resolveProject(
    dto: { projectId?: number; gitlabProjectId?: number },
    userId: number,
  ): Promise<Project> {
    return new Promise(async (resolve, reject) => {
      try {
        const activeProject = await this.getProjectByLabelContext(userId);

        if (dto.gitlabProjectId) {
          const project = await this.getProjectByGitlabId(dto.gitlabProjectId);
          await this.projectService.assertUserCanAccessProject(Number(project.id), userId);
          if (this.isActiveProductProject(project)) return resolve(project);
          if (activeProject) return resolve(activeProject);
          return resolve(project);
        }
        if (dto.projectId) {
          const project = await this.projectService.assertUserCanAccessProject(dto.projectId, userId);
          if (this.isActiveProductProject(project)) return resolve(project);
          if (activeProject) return resolve(activeProject);
          if (project) return resolve(project);
        }
        if (activeProject) return resolve(activeProject);
        resolve(await this.getProjectByUserId(userId));
      } catch (error) {
        reject(error);
      }
    });
  }

  // Create Product
  async createProduct(dto: CreateProductDto, userId: number): Promise<Product> {
    return new Promise(async (resolve, reject) => {
      try {
        const { projectId, gitlabProjectId, ...rest } = dto;

        // 1. หา project ที่จะสร้าง issue ใน GitLab
        const project = await this.resolveProject({ projectId, gitlabProjectId }, userId);
        if (!project) return reject(new NotFoundException('Project not found'));

        // 2. normalize วันที่ + ดึง access token
        const normalizedStartDate = this.normalizeDateValue(rest.startDate);
        const normalizedDueDate   = this.normalizeDateValue(rest.dueDate);
        const accessToken         = await this.getValidToken(userId);

        // 3. sync labels เข้า GitLab project ก่อน create เพื่อให้ได้สีจาก DB
        await this.ensureGitlabLabels(project.gitlabProjectId, rest.labels, accessToken);

        // 4. สร้าง issue บน GitLab
        const gitlabIssue = await this.gitlabService.createProjectIssue(
          project.gitlabProjectId,
          {
            title: rest.name,
            description: rest.description,
            labels: rest.labels,
            assigneeUsername: rest.assigneeUsername,
            startDate: normalizedStartDate,
            dueDate: normalizedDueDate,
          },
          accessToken,
        );

        // 5. sync time estimate / time spent (ถ้ามี)
        let timeEstimate = Number(rest.timeEstimate) || 0;
        let timeSpent    = Number(rest.timeSpent)    || 0;
        if (timeEstimate > 0) {
          const stats = await this.gitlabService.setIssueTimeEstimate(project.gitlabProjectId, gitlabIssue.iid, timeEstimate, accessToken);
          timeEstimate = this.mapGitlabSecondsToMinutes(stats?.time_estimate);
        }
        if (timeSpent > 0) {
          const stats = await this.gitlabService.setIssueSpentTime(project.gitlabProjectId, gitlabIssue.iid, timeSpent, accessToken);
          timeSpent = this.mapGitlabSecondsToMinutes(stats?.total_time_spent);
        }

        // 6. บันทึก product ลง DB พร้อม GitLab metadata
        const product = this.productRepository.create({
          name: rest.name,
          description: rest.description,
          issueType: rest.issueType,
          confidential: rest.confidential,
          milestone: rest.milestone,
          labels: rest.labels,
          weight: rest.weight,
          startDate: normalizedStartDate,
          dueDate: normalizedDueDate,
          timeEstimate,
          timeSpent,
          projectId: project.id,
          gitlabIssueId: gitlabIssue.id,
          gitlabIid: gitlabIssue.iid,
          webUrl: gitlabIssue.web_url,
          state: gitlabIssue.state,
          authorName: gitlabIssue.author?.name,
          authorUsername: gitlabIssue.author?.username,
          assigneeName: gitlabIssue?.assignee?.name     ?? gitlabIssue?.assignees?.[0]?.name     ?? null,
          assigneeUsername: gitlabIssue?.assignee?.username ?? gitlabIssue?.assignees?.[0]?.username ?? rest.assigneeUsername ?? null,
          createdBy: userId,
          updatedBy: userId,
        });
        resolve(await this.productRepository.save(product));
      } catch (error) {
        reject(error);
      }
    });
  }

  // Update Product
  async updateProduct(id: number, dto: UpdateProductDto, userId: number): Promise<Product> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ดึง product เดิมพร้อม project
        const existing = await this.findOne({ where: { id }, relations: ['project'], withDeleted: true });
        await this.assertUserCanAccessProduct(id, userId, true);
        if (!existing.project?.gitlabProjectId) return reject(new BadRequestException('Product นี้ไม่มี GitLab project reference'));

        // 2. normalize วันที่ + ดึง access token
        const normalizedStartDate = dto.startDate !== undefined ? this.normalizeDateValue(dto.startDate) : undefined;
        const normalizedDueDate   = dto.dueDate   !== undefined ? this.normalizeDateValue(dto.dueDate)   : undefined;
        const accessToken         = await this.getValidToken(userId);

        await this.ensureGitlabLabels(existing.project.gitlabProjectId, dto.labels ?? existing.labels, accessToken);

        // 3. หา gitlabIid (lookup จาก GitLab ถ้ายังไม่มีใน DB)
        let issueIid = existing.gitlabIid;
        if (!issueIid && existing.gitlabIssueId) {
          const issues  = await this.gitlabService.getProjectIssues(existing.project.gitlabProjectId, accessToken);
          const matched = issues.find((i: any) => i.id === existing.gitlabIssueId);
          if (matched?.iid) {
            issueIid = matched.iid;
            await this.productRepository.update(id, { gitlabIid: issueIid });
          }
        }
        if (!issueIid) return reject(new BadRequestException('Product นี้ไม่มี gitlabIid'));

        // 4. อัปเดต issue บน GitLab
        // แปลง description: HTML (Quill) → markdown ก่อนส่ง GitLab
        const rawDesc = dto.description ?? existing.description ?? ''
        const description = this.normalizeDescription(rawDesc)
        const gitlabIssue = await this.gitlabService.updateProjectIssue(
          existing.project.gitlabProjectId, issueIid,
          {
            title: dto.name ?? existing.name,
            description: description,
            labels: dto.labels ?? existing.labels,
            assigneeUsername: dto.assigneeUsername !== undefined ? dto.assigneeUsername : existing.assigneeUsername,
            state: dto.state !== undefined ? dto.state : existing.state,
            milestone: dto.milestone !== undefined ? dto.milestone : existing.milestone,
            startDate: normalizedStartDate,
            dueDate: normalizedDueDate,
          },
          accessToken,
        );

        // 5. sync time estimate / time spent
        let syncedTimeEstimate = dto.timeEstimate !== undefined ? Number(dto.timeEstimate) || 0 : existing.timeEstimate;
        let syncedTimeSpent    = dto.timeSpent    !== undefined ? Number(dto.timeSpent)    || 0 : existing.timeSpent;
        if (dto.timeEstimate !== undefined) {
          const stats = await this.gitlabService.setIssueTimeEstimate(existing.project.gitlabProjectId, issueIid, syncedTimeEstimate, accessToken);
          syncedTimeEstimate = this.mapGitlabSecondsToMinutes(stats?.time_estimate);
        }
        if (dto.timeSpent !== undefined) {
          const stats = await this.gitlabService.setIssueSpentTime(existing.project.gitlabProjectId, issueIid, syncedTimeSpent, accessToken);
          syncedTimeSpent = this.mapGitlabSecondsToMinutes(stats?.total_time_spent);
        }

        // 6. บันทึกค่าที่ sync กลับมาจาก GitLab ลง DB
        const updateData: any = {
          ...dto,
          timeEstimate: syncedTimeEstimate,
          timeSpent: syncedTimeSpent,
          state: gitlabIssue?.state ?? dto.state ?? existing.state,
          webUrl: gitlabIssue?.web_url ?? existing.webUrl,
          assigneeName: gitlabIssue?.assignee?.name ?? gitlabIssue?.assignees?.[0]?.name ?? null,
          assigneeUsername: gitlabIssue?.assignee?.username ?? gitlabIssue?.assignees?.[0]?.username ?? (dto.assigneeUsername !== undefined ? dto.assigneeUsername : existing.assigneeUsername),
          updatedBy: userId,
          closedAt: (gitlabIssue?.state ?? dto.state) === 'closed' ? new Date() : null,
        };
        if (dto.startDate !== undefined) updateData.startDate = normalizedStartDate;
        if (dto.dueDate   !== undefined) updateData.dueDate   = normalizedDueDate;

        await this.productRepository.update(id, updateData);
        resolve(await this.productRepository.findOne({ where: { id }, relations: ['project'], withDeleted: true }));
      } catch (error) {
        reject(error);
      }
    });
  }

  // Soft Delete Product
  async softDeleteProduct(id: number, userId: number): Promise<{ message: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ดึง product เดิม
        const existing = await this.assertUserCanAccessProduct(id, userId, false);

        // 2. พยายามปิด issue บน GitLab (ไม่ fail ถ้า GitLab error)
        if (existing.gitlabIid && existing.project?.gitlabProjectId) {
          try {
            const accessToken = await this.getValidToken(userId);
            await this.gitlabService.updateProjectIssue(existing.project.gitlabProjectId, existing.gitlabIid, { state: 'closed' }, accessToken);
          } catch (error) {
            this.logger.warn(`Failed to close GitLab issue for product ${id}: ${error.message}`);
          }
        }

        // 3. mark closed ใน DB
        await this.productRepository.update(id, { deleteBy: userId, state: 'closed', closedAt: new Date() });
        resolve({ message: `Product #${id} deleted successfully` });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Restore Product
  async restoreProduct(id: number, userId: number): Promise<Product> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ดึง product ที่ถูก soft delete
        const existing = await this.assertUserCanAccessProduct(id, userId, true);

        // 2. พยายาม reopen issue บน GitLab (ไม่ fail ถ้า GitLab error)
        if (existing.gitlabIid && existing.project?.gitlabProjectId) {
          try {
            const accessToken = await this.getValidToken(userId);
            await this.gitlabService.updateProjectIssue(existing.project.gitlabProjectId, existing.gitlabIid, { state: 'opened' }, accessToken);
          } catch (error) {
            this.logger.warn(`Failed to reopen GitLab issue for product ${id}: ${error.message}`);
          }
        }

        // 3. mark opened ใน DB
        await this.productRepository.update(id, { deleteBy: null, updatedBy: userId, state: 'opened', closedAt: null });
        resolve(await this.productRepository.findOne({ where: { id }, relations: ['project'], withDeleted: true }));
      } catch (error) { reject(error); }
    });
  }

  // ── Clone Product ─────────────────────────────────────────────────────────

  // ดึง label names ที่เป็น type=2 (status) จาก DB แล้วกรองออกจาก labels ที่ clone
  private async stripStatusLabels(labels: any): Promise<string[]> {
    const labelArr: string[] = Array.isArray(labels)
      ? labels.map(String).filter(Boolean)
      : typeof labels === 'string'
      ? labels.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    if (!labelArr.length) return [];
    try {
      const statusLabels = await this.productRepository.manager
        .getRepository('labels')
        .find({ where: { type: 2 } }) as any[];
      const statusNames = new Set(statusLabels.map((l: any) => l.name));
      return labelArr.filter(name => !statusNames.has(name));
    } catch {
      return labelArr;
    }
  }

  async cloneProduct(productId: number, prefix: string, count: number, userId: number, issueService: any): Promise<Product[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const source = await this.productRepository.findOne({
          where: { id: productId },
          relations: ['project'],
        });
        if (!source) return reject(new NotFoundException(`Product #${productId} not found`));
        await this.projectService.assertUserCanAccessProject(Number(source.projectId), userId);

        // คำนวณ labels ที่ตัด status ออกแล้ว สำหรับ product
        const productLabels = await this.stripStatusLabels(source.labels);

        const created: Product[] = [];
        for (let i = 1; i <= count; i++) {
          const newName = prefix || source.name;

          // clone product — ไม่เอา status labels, startDate, dueDate และไม่ clone issue link
          const newProduct = await this.createProduct(
            {
              name:             newName,
              description:      source.description,
              issueType:        source.issueType,
              labels:           productLabels,
              assigneeUsername: source.assigneeUsername,
              milestone:        source.milestone,
              startDate:        null,
              dueDate:          null,
              timeEstimate:     source.timeEstimate,
              timeSpent:        source.timeSpent,
              projectId:        source.projectId,
            } as any,
            userId,
          );

          created.push(newProduct);
        }

        resolve(created);
      } catch (error) { reject(error); }
    });
  }

  // ── Get Milestones ────────────────────────────────────────────────────────

  async getMilestones(productId: number, userId: number): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. หา product พร้อม project
        const product = await this.assertUserCanAccessProduct(productId, userId, true);
        if (!product?.project?.gitlabProjectId) return reject(new BadRequestException('Product นี้ไม่มี GitLab project reference'));

        // 2. ดึง valid token
        const accessToken = await this.getValidToken(userId);

        // 3. ดึง milestones จาก GitLab
        resolve(await this.gitlabService.getProjectMilestones(product.project.gitlabProjectId, accessToken));
      } catch (error) {
        reject(error);
      }
    });
  }
}
