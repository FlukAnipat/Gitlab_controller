import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectModule } from './modules/project/project.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { GitlabModule } from './service/git/git.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { LabelsModule } from './modules/labels/labels.module';
import { ProductModule } from './modules/product/product.module';
import { IssueModule } from './modules/issue/issue.module';

// import entity
import { Users } from './modules/users/users.entity';
import { Labels } from './modules/labels/labels.entity';
import { Project } from './modules/project/project.entity';
import { Product } from './modules/product/product.entity';
import { Issue } from './modules/issue/issue.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [Users, Labels, Project, Product, Issue], // ค้นหาไฟล์ entity
      synchronize: false, // sync database
    }),

    ProjectModule,
    AuthModule,
    GitlabModule,
    LabelsModule,
    ProductModule,
    IssueModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
