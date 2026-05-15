import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Labels } from './labels.entity';
import { CreateLabelDto } from './dto/create-label.dto';
import { GitlabService } from '../../service/git/git.service';
import { UsersService } from '../users/users.service';
import { Project } from '../project/project.entity';
import { Product } from '../product/product.entity';
import { Issue } from '../issue/issue.entity';
import { CrudRequest } from '@nestjsx/crud';

@Injectable()
export class LabelsService extends TypeOrmCrudService<Labels> {
  private readonly logger = new Logger(LabelsService.name);

  constructor(
    @InjectRepository(Labels)
    repo: Repository<Labels>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,
    private readonly gitlabService: GitlabService,
    private readonly usersService: UsersService,
  ) {
    super(repo);
  }

  // ดึง GitLab project IDs
  private async _getGitlabProjectIds(): Promise<number[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ดึง GitLab project IDs จาก database ที่ยังไม่ถูกลบและมีค่า
        const rows: { gitlab_project_id: string }[] = await this.projectRepo.query(
          'SELECT gitlab_project_id FROM project WHERE delete_at IS NULL AND gitlab_project_id IS NOT NULL'
        );
        
        // 2. แปลง string เป็น number และกรองเฉพาะค่าที่ถูกต้อง
        const ids = rows.map(r => Number(r.gitlab_project_id)).filter(id => !isNaN(id) && id > 0);
        
        // 3. บันทึก log จำนวนและรายการ project IDs ที่พบ
        this.logger.log(`[_getGitlabProjectIds] found ${ids.length}: ${ids.join(', ')}`);
        
        // 4. คืนค่า array ของ project IDs
        resolve(ids);
      } catch (error) {
        // 5. บันทึก log error และคืนค่า empty array
        this.logger.error('Error fetching GitLab project IDs:', error);
        resolve([]);
      }
    });
  }

  // Sync label ไป GitLab
  private async _syncGitlab(
    action: 'create' | 'update' | 'delete',
    accessToken: string,
    gitlabProjectIds: number[],
    payload: { name: string; color?: string; oldName?: string },
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. Early return ถ้าไม่มี project ให้ sync
        if (gitlabProjectIds.length === 0) {
          resolve();
          return;
        }

        // 2. ทำงานแบบ parallel ไปทุก project พร้อมกัน
        await Promise.all(
          gitlabProjectIds.map(async (projectId) => {
            try {
              // 3. ดำเนินการตาม action ที่กำหนด
              if (action === 'create') {
                await this.gitlabService.updateLabelInGitlab(accessToken, projectId, payload.name, payload.name, payload.color);
              } else if (action === 'update') {
                await this.gitlabService.updateLabelInGitlab(accessToken, projectId, payload.oldName, payload.name, payload.color);
              } else if (action === 'delete') {
                await this.gitlabService.deleteLabelInGitlab(accessToken, projectId, payload.name);
              }
              
              // 4. บันทึก log ว่าสำเร็จ
              this.logger.log(`[GitLab:${action}] project ${projectId} OK`);
            } catch (error: any) {
              // 5. จัดการ error ต่อ project ละตัว ไม่ให้กระทบ project อื่น
              if (action === 'create' && error?.response?.status === 409) {
                // กรณี label ซ้ำ (conflict) - ข้ามไปได้เลย
                return;
              }
              // กรณี error อื่นๆ - บันทึกแค่ข้อความ error
              this.logger.error(`[GitLab:${action}] project ${projectId}: ${error?.message}`);
            }
          }),
        );

        // 6. คืนค่าเมื่อทำงานเสร็จสิ้น
        resolve();
      } catch (error) {
        // 7. คืนค่า error ถ้ามีข้อผิดพลาดระดับบนสุด
        reject(error);
      }
    });
  }

  // หาชื่อทุกชื่อที่ label id นี้เคยใช้ (ไม่มี history)
  private async _renameInProductsAndIssues(labelId: number, oldName: string, newName: string): Promise<void> {
    try {
      this.logger.log(`[_rename] START labelId=${labelId} "${oldName}" => "${newName}"`);

      // หาชื่อทุกชื่อที่ label id นี้เคยใช้ไม่ได้เพราะไม่มี history
      // ดึงทุก row ที่มี labels แล้ว scan ใน JS — เป็นวิธีเดียวที่จับชื่อเก่าได้ทุกกรณี
      const [allProducts, allIssues] = await Promise.all([
        this.productRepo.query(`SELECT id, labels FROM product WHERE labels IS NOT NULL AND labels != ''`),
        this.issueRepo.query(`SELECT id, labels FROM issue WHERE labels IS NOT NULL AND labels != ''`),
      ]);

      // parse และ exact match ใน JS — จับได้ทุกชื่อไม่ว่าจะเป็นชื่อเก่าระดับไหน
      const parse = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);

      // ชื่อที่ต้อง replace — oldName และ newName (สำหรับกรณีที่เคย sync แล้วครึ่งหนึ่ง)
      const targets = new Set([oldName, newName].filter(Boolean));

      const products = allProducts.filter((p: any) => parse(p.labels).some(l => targets.has(l)));
      const issues   = allIssues.filter((i: any) => parse(i.labels).some(l => targets.has(l)));

      this.logger.log(`[_rename] found: products=${products.length} issues=${issues.length}`);

      const renameInArray = (s: string): string =>
        parse(s).map(l => targets.has(l) ? newName : l).join(',');

      await Promise.all([
        ...products.map((p: any) =>
          this.productRepo.query(`UPDATE product SET labels = ? WHERE id = ?`, [renameInArray(p.labels), p.id])
        ),
        ...issues.map((i: any) =>
          this.issueRepo.query(`UPDATE issue SET labels = ? WHERE id = ?`, [renameInArray(i.labels), i.id])
        ),
      ]);

      this.logger.log(`[_rename] DONE product=${products.length} issue=${issues.length}`);
    } catch (error) {
      this.logger.error(`[_rename] FAILED: ${error.message}`);
    }
  }

  // ดึง labels ตาม type พร้อม filter injection
  async getManyByType(req: CrudRequest, type?: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ถ้ามี ?type=X → inject filter type เข้า CrudRequest ก่อนส่งต่อ
        if (type !== undefined) {
          req.parsed.filter.push({
            field: 'type',
            operator: '$eq',
            value: parseInt(type),
          });
        }

        // 2. เรียก getMany จาก parent class
        const result = await this.getMany(req);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to get labels by type: ${error.message}`));
      }
    });
  }

  // Update label by extracting ID from CrudRequest
  async updateLabelById(req: CrudRequest, dto: Partial<CreateLabelDto>, userId: number): Promise<Labels> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. Extract ID from CrudRequest
        const id = req.parsed.paramsFilter.find(p => p.field === 'id')?.value;
        if (!id) {
          return reject(new Error('Failed to extract ID from request'));
        }

        // 2. Call existing updateLabel method
        const result = await this.updateLabel(parseInt(id), dto, userId);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to update label by ID: ${error.message}`));
      }
    });
  }

  // Delete label by extracting ID from CrudRequest
  async deleteLabelById(req: CrudRequest, userId: number): Promise<{ message: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. Extract ID from CrudRequest
        const id = req.parsed.paramsFilter.find(p => p.field === 'id')?.value;
        if (!id) {
          return reject(new Error('Failed to extract ID from request'));
        }

        // 2. Call existing deleteLabel method
        const result = await this.deleteLabel(parseInt(id), userId);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to delete label by ID: ${error.message}`));
      }
    });
  }

  // บันทึก label ลง database
  private async _saveLabel(dto: CreateLabelDto, userId: number): Promise<Labels> {
    const now = new Date();
    const label = this.repo.create({
      name: dto.name,
      color: dto.color,
      type: Number(dto.type),
      status: Number(dto.type) === 1 ? dto.status : null,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    });
    return await this.repo.save(label);
  }

  // สร้าง labels
  async createLabel(dto: CreateLabelDto, userId: number): Promise<Labels> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ตรวจสอบว่า project label ต้องมี status
        if (Number(dto.type) === 1 && !dto.status) {
          return reject(new HttpException('Project label must have status', HttpStatus.BAD_REQUEST));
        }
        // 2. ถ้าไม่ใช่ project label ให้ตั้ง status เป็น null
        if (Number(dto.type) !== 1) dto.status = null;

        // 3. ตรวจสอบว่ามี label ชื่อซ้ำใน type เดียวกันหรือไม่
        const existing = await this.repo.findOne({ where: { name: dto.name, type: Number(dto.type) as any } });
        if (existing) {
          return reject(new HttpException(`Label "${dto.name}" already exists in type ${dto.type}`, HttpStatus.CONFLICT));
        }

        // 4. ดึง GitLab project IDs ที่ต้อง sync
        const gitlabProjectIds = await this._getGitlabProjectIds();
        if (gitlabProjectIds.length > 0) {
          // 5. ดึง access token และ sync ไป GitLab
          const accessToken = await this.usersService.getValidAccessToken(userId);
          await this._syncGitlab('create', accessToken, gitlabProjectIds, { name: dto.name, color: dto.color });
        }

        // 6. บันทึก label ลง database
        const savedLabel = await this._saveLabel(dto, userId);
        resolve(savedLabel);
      } catch (error: any) {
        this.logger.error(`[createLabel] ERROR: ${error?.message}`);
        reject(error);
      }
    });
  }

  // แก้ไข labels
  async updateLabel(id: number, dto: Partial<CreateLabelDto>, userId: number): Promise<Labels> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ตรวจสอบว่ามี label นี้อยู่ใน database หรือไม่
        const label = await this.repo.findOne({ where: { id } });
        if (!label) return reject(new HttpException('Label not found', HttpStatus.NOT_FOUND));

        // 2. เตรียมข้อมูลเก่าและใหม่สำหรับการอัปเดต
        const oldName   = label.name;
        const newName   = dto.name  ?? label.name;
        const newColor  = dto.color ?? label.color;
        const labelType = Number(label.type);
        const nameChanged = oldName !== newName;

        this.logger.log(`[updateLabel] START id=${id} type=${labelType} nameChanged=${nameChanged} "${oldName}" => "${newName}" color=${newColor} userId=${userId}`);

        // 3. ดึง GitLab project IDs และ sync การอัปเดตไป GitLab
        const gitlabProjectIds = await this._getGitlabProjectIds();
        this.logger.log(`[updateLabel] GitLab sync: projects=${gitlabProjectIds.length} [${gitlabProjectIds.join(', ')}]`);
        if (gitlabProjectIds.length > 0) {
          const accessToken = await this.usersService.getValidAccessToken(userId);
          this.logger.log(`[updateLabel] GitLab sync: starting...`);
          await this._syncGitlab('update', accessToken, gitlabProjectIds, { oldName, name: newName, color: newColor });
          this.logger.log(`[updateLabel] GitLab sync: completed`);
        }

        // 4. ถ้าชื่อเปลี่ยน ให้อัปเดตชื่อใน products และ issues ทั้งหมด
        if (nameChanged) {
          this.logger.log(`[updateLabel] Rename operation: starting...`);
          await this._renameInProductsAndIssues(label.id, oldName, newName);
          this.logger.log(`[updateLabel] Rename operation: completed`);
        }

        // 5. อัปเดตข้อมูล label ใน database
        Object.assign(label, {
          name: newName,
          color: newColor,
          status: labelType === 1 ? (dto.status ?? label.status) : null,
          updatedBy: userId,
          updatedAt: new Date(),
        });

        this.logger.log(`[updateLabel] Database save: updating label record...`);
        const updatedLabel = await this.repo.save(label);
        this.logger.log(`[updateLabel] COMPLETED id=${id} finalName="${updatedLabel.name}" finalColor="${updatedLabel.color}"`);
        resolve(updatedLabel);
      } catch (error: any) {
        this.logger.error(`[updateLabel] ERROR: ${error?.message}`);
        reject(error);
      }
    });
  }

  // ลบ labels
  async deleteLabel(id: number, userId: number): Promise<{ message: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ตรวจสอบว่ามี label นี้อยู่ใน database หรือไม่
        const label = await this.repo.findOne({ where: { id } });
        if (!label) return reject(new HttpException('Label not found', HttpStatus.NOT_FOUND));

        // 2. ดึง GitLab project IDs และ sync การลบไป GitLab
        const gitlabProjectIds = await this._getGitlabProjectIds();
        if (gitlabProjectIds.length > 0) {
          const accessToken = await this.usersService.getValidAccessToken(userId);
          await this._syncGitlab('delete', accessToken, gitlabProjectIds, { name: label.name });
        }

        // 3. Soft delete label ใน database (ตั้ง deletedAt และ deletedBy)
        await this.repo.update(id, { deletedAt: new Date(), deletedBy: userId });
        
        // 4. คืนค่าข้อความสำเร็จ
        resolve({ message: `Label "${label.name}" deleted successfully` });
      } catch (error: any) {
        this.logger.error(`[deleteLabel] ERROR: ${error?.message}`);
        reject(error);
      }
    });
  }
}
