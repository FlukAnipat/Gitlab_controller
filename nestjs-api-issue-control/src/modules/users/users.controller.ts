import { Controller, Get, Param, ParseIntPipe, Post, Request, Body, UseGuards } from '@nestjs/common';
import { Crud, CrudController } from '@nestjsx/crud';
import { UsersService } from './users.service';
import { Users } from './users.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Crud({
  model: {
    type: Users,
  },
  query: {
    alwaysPaginate: true,
    sort: [{ field: 'createdAt', order: 'DESC' }],
    limit: 10,
    maxLimit: 100,
    filter: {
      deletedAt: { $isnull: true },
    },
    exclude: [
      'password',
      'accessToken',
      'refreshToken',
      'tokenExpiresAt',
      'gitlabClientSecret',
    ],
  },
  routes: {
    deleteOneBase: {
      returnDeleted: true,
    },
  },
})  
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController implements CrudController<Users> {
  constructor(public service: UsersService) {}

  // POST /users/setup-gitlab — step 2: save client_id + client_secret
  @Post('setup-gitlab')
  async setupGitlab(
    @Body() body: { clientId: string; clientSecret: string },
    @Request() req: any,
  ) {
    // 1. รับ userId จาก JWT
    // 2. save credentials
    await this.service.updateGitlabClientCredentials(req.user.id, body.clientId, body.clientSecret);
    return { message: 'GitLab credentials saved. You can now connect GitLab.' };
  }

  // Get repo gitlab 
  @Get('repositories')
  async getRepositories(@Request() req: any) {
    return this.service.getRepositories(req.user?.id);
  }

  // GET /users/projects/:projectId/members
  @Get('projects/:projectId/members')
  async getProjectMembers(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Request() req: any,
  ) {
    return this.service.getProjectMembers(projectId, req.user?.id);
  }
}
