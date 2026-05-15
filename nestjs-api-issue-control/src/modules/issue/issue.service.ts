import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Repository } from 'typeorm';
import { Issue } from './issue.entity';
import { Product } from '../product/product.entity';
import { Project } from '../project/project.entity';
import { Labels } from '../labels/labels.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { GitlabService } from '../../service/git/git.service';
import { ProjectService } from '../project/project.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class IssueService extends TypeOrmCrudService<Issue> {
  private readonly logger = new Logger(IssueService.name);

  constructor(
    @InjectRepository(Issue)
    private issueRepository: Repository<Issue>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Labels)
    private readonly labelsRepository: Repository<Labels>,
    private readonly gitlabService: GitlabService,
    private readonly projectService: ProjectService,
    private readonly usersService: UsersService,
  ) {
    super(issueRepository);
  }

  // Private Helpers
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

  // แปลงวันที่เป็น string หรือ null
  private normalizeDateValue(value: any): string | null {
    return value ? String(value) : null;
  }

  // แปลงวินาที GitLab → นาที
  private mapGitlabSecondsToMinutes(seconds?: number): number {
    return Math.max(0, Math.round((Number(seconds) || 0) / 60));
  }

  // ดึง gitlabProjectId จาก issue (ผ่าน project โดยตรง หรือผ่าน product.project)
  private getIssueProjectGitlabId(issue: Issue): number {
    return issue.project?.gitlabProjectId || issue.product?.project?.gitlabProjectId;
  }

  // หา project จาก userId (fallback)
  private async getProjectByUserId(userId: number): Promise<Project> {
    return new Promise(async (resolve, reject) => {
      try {
        const accessibleProjects = await this.projectService.getAccessibleProjectsForUser(userId);
        const project = accessibleProjects.find((item) =>
          Number(item?.status) === 1 &&
          String(item?.projectType || '').toLowerCase() === 'issue',
        ) || accessibleProjects.find((item) =>
          String(item?.projectType || '').toLowerCase() === 'issue',
        ) || accessibleProjects.find((item) =>
          String(item?.name || '').toLowerCase().includes('issue') ||
          String(item?.pathWithNamespace || '').toLowerCase().includes('issue'),
        ) || accessibleProjects.find((item) =>
          !String(item?.name || '').toLowerCase().includes('product') &&
          !String(item?.pathWithNamespace || '').toLowerCase().includes('product'),
        ) || accessibleProjects[0];

        if (!project) return reject(new NotFoundException(`No project found for user ${userId}`));
        resolve(project);
      } catch (error) { reject(error); }
    });
  }

  // ตรวจสิทธิ์การเข้าถึง issue จาก membership ของ project
  private async assertUserCanAccessIssue(issueId: number, userId: number, withDeleted = true): Promise<Issue> {
    return new Promise(async (resolve, reject) => {
      try {
        const issue = await this.findOne({
          where: { id: issueId },
          relations: ['project', 'product', 'product.project'],
          withDeleted,
        });
        if (!issue) return reject(new NotFoundException(`Issue #${issueId} not found`));

        const projectId = Number(issue.projectId || issue.product?.projectId);
        if (!projectId) return reject(new BadRequestException('Issue นี้ไม่มี project reference'));

        await this.projectService.assertUserCanAccessProject(projectId, userId);
        resolve(issue);
      } catch (error) {
        reject(error);
      }
    });
  }

  // ดึง issues ที่ user มีสิทธิ์เห็นตาม GitLab membership
  async getVisibleIssues(userId: number): Promise<Issue[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const projects = await this.projectService.getAccessibleProjectsForUser(userId);
        const projectIds = projects.map((project) => Number(project.id)).filter((id) => Number.isFinite(id));
        if (!projectIds.length) return resolve([]);

        resolve(await this.issueRepository.find({
          where: projectIds.map((projectId) => ({ projectId })),
          relations: ['project', 'product', 'product.project'],
          order: { createdAt: 'DESC' },
        }));
      } catch (error) {
        reject(error);
      }
    });
  }

  // ดึง issue เดียวพร้อมตรวจสิทธิ์
  async getVisibleIssueById(issueId: number, userId: number): Promise<Issue> {
    return this.assertUserCanAccessIssue(issueId, userId, true);
  }

  // ดึง issues ตาม project ที่ระบุ พร้อมตรวจสิทธิ์
  async getVisibleIssuesByProject(projectId: number, userId: number): Promise<Issue[]> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.projectService.assertUserCanAccessProject(projectId, userId);
        resolve(await this.issueRepository.find({
          where: { projectId },
          relations: ['project', 'product', 'product.project'],
          order: { createdAt: 'DESC' },
        }));
      } catch (error) {
        reject(error);
      }
    });
  }

  // หา project จาก gitlabProjectId
  private async getProjectByGitlabId(gitlabProjectId: number): Promise<Project> {
    return new Promise(async (resolve, reject) => {
      try {
        const project = await this.projectRepository.findOne({ where: { gitlabProjectId, deletedAt: null } });
        if (!project) return reject(new NotFoundException(`Project with gitlabProjectId ${gitlabProjectId} not found`));
        resolve(project);
      } catch (error) { reject(error); }
    });
  }

  // resolve project เพราะ issue อยู่คนละ project กับ product
  private async resolveIssueProject(
    dto: { issueProjectId?: number; gitlabProjectId?: number },
    userId: number,
  ): Promise<Project> {
    return new Promise(async (resolve, reject) => {
      try {
        const activeProject = await this.projectService.getAccessibleProjectByContext(userId, {
          projectType: 'issue',
          status: 1,
        });

        const isActiveIssueProject = (project?: Project | null) =>
          !!project && Number(project.status) === 1 && String(project.projectType || '').toLowerCase() === 'issue';

        // 1. ใช้ gitlabProjectId ที่ส่งมาตรงๆ (เช่น 81507067)
        if (dto.gitlabProjectId) {
          const project = await this.getProjectByGitlabId(dto.gitlabProjectId);
          await this.projectService.assertUserCanAccessProject(Number(project.id), userId);
          if (isActiveIssueProject(project)) return resolve(project);
          if (activeProject) return resolve(activeProject);
          return resolve(project);
        }
        // 2. ใช้ system project id ของ issue project (เช่น id=11)
        if (dto.issueProjectId) {
          const project = await this.projectService.assertUserCanAccessProject(dto.issueProjectId, userId);
          if (isActiveIssueProject(project)) return resolve(project);
          if (activeProject) return resolve(activeProject);
          if (project) return resolve(project);
        }
        if (activeProject) return resolve(activeProject);
        // 3. fallback: หา project ที่ชื่อ include 'issue' และไม่ใช่ product project
        const allProjects = await this.projectService.getAccessibleProjectsForUser(userId);
        const issueProject = allProjects.find(p =>
          Number(p?.status) === 1 && String(p.projectType || '').toLowerCase() === 'issue'
        ) || allProjects.find(p =>
          String(p.projectType || '').toLowerCase() === 'issue'
        ) || allProjects.find(p =>
          (p.name || '').toLowerCase().includes('issue') ||
          (p.pathWithNamespace || '').toLowerCase().includes('issue')
        ) || allProjects.find(p =>
          !(p.name || '').toLowerCase().includes('product') &&
          !(p.pathWithNamespace || '').toLowerCase().includes('product')
        ) || allProjects[0];
        if (!issueProject) return reject(new NotFoundException(`No project found for user ${userId}`));
        resolve(issueProject);
      } catch (error) { reject(error); }
    });
  }

  // ดึง product พร้อม project relation
  private async getProduct(productId: number, userId: number): Promise<Product> {
    return new Promise(async (resolve, reject) => {
      try {
        const product = await this.productRepository.findOne({
          where: { id: productId },
          relations: ['project'],
          withDeleted: true,
        });
        if (!product) return reject(new NotFoundException(`Product #${productId} not found`));
        if (product.projectId) {
          await this.projectService.assertUserCanAccessProject(Number(product.projectId), userId);
        }
        resolve(product);
      } catch (error) { reject(error); }
    });
  }

  // สร้าง issue บน GitLab issue project บันทึก issue ลง DB ด้วย projectId ของ issue project
  // ถ้ามี productId cross-project link บน GitLab (product project issue project)
  async createIssue(dto: CreateIssueDto, userId: number): Promise<Issue> {
    return new Promise(async (resolve, reject) => {
      try {
        const {
          productId,
          projectId,       // = issueProjectId (system id ของ issue project)
          gitlabProjectId, // = gitlabProjectId ของ issue project
          ...rest
        } = dto;

        const normalizedStartDate = this.normalizeDateValue(rest.startDate);
        const normalizedDueDate   = this.normalizeDateValue(rest.dueDate);

        //1. resolve issue project (ไม่ fallback ไปใช้ product project) ──
        const issueProject = await this.resolveIssueProject(
          { gitlabProjectId, issueProjectId: projectId },
          userId,
        );
        if (!issueProject?.gitlabProjectId) {
          return reject(new NotFoundException('ไม่พบ Issue project สำหรับสร้าง issue'));
        }

        const accessToken = await this.getValidToken(userId);
        const title       = rest.title || rest.name || 'Untitled Issue';

        await this.ensureGitlabLabels(issueProject.gitlabProjectId, rest.labels, accessToken);

        //2. สร้าง issue บน GitLab issue project ──
        const gitlabIssue = await this.gitlabService.createProjectIssue(
          issueProject.gitlabProjectId,
          {
            title,
            description:      rest.description      || '',
            labels:           rest.labels           || [],
            assigneeUsername: rest.assigneeUsername,
            startDate:        normalizedStartDate,
            dueDate:          normalizedDueDate,
          },
          accessToken,
        );

        //3. sync milestone
        if (rest.milestone) {
          try {
            const milestones = await this.gitlabService.getProjectMilestones(issueProject.gitlabProjectId, accessToken);
            if (!milestones.find(m => m.title === rest.milestone)) {
              const opts: any = { description: `Milestone for issue: ${title}` };
              if (normalizedStartDate && normalizedDueDate && new Date(normalizedDueDate) > new Date(normalizedStartDate)) {
                opts.startDate = normalizedStartDate; opts.dueDate = normalizedDueDate;
              } else if (normalizedDueDate) { opts.dueDate = normalizedDueDate; }
              await this.gitlabService.createMilestone(issueProject.gitlabProjectId, rest.milestone, accessToken, opts);
            }
            await this.gitlabService.updateProjectIssue(issueProject.gitlabProjectId, gitlabIssue.iid, { milestone: rest.milestone }, accessToken);
          } catch (error) {
            this.logger.error(`Failed to sync milestone: ${error.message}`);
          }
        }

        //4. sync time 
        let timeEstimate = Number(rest.timeEstimate) || 0;
        let timeSpent    = Number(rest.timeSpent)    || 0;
        if (timeEstimate > 0) {
          const stats  = await this.gitlabService.setIssueTimeEstimate(issueProject.gitlabProjectId, gitlabIssue.iid, timeEstimate, accessToken);
          timeEstimate = this.mapGitlabSecondsToMinutes(stats?.time_estimate);
        }
        if (timeSpent > 0) {
          const stats = await this.gitlabService.setIssueSpentTime(issueProject.gitlabProjectId, gitlabIssue.iid, timeSpent, accessToken);
          timeSpent   = this.mapGitlabSecondsToMinutes(stats?.total_time_spent);
        }

        // 5. บันทึก issue ลง DB
        // projectId ของ issue = issueProject.id (ไม่ใช่ product's project)
        const issue = this.issueRepository.create({
          ...rest,
          startDate:        normalizedStartDate,
          dueDate:          normalizedDueDate,
          timeEstimate,
          timeSpent,
          productId,                      // FK ไปหา product (อาจ null)
          projectId:        issueProject.id, // FK ไปหา issue project (ไม่ใช่ product project)
          title,
          gitlabIssueId:    gitlabIssue.id,
          gitlabIid:        gitlabIssue.iid,
          webUrl:           gitlabIssue.web_url,
          state:            gitlabIssue.state,
          authorName:       gitlabIssue.author?.name,
          authorUsername:   gitlabIssue.author?.username,
          assigneeName:     gitlabIssue?.assignee?.name     || gitlabIssue?.assignees?.[0]?.name     || null,
          assigneeUsername: gitlabIssue?.assignee?.username || gitlabIssue?.assignees?.[0]?.username || rest.assigneeUsername || null,
          createdBy:        userId,
          updatedBy:        userId,
        });
        const savedIssue = await this.issueRepository.save(issue);

        //6. cross-project link บน GitLab (ถ้ามี productId)
        // Product อยู่ใน product project (gitlabProjectId A)
        // Issue  อยู่ใน issue  project (gitlabProjectId B)
        // POST /projects/A/issues/productIid/links { target_project_id: B, target_issue_iid: issueIid }
        if (productId) {
          try {
            const product               = await this.getProduct(productId, userId);
            const productProjectGitlabId = Number(product.project?.gitlabProjectId);
            const issueProjectGitlabId   = Number(issueProject.gitlabProjectId);
            const productIid             = Number(product.gitlabIid);
            const issueIid2              = Number(savedIssue.gitlabIid);

            if (productIid && issueIid2 && productProjectGitlabId) {
              await this.gitlabService.createIssueLink(
                productProjectGitlabId,  // source project = product project (A)
                productIid,              // source iid = product iid
                issueIid2,               // target iid = issue iid
                accessToken,
                // ถ้าต่าง project ส่ง target_project_id ด้วย
                issueProjectGitlabId !== productProjectGitlabId ? issueProjectGitlabId : undefined,
              );
              // บันทึก parent metadata ลง DB
              await this.issueRepository.update(savedIssue.id, {
                parentId:    product.gitlabIssueId,
                parentIid:   product.gitlabIid,
                parentTitle: product.name,
              });
            }
          } catch (linkError) {
            // link ไม่สำเร็จ log แต่ไม่ fail การสร้าง issue
            this.logger.error(`Failed to link issue to product on GitLab: ${linkError.message}`);
          }
        }

        resolve(savedIssue);
      } catch (error) { reject(error); }
    });
  }

  // Update Issue
  async updateIssue(id: number, dto: UpdateIssueDto, userId: number): Promise<Issue> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ดึง issue เดิมพร้อม project และ product
        const existing = await this.assertUserCanAccessIssue(id, userId, true);
        const projectGitlabId = this.getIssueProjectGitlabId(existing);
        if (!projectGitlabId) return reject(new BadRequestException('Issue นี้ไม่มี GitLab project reference'));

        // 2. ดึง access token + normalize วันที่
        const accessToken         = await this.getValidToken(userId);
        const normalizedStartDate = dto.startDate !== undefined ? this.normalizeDateValue(dto.startDate) : undefined;
        const normalizedDueDate   = dto.dueDate   !== undefined ? this.normalizeDateValue(dto.dueDate)   : undefined;

        await this.ensureGitlabLabels(projectGitlabId, dto.labels ?? existing.labels, accessToken);

        // 3. หา gitlabIid (lookup จาก GitLab ถ้ายังไม่มีใน DB)
        let issueIid = existing.gitlabIid;
        if (!issueIid && existing.gitlabIssueId) {
          const issues  = await this.gitlabService.getProjectIssues(projectGitlabId, accessToken);
          const matched = issues.find((i: any) => i.id === existing.gitlabIssueId);
          if (matched?.iid) { issueIid = matched.iid; await this.issueRepository.update(id, { gitlabIid: issueIid }); }
        }
        if (!issueIid) return reject(new BadRequestException('Issue นี้ไม่มี gitlabIid'));

        // 4. อัปเดต issue บน GitLab
        const gitlabIssue = await this.gitlabService.updateProjectIssue(
          projectGitlabId, issueIid,
          {
            title:            dto.title ?? dto.name ?? existing.title ?? existing.name,
            description:      dto.description      ?? existing.description,
            labels:           dto.labels           ?? existing.labels,
            assigneeUsername: dto.assigneeUsername !== undefined ? dto.assigneeUsername : existing.assigneeUsername,
            state:            dto.state            !== undefined ? dto.state            : existing.state,
            milestone:        dto.milestone        !== undefined ? dto.milestone        : existing.milestone,
            startDate:        normalizedStartDate,
            dueDate:          normalizedDueDate,
          },
          accessToken,
        );

        // 5. sync time estimate / time spent
        let syncedTimeEstimate = dto.timeEstimate !== undefined ? Number(dto.timeEstimate) || 0 : existing.timeEstimate;
        let syncedTimeSpent    = dto.timeSpent    !== undefined ? Number(dto.timeSpent)    || 0 : existing.timeSpent;
        if (dto.timeEstimate !== undefined) {
          const stats = await this.gitlabService.setIssueTimeEstimate(projectGitlabId, issueIid, syncedTimeEstimate, accessToken);
          syncedTimeEstimate = this.mapGitlabSecondsToMinutes(stats?.time_estimate);
        }
        if (dto.timeSpent !== undefined) {
          const stats = await this.gitlabService.setIssueSpentTime(projectGitlabId, issueIid, syncedTimeSpent, accessToken);
          syncedTimeSpent = this.mapGitlabSecondsToMinutes(stats?.total_time_spent);
        }

        // 6. บันทึกค่าที่ sync กลับมาจาก GitLab ลง DB
        await this.issueRepository.update(id, {
          ...dto,
          state:            gitlabIssue?.state ?? dto.state ?? existing.state,
          webUrl:           gitlabIssue?.web_url ?? existing.webUrl,
          assigneeName:     gitlabIssue?.assignee?.name ?? gitlabIssue?.assignees?.[0]?.name ?? null,
          assigneeUsername: gitlabIssue?.assignee?.username ?? gitlabIssue?.assignees?.[0]?.username ?? (dto.assigneeUsername !== undefined ? dto.assigneeUsername : existing.assigneeUsername),
          timeEstimate:     syncedTimeEstimate,
          timeSpent:        syncedTimeSpent,
          updatedBy:        userId,
          closedAt:         (gitlabIssue?.state ?? dto.state) === 'closed' ? new Date() : null,
        });
        resolve(await this.findOne({ where: { id }, relations: ['project', 'product', 'product.project'], withDeleted: true }));
      } catch (error) { reject(error); }
    });
  }

  // Soft Delete Issue
  async softDeleteIssue(id: number, userId: number): Promise<{ message: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ดึง issue เดิมพร้อม project และ product
        const existing = await this.assertUserCanAccessIssue(id, userId, false);
        const projectGitlabId = this.getIssueProjectGitlabId(existing);

        // 2. พยายามปิด issue บน GitLab (ไม่ fail ถ้า GitLab error)
        if (existing.gitlabIid && projectGitlabId) {
          try {
            const accessToken = await this.getValidToken(userId);
            await this.gitlabService.closeIssue(projectGitlabId, existing.gitlabIid, accessToken);
          } catch (error) { this.logger.warn(`Failed to close GitLab issue ${id}: ${error.message}`); }
        }

        // 3. mark closed ใน DB
        await this.issueRepository.update(id, { deleteBy: userId, state: 'closed', closedAt: new Date() });
        resolve({ message: `Issue #${id} deleted successfully` });
      } catch (error) { reject(error); }
    });
  }

  // Restore Issue
  async restoreIssue(id: number, userId: number): Promise<Issue> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ดึง issue ที่ถูก soft delete พร้อม relation
        const existing = await this.assertUserCanAccessIssue(id, userId, true);
        const projectGitlabId = this.getIssueProjectGitlabId(existing);

        // 2. พยายาม reopen issue บน GitLab (ไม่ fail ถ้า GitLab error)
        if (existing.gitlabIid && projectGitlabId) {
          try {
            const accessToken = await this.getValidToken(userId);
            await this.gitlabService.reopenIssue(projectGitlabId, existing.gitlabIid, accessToken);
          } catch (error) { this.logger.warn(`Failed to reopen GitLab issue ${id}: ${error.message}`); }
        }

        // 3. mark opened ใน DB
        await this.issueRepository.update(id, { deleteBy: null, updatedBy: userId, state: 'opened', closedAt: null });
        resolve(await this.findOne({ where: { id }, relations: ['project', 'product', 'product.project'], withDeleted: true }));
      } catch (error) { reject(error); }
    });
  }

  // Link Issue Product
  async linkIssueToProduct(issueId: number, productId: number, userId: number): Promise<Issue> {
    return new Promise(async (resolve, reject) => {
      try {
        const [issue, product] = await Promise.all([
          this.assertUserCanAccessIssue(issueId, userId, true),
          this.getProduct(productId, userId),
        ]);

        const productProjectGitlabId = Number(product.project?.gitlabProjectId);
        const issueProjectGitlabId   = Number(issue.project?.gitlabProjectId);
        const productIid             = Number(product.gitlabIid);
        const issueGitlabIid         = Number(issue.gitlabIid);

        if (!productProjectGitlabId) return reject(new BadRequestException('Product ไม่มี GitLab project reference'));
        if (!productIid || !issueGitlabIid) return reject(new BadRequestException('Product หรือ Issue ยังไม่มี gitlabIid'));

        const accessToken = await this.getValidToken(userId);

        // ลบ link เดิมก่อน (ถ้ามี)
        if (issue.productId && issue.productId !== productId && issue.product?.gitlabIid) {
          try {
            const oldProductProjectId = Number(issue.product.project?.gitlabProjectId || productProjectGitlabId);
            const oldProductIid       = Number(issue.product.gitlabIid);
            const links   = await this.gitlabService.getIssueLinks(oldProductProjectId, oldProductIid, accessToken);
            const oldLink = (links || []).find((l: any) => {
              const tIid = Number(l?.target_issue?.iid ?? l?.iid ?? l?.target_issue_iid);
              return tIid === issueGitlabIid;
            });
            if (oldLink?.issue_link_id || oldLink?.id) {
              await this.gitlabService.deleteIssueLink(oldProductProjectId, oldProductIid, oldLink.issue_link_id || oldLink.id, accessToken);
            }
          } catch (e) { this.logger.warn(`Failed to remove old link: ${e.message}`); }
        }

        // สร้าง cross-project link: source=product, target=issue
        await this.gitlabService.createIssueLink(
          productProjectGitlabId,
          productIid,
          issueGitlabIid,
          accessToken,
          issueProjectGitlabId !== productProjectGitlabId ? issueProjectGitlabId : undefined,
        );

        await this.issueRepository.update(issueId, {
          productId:   product.id,
          projectId:   issue.projectId || product.projectId,
          parentId:    product.gitlabIssueId,
          parentIid:   product.gitlabIid,
          parentTitle: product.name,
          updatedBy:   userId,
        });
        resolve(await this.issueRepository.findOne({ where: { id: issueId }, relations: ['project', 'product'], withDeleted: true }));
      } catch (error) { reject(error); }
    });
  }

  // Unlink Issue ↔ Product
  // ลบ link จาก product side (source) ซึ่งเป็นที่ที่ GitLab เก็บ link record
  async unlinkIssueFromProduct(issueId: number, userId: number): Promise<Issue> {
    return new Promise(async (resolve, reject) => {
      try {
        const issue = await this.assertUserCanAccessIssue(issueId, userId, true);
        if (!issue.productId || !issue.product) return reject(new BadRequestException('Issue ยังไม่ได้เชื่อมกับ product'));

        const productProjectGitlabId = Number(issue.product.project?.gitlabProjectId);
        const productIid             = Number(issue.product.gitlabIid);
        const issueGitlabIid         = Number(issue.gitlabIid);

        if (!productProjectGitlabId || !productIid || !issueGitlabIid) {
          return reject(new BadRequestException('ไม่มีข้อมูล GitLab เพียงพอสำหรับยกเลิก link'));
        }

        const accessToken = await this.getValidToken(userId);

        // ดึง links จาก product side (source) แล้วหา target ที่เป็น issue iid
        try {
          const links = await this.gitlabService.getIssueLinks(productProjectGitlabId, productIid, accessToken);
          const matched = (links || []).find((l: any) => {
            const tIid = Number(l?.target_issue?.iid ?? l?.iid ?? l?.target_issue_iid);
            return tIid === issueGitlabIid;
          });
          if (matched?.issue_link_id || matched?.id) {
            await this.gitlabService.deleteIssueLink(productProjectGitlabId, productIid, matched.issue_link_id || matched.id, accessToken);
          } else {
            this.logger.warn(`Link not found: product iid=${productIid} ↔ issue iid=${issueGitlabIid}`);
          }
        } catch (e) { this.logger.warn(`Failed to delete GitLab link: ${e.message}`); }

        // 4. อัปเดต DB — ล้าง productId + parent metadata
        await this.issueRepository.update(issueId, { productId: null, parentId: null, parentIid: null, parentTitle: null, updatedBy: userId });
        resolve(await this.issueRepository.findOne({ where: { id: issueId }, relations: ['project', 'product'], withDeleted: true }));
      } catch (error) { reject(error); }
    });
  }

  // Queries

  async getIssuesByProduct(productId: number, userId: number): Promise<Issue[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ดึง issue ทั้งหมดที่เชื่อมกับ product และยังไม่ถูกลบ
        const product = await this.getProduct(productId, userId);
        resolve(await this.find({ where: { productId: product.id, deletedAt: null }, relations: ['project', 'product'], order: { createdAt: 'DESC' } }));
      } catch (error) { reject(error); }
    });
  }

  async getLinkableIssuesForProduct(productId: number, userId: number): Promise<Issue[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ตรวจสิทธิ์ product ที่ต้องการ link
        const product = await this.getProduct(productId, userId);

        // 2. หา issue project จาก project_type ก่อน
        const issueProject = await this.projectService.getAccessibleProjectByContext(userId, {
          projectType: 'issue',
          status: 1,
        });

        if (!issueProject?.id) {
          return resolve([]);
        }

        // 3. ดึง issue ที่อยู่ใน issue project และยังไม่มี product
        resolve(await this.find({ where: { projectId: issueProject.id, productId: null, deletedAt: null }, relations: ['project', 'product'], order: { createdAt: 'DESC' } }));
      } catch (error) { reject(error); }
    });
  }

  // Get Milestones
  async getMilestones(issueId: number, userId: number): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ดึง issue พร้อม project/product relation
        const issue = await this.assertUserCanAccessIssue(issueId, userId, true);
        const project = issue.project || issue.product?.project;
        if (!project?.gitlabProjectId) return reject(new BadRequestException('Issue นี้ไม่มี GitLab project reference'));

        // 2. ดึง valid token
        const accessToken = await this.getValidToken(userId);

        // 3. ดึง milestones จาก GitLab
        resolve(await this.gitlabService.getProjectMilestones(project.gitlabProjectId, accessToken));
      } catch (error) { reject(error); }
    });
  }
}
