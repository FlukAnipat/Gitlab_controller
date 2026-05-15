import { Controller, Body, Request, UseGuards, Param, Get, Post, Delete } from '@nestjs/common';
import { Crud, CrudController, Override, ParsedRequest, CrudRequest } from '@nestjsx/crud';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IssueService } from './issue.service';
import { Issue } from './issue.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Crud({
  model: { type: Issue },
  dto: { create: CreateIssueDto, update: UpdateIssueDto },
  query: {
    alwaysPaginate: true,
    sort: [{ field: 'createdAt', order: 'DESC' }],
    join: { project: { eager: true }, product: { eager: true } },
  },
  routes: {
    // ปิด deleteOneBase ของ CRUD เพราะใช้ soft delete แทน
    exclude: ['deleteOneBase'],
  },
})
@ApiTags('issue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('issue')
export class IssueController implements CrudController<Issue> {
  constructor(public service: IssueService) {}

  // Get Issues
  // คืนเฉพาะ issues ของ GitLab projects ที่ user เป็นสมาชิก
  @Override('getManyBase')
  async getMany(@Request() req: any) {
    return this.service.getVisibleIssues(req.user?.id);
  }

  // Get Issue Detail
  // คืนเฉพาะ issue ที่ user มีสิทธิ์จาก GitLab membership
  @Override('getOneBase')
  async getOne(@ParsedRequest() req: CrudRequest, @Request() request: any) {
    const id = req.parsed.paramsFilter.find(p => p.field === 'id')?.value;
    return this.service.getVisibleIssueById(parseInt(id), request.user?.id);
  }

  // Create Issue 
  // Override CRUD createOneBase เพื่อส่ง userId เข้า service
  @Override('createOneBase')
  async createOne(@Body() dto: CreateIssueDto, @Request() req: any) {
    const count = dto.count && dto.count > 0 ? dto.count : 1;
    if (count > 1) {
      const results = [];
      for (let i = 0; i < count; i++) {
        results.push(await this.service.createIssue(dto, req.user?.id));
      }
      return results;
    }
    return this.service.createIssue(dto, req.user?.id);
  }

  // Update Issue
  // Override CRUD updateOneBase เพื่อส่ง userId เข้า service
  @Override('updateOneBase')
  async updateOne(@ParsedRequest() req: CrudRequest, @Body() dto: UpdateIssueDto, @Request() request: any) {
    const id = req.parsed.paramsFilter.find(p => p.field === 'id')?.value;
    return this.service.updateIssue(parseInt(id), dto, request.user?.id);
  }

  // Delete Issue (Soft Delete)
  // ใช้ route แยกเพราะ CRUD deleteOneBase ลบถาวร ต้องการ soft delete แทน
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete issue (ปิด issue บน GitLab + mark closed ใน DB)' })
  async deleteOne(@Param('id') id: string, @Request() req: any) {
    return this.service.softDeleteIssue(parseInt(id), req.user?.id);
  }

  // Restore Issue
  // เปิด issue ที่ถูก soft delete กลับมา (reopen issue บน GitLab)
  @Get(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted issue (reopen issue บน GitLab)' })
  async restore(@Param('id') id: string, @Request() req: any) {
    return this.service.restoreIssue(parseInt(id), req.user?.id);
  }

  // Link / Unlink Issue ↔ Product
  // ใช้ POST แยก 2 route เพราะเป็น action ที่ไม่ใช่ CRUD ปกติ
  @Post('link-product')
  @ApiOperation({ summary: 'เชื่อม issue กับ product ทั้งใน DB และ GitLab' })
  async linkProduct(@Body() body: { issueId: number; productId: number }, @Request() req: any) {
    return this.service.linkIssueToProduct(body.issueId, body.productId, req.user?.id);
  }

  @Post('unlink-product')
  @ApiOperation({ summary: 'ยกเลิกการเชื่อม issue กับ product ทั้งใน DB และ GitLab' })
  async unlinkProduct(@Body() body: { issueId: number }, @Request() req: any) {
    return this.service.unlinkIssueFromProduct(body.issueId, req.user?.id);
  }

  // Get Issues by Product
  // ดึง issue ที่เชื่อมกับ product หนึ่ง ๆ (ใช้บ่อยใน detail page)
  @Get('product/:productId')
  @ApiOperation({ summary: 'ดึง issues ที่เชื่อมกับ product' })
  async getByProduct(@Param('productId') productId: string, @Request() req: any) {
    return this.service.getIssuesByProduct(parseInt(productId), req.user?.id);
  }

  // Get Issues by Project
  // ดึง issue เฉพาะของ project ที่ user มีสิทธิ์เข้าถึง
  @Get('project/:projectId')
  @ApiOperation({ summary: 'ดึง issues ของ project ที่ระบุ' })
  async getByProject(@Param('projectId') projectId: string, @Request() req: any) {
    return this.service.getVisibleIssuesByProject(parseInt(projectId), req.user?.id);
  }

  // Get Linkable Issues
  // ดึง issue ที่ยังไม่มี product (สำหรับ dropdown ตอน link)
  @Get('linkable/product/:productId')
  @ApiOperation({ summary: 'ดึง issues ที่ยังไม่มี product (สำหรับ link)' })
  async getLinkableByProduct(@Param('productId') productId: string, @Request() req: any) {
    return this.service.getLinkableIssuesForProduct(parseInt(productId), req.user?.id);
  }

  // Get Milestones
  // ดึง milestones จาก GitLab project ของ issue นั้น
  @Get(':id/milestones')
  @ApiOperation({ summary: 'ดึง milestones จาก GitLab project ของ issue' })
  async getMilestones(@Param('id') id: string, @Request() req: any) {
    return this.service.getMilestones(parseInt(id), req.user?.id);
  }
}
