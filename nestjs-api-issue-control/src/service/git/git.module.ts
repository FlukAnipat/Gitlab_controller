import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GitlabService } from './git.service';
import { UsersModule } from '../../modules/users/users.module';
import { Users } from '../../modules/users/users.entity';
import { AuthModule } from '../../modules/auth/auth.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([Users]),
  ],
  providers: [GitlabService],
  exports: [GitlabService],
})

export class GitlabModule { }
