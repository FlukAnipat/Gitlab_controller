import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssueService } from './issue.service';
import { IssueController } from './issue.controller';
import { Issue } from './issue.entity';
import { Product } from '../product/product.entity';
import { Project } from '../project/project.entity';
import { Labels } from '../labels/labels.entity';
import { GitlabModule } from '../../service/git/git.module';
import { ProjectModule } from '../project/project.module';
import { UsersModule } from '../users/users.module';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Issue, Product, Project, Labels]),
    GitlabModule,
    ProjectModule,
    UsersModule,
    forwardRef(() => ProductModule),
  ],
  providers: [IssueService],
  controllers: [IssueController],
  exports: [IssueService],
})
export class IssueModule {}
