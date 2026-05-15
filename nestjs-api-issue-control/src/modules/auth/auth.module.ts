import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { UsersModule } from '../users/users.module';
import { GitlabModule } from '../../service/git/git.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Users } from '../users/users.entity';

@Module({

  imports: [UsersModule, 
    forwardRef(() => GitlabModule),                      
    TypeOrmModule.forFeature([Users])],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})

export class AuthModule { }