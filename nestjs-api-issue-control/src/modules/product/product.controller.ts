import { Controller, Body, Request, UseGuards, Param, Get, Post, Delete, Inject, forwardRef } from '@nestjs/common';
import { Crud, CrudController, Override, ParsedRequest, CrudRequest } from '@nestjsx/crud';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IssueService } from '../issue/issue.service';

@Crud({
  model: { type: Product },
  dto: { create: CreateProductDto, update: UpdateProductDto },
  query: {
    alwaysPaginate: true,
    sort: [{ field: 'createdAt', order: 'DESC' }],
    join: { project: { eager: true } },
  },
  routes: {
    // ปิด deleteOneBase ของ CRUD เพราะใช้ soft delete แทน
    exclude: ['deleteOneBase'],
  },
})
@ApiTags('product')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('product')
export class ProductController implements CrudController<Product> {
  constructor(
    public service: ProductService,
    @Inject(forwardRef(() => IssueService)) private readonly issueService: IssueService,
  ) {}

  // Get Products
  // คืนเฉพาะ products ของ GitLab projects ที่ user เป็นสมาชิก
  @Override('getManyBase')
  async getMany(@Request() req: any) {
    return this.service.getVisibleProducts(req.user?.id);
  }

  // Get Product Detail
  // คืนเฉพาะ product ที่ user มีสิทธิ์จาก GitLab membership
  @Override('getOneBase')
  async getOne(@ParsedRequest() req: CrudRequest, @Request() request: any) {
    const id = req.parsed.paramsFilter.find(p => p.field === 'id')?.value;
    return this.service.getVisibleProductById(parseInt(id), request.user?.id);
  }

  // Create Product
  // Override CRUD createOneBase เพื่อส่ง userId เข้า service
  @Override('createOneBase')
  async createOne(@Body() dto: CreateProductDto, @Request() req: any) {
    const count = dto.count && dto.count > 0 ? dto.count : 1;
    if (count > 1) {
      const results = [];
      for (let i = 0; i < count; i++) {
        results.push(await this.service.createProduct(dto, req.user?.id));
      }
      return results;
    }
    return this.service.createProduct(dto, req.user?.id);
  }

  // Update Product
  // Override CRUD updateOneBase เพื่อส่ง userId เข้า service
  @Override('updateOneBase')
  async updateOne(@ParsedRequest() req: CrudRequest, @Body() dto: UpdateProductDto, @Request() request: any) {
    const id = req.parsed.paramsFilter.find(p => p.field === 'id')?.value;
    return this.service.updateProduct(parseInt(id), dto, request.user?.id);
  }

  // Delete Product (Soft Delete)
  // ใช้ route แยกเพราะ CRUD deleteOneBase ลบถาวร ต้องการ soft delete แทน
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete product (ปิด issue บน GitLab + mark closed ใน DB)' })
  async deleteOne(@Param('id') id: string, @Request() req: any) {
    return this.service.softDeleteProduct(parseInt(id), req.user?.id);
  }

  // Restore Product
  // เปิด product ที่ถูก soft delete กลับมา (reopen issue บน GitLab)
  @Get(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted product (reopen issue บน GitLab)' })
  async restore(@Param('id') id: string, @Request() req: any) {
    return this.service.restoreProduct(parseInt(id), req.user?.id);
  }

  // Clone Product
  // clone product (พร้อม issues ที่ link อยู่) ตาม prefix และ count
  @Post(':id/clone')
  @ApiOperation({ summary: 'Clone product พร้อม issues ที่ link อยู่' })
  async cloneProduct(
    @Param('id') id: string,
    @Body() body: { prefix?: string; count?: number },
    @Request() req: any,
  ) {
    return this.service.cloneProduct(parseInt(id), body.prefix, body.count || 1, req.user?.id, this.issueService);
  }

  // Get Milestones
  // ดึง milestones จาก GitLab project ของ product นั้น
  @Get(':id/milestones')
  @ApiOperation({ summary: 'ดึง milestones จาก GitLab project ของ product' })
  async getMilestones(@Param('id') id: string, @Request() req: any) {
    return this.service.getMilestones(parseInt(id), req.user?.id);
  }
}
