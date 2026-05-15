import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product } from './product.entity';
import { Project } from '../project/project.entity';
import { Issue } from '../issue/issue.entity';
import { Labels } from '../labels/labels.entity';
import { GitlabModule } from '../../service/git/git.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectModule } from '../project/project.module';
import { UsersModule } from '../users/users.module';
import { IssueModule } from '../issue/issue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Project, Issue, Labels]),
    GitlabModule,
    AuthModule,
    ProjectModule,
    UsersModule,
    forwardRef(() => IssueModule),
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
