import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { Project } from './project.entity';
import { AuthModule } from '../auth/auth.module';
import { Users } from '../users/users.entity';
import { GitlabModule } from '../../service/git/git.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Users]),
    // เก็บไฟล์ใน memory buffer แล้วส่งต่อ GitLab โดยตรง ไม่ save disk
    MulterModule.register({ storage: memoryStorage() }),
    AuthModule,
    GitlabModule,
    UsersModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
