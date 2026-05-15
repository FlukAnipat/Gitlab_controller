import { Controller, Get, Query, Res, Post, Body, UseGuards, Req} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

 // Controller สำหรับจัดการการเข้าสู่ระบบกับ GitLab
 @Controller('auth/gitlab')
 export class AuthController {
  constructor(private readonly authService: AuthService) { }
  
  // POST /auth/gitlab/register — ครั้งแรก สร้าง user + save credentials
  @Post('register')
  async register(
    @Body() body: { username: string; password: string; clientId: string; clientSecret: string },
  ) {
    // 1. สร้าง user + save client credentials
    // 2. return JWT พร้อมใช้ได้เลย
    return this.authService.register(body.username, body.password, body.clientId, body.clientSecret);
  }

  // รับ token จาก query param แทน Authorization header
  @Get('connect')
  async connect(@Query('token') token: string, @Res() res: Response) {
    try {
      // 1. verify token
      const jwt = require('jsonwebtoken');
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');

      // 2. สร้าง GitLab auth URL ด้วย userId จาก token
      const url = await this.authService.getGitlabAuthUrl(decoded.id);

      // 3. redirect ไป GitLab
      return res.redirect(url);
    } catch (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_token`);
    }
  }

 // GET /auth/gitlab/login - Redirect to GitLab OAuth
 @Get('login')
  @UseGuards(JwtAuthGuard)
  async gitlabLogin(@Req() req: any, @Res() res: Response) {
    // 1. ดึง userId จาก JWT
    // 2. สร้าง URL ด้วย client_id ของ user นั้น
    const url = await this.authService.getGitlabAuthUrl(req.user.id);
    return res.redirect(url);
  }

 // GET /auth/gitlab/callback - Handle GitLab OAuth callback
 @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      // 1. แลก code → token แล้ว save ลง DB
      const result = await this.authService.handleGitlabCallback(code, state);
      // 2. redirect กลับ frontend
      return this.authService.redirectAfterLogin(result, res);
    } catch (error) {
      console.error(error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }

  // Login ด้วย username/password
  @Post('login/password')
  async loginWithPassword(@Body() body: { username: string; password: string }) {
    return this.authService.loginWithPassword(body.username, body.password);
  }

  //POST /auth/gitlab/logout
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Req() req: any) {
    return this.authService.logout(req.user.id);
  }
}