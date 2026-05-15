import { Controller, Request, UseGuards, Get, Query, BadRequestException } from '@nestjs/common';
import { Crud, CrudController, Override, CrudRequest, ParsedBody, ParsedRequest } from '@nestjsx/crud';
import { Labels } from './labels.entity';
import { LabelsService } from './labels.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateLabelDto } from './dto/create-label.dto';

@Crud({
  model: {
    type: Labels,
  },
  query: {
    alwaysPaginate: true,
    sort: [{ field: 'createdAt', order: 'DESC' }],
    filter: { deletedAt: { $isnull: true } },
    join: {
      createdByUser: {
        eager: false,
        allow: ['id', 'username', 'avatarUrl'],
      },
    },
  },
  routes: {
    exclude: ['createManyBase', 'replaceOneBase'],
  },
})
@Controller('labels')
@UseGuards(JwtAuthGuard)
export class LabelsController implements CrudController<Labels> {
  constructor(public service: LabelsService) {}

  // GET /labels?type=0  → task_type
  @Override('getManyBase')
  async getMany(
    @ParsedRequest() req: CrudRequest,
    @Query('type') type: string,
  ) {
    try {
      return await this.service.getManyByType(req, type);
    } catch (error) {
      throw new BadRequestException(`Failed to get labels: ${error.message}`);
    }
  }

  // Override createOneBase เพื่อเพิ่ม userId
  @Override('createOneBase')
  async createOne(
    @ParsedRequest() _req: CrudRequest,
    @ParsedBody() dto: CreateLabelDto,
    @Request() request: any,
  ) {
    return this.service.createLabel(dto, request.user?.id);
  }

  // Override updateOneBase เพื่อเพิ่ม userId
  @Override('updateOneBase')
  async updateOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: CreateLabelDto,
    @Request() request: any,
  ) {
    try {
      return await this.service.updateLabelById(req, dto, request.user?.id);
    } catch (error) {
      throw new BadRequestException(`Failed to update label: ${error.message}`);
    }
  }

  // Override deleteOneBase เพื่อเพิ่ม userId
  @Override('deleteOneBase')
  async deleteOne(
    @ParsedRequest() req: CrudRequest,
    @Request() request: any,
  ) {
    try {
      return await this.service.deleteLabelById(req, request.user?.id);
    } catch (error) {
      throw new BadRequestException(`Failed to delete label: ${error.message}`);
    }
  }
}
