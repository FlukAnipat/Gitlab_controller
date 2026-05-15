// labels.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabelsController } from './labels.controller';
import { LabelsService } from './labels.service';
import { Labels } from './labels.entity';
import { Users } from '../users/users.entity';
import { GitlabModule } from '../../service/git/git.module';
import { UsersModule } from '../users/users.module';
import { Project } from '../project/project.entity';
import { Product } from '../product/product.entity';
import { Issue } from '../issue/issue.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Labels, Users, Project, Product, Issue]), GitlabModule, UsersModule],
  controllers: [LabelsController],
  providers: [LabelsService],
  exports: [LabelsService],
})
export class LabelsModule {}
