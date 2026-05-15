import { Controller, UseGuards, Get, Post, Param, Request, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { Crud, CrudController } from '@nestjsx/crud';
import { FileInterceptor } from '@nestjs/platform-express';
import { File as MulterFile } from 'multer';
import { ProjectService } from './project.service';
import { Project } from './project.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Crud({
  model: { type: Project },
  query: {
    alwaysPaginate: true,
    join: { user: { eager: false } },
  },
})
@Controller('project')
@UseGuards(JwtAuthGuard)
export class ProjectController implements CrudController<Project> {
  constructor(public service: ProjectService) {}

  // ดึง milestones จาก GitLab ของ project นั้น
  @Get(':id/milestones')
  async getMilestones(@Param('id') id: string, @Request() req: any) {
    return this.service.getMilestones(parseInt(id), req.user?.id);
  }
    // อัปโหลดรูปภาพจาก editor ไป GitLab แล้วคืน { url, markdown }
  // frontend ใช้ url นี้ฝังใน description โดยตรง
  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('id') id: string,
    @UploadedFile() file: MulterFile,
    @Request() req: any,
  ) {
    try {
      return await this.service.uploadFile(
        parseInt(id),
        { buffer: file.buffer, originalname: file.originalname, mimetype: file.mimetype },
        req.user?.id,
      );
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }
}
