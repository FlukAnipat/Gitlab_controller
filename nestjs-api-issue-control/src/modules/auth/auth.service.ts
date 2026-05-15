import { Injectable, HttpException, HttpStatus, Inject, forwardRef, InternalServerErrorException, Logger } from '@nestjs/common';
import { GitlabService } from '../../service/git/git.service';
import { UsersService } from '../users/users.service';
import { Response } from 'express';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(forwardRef(() => GitlabService))
    private readonly gitlabService: GitlabService,
    private readonly usersService: UsersService,
  ) { }

  //REGISTER — สร้าง user + save credentials + return JWT
  async register(username: string, password: string, clientId: string, clientSecret: string) {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          // 1. validate
          if (!username || !password || !clientId || !clientSecret) {
            return reject(new HttpException(
              'username, password, clientId, clientSecret are required',
              HttpStatus.BAD_REQUEST,
            ));
          }

          // 2. สร้าง user หรือ update ถ้ามีอยู่แล้ว
          const user = await this.usersService.setupUser(username, password, clientId, clientSecret);

          // 3. สร้าง JWT เพื่อใช้ step ต่อไป (connect GitLab)
          const jwt = require('jsonwebtoken');
          const jwtToken = jwt.sign(
            {
              id: user.id,
              username: user.username,
              accessToken: user.accessToken,
            },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: '24h' },
          );

          resolve({
            status: 'success',
            message: 'Account ready. Please connect GitLab via GET /auth/gitlab/login',
            token: jwtToken,
            data: this.usersService.toResponse(user),
          });
        } catch (error) {
          reject(new InternalServerErrorException(error));
        }
      })();
    });
  }

  // สร้าง URL สำหรับ redirect ไป GitLab OAuth
  // 1. สร้าง URL
  async getGitlabAuthUrl(userId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          // 1. ดึง user เพื่อเอา client_id
          const user = await this.usersService.findById(userId);
          if (!user?.gitlabClientId || !user?.gitlabClientSecret) {
            return reject(new HttpException(
              'Please setup GitLab credentials first via POST /users/setup-gitlab',
              HttpStatus.BAD_REQUEST,
            ));
          }

          // 2. สร้าง URL พร้อม state=userId เพื่อใช้ใน callback
          const url = new URL('https://gitlab.com/oauth/authorize');
          url.searchParams.append('client_id', user.gitlabClientId);
          url.searchParams.append('redirect_uri', process.env.GITLAB_REDIRECT_URI);
          url.searchParams.append('response_type', 'code');
          url.searchParams.append('scope', 'read_user read_repository api');
          url.searchParams.append('state', String(userId));

          resolve(url.toString());
        } catch (error) {
          reject(error);
        }
      })();
    });
  }

  // รีไดเร็คต์หลัง login
  async redirectAfterLogin(result: any, res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
    return res.redirect(
      `${frontendUrl}/login/callback` +
      `?token=${result.token}` +
      `&user=${encodeURIComponent(JSON.stringify(result.data))}`,
    );
  }

  // รับ code จาก GitLab callback แล้วแลกเป็น token + สร้าง/อัปเดต user
  async handleGitlabCallback(code: string, state: string) {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          if (!code) {
            return reject(new HttpException('Authorization code is required', HttpStatus.BAD_REQUEST));
          }

          // 1. ดึง user จาก state (userId) — ไม่ใช้ username เพราะอาจไม่ตรงกับ GitLab
          const user = await this.usersService.findById(Number(state));
          if (!user?.gitlabClientId || !user?.gitlabClientSecret) {
            return reject(new HttpException('GitLab credentials not found', HttpStatus.BAD_REQUEST));
          }

          // 2. แลก code → access_token
          const token = await this.gitlabService.getAccessToken(
            code,
            user.gitlabClientId,
            user.gitlabClientSecret,
          );

          // 3. ดึงข้อมูลจาก GitLab
          const profile = await this.gitlabService.getUser(token.access_token);

          // 4. merge ข้อมูล GitLab เข้า user row เดิม (ใช้ userId ไม่ใช้ username)
          const updatedUser = await this.usersService.mergeGitlabProfile(user.id, profile, token);

          // 5. สร้าง JWT
          const jwt = require('jsonwebtoken');
          const jwtToken = jwt.sign(
            {
              id: updatedUser.id,
              gitlabId: updatedUser.gitlabId,
              username: updatedUser.username,
              accessToken: updatedUser.accessToken,
            },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: '24h' },
          );

          // Log user login information
          console.log(`User : ${user.username} ID: ${user.id}`);
          console.log(`GitLab ID: ${user.gitlabId}`);
          console.log(`JWT Token: ${jwtToken}`);
          console.log(`Access Token: ${user.accessToken}`);


          resolve({
            status: 'success',
            message: 'GitLab connected successfully',
            token: jwtToken,
            data: this.usersService.toResponse(updatedUser),
          });
        } catch (error) {
          reject(new InternalServerErrorException(error));
        }
      })();
    });
  }

  // Login ด้วย username/password
  async loginWithPassword(username: string, password: string) {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          if (!username || !password) {
            return reject(new HttpException('Username and password are required', HttpStatus.BAD_REQUEST));
          }

          // 1. ตรวจสอบ user
          const user = await this.usersService.validateUser(username, password);
          if (!user) {
            return reject(new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED));
          }

          // 2. ต้อง connect GitLab ก่อนถึงจะมี access_token
          if (!user.accessToken) {
            return reject(new HttpException(
              'Please connect GitLab first via GET /auth/gitlab/login',
              HttpStatus.FORBIDDEN,
            ));
          }

          // 3. สร้าง JWT
          const jwt = require('jsonwebtoken');
          const jwtToken = jwt.sign(
            {
              id: user.id,
              gitlabId: user.gitlabId,
              username: user.username,
              accessToken: user.accessToken,
            },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: '24h' },
          );

          // Log user login information
          console.log(`User : ${user.username} ID: ${user.id}`);
          console.log(`GitLab ID: ${user.gitlabId}`);
          console.log(`JWT Token: ${jwtToken}`);
          console.log(`Access Token: ${user.accessToken}`);


          resolve({
            status: 'success',
            message: 'Login successful',
            token: jwtToken,
            data: this.usersService.toResponse(user),
          });
        } catch (error) {
          reject(new InternalServerErrorException(error));
        }
      })();
    });
  }

  // สร้าง URL สำหรับ redirect ไป GitLab OAuth โดยใช้ username
  async getGitlabAuthUrlByUsername(username: string): Promise<string> {
    const user = await this.usersService.findByUsername(username);
    //1. ตรวจสอบว่ามี gitlabClientId และ gitlabClientSecret หรือไม่
    if (!user?.gitlabClientId || !user?.gitlabClientSecret) {
      throw new HttpException(
        'GitLab client config not found. Please setup your GitLab OAuth app first.',
        HttpStatus.BAD_REQUEST,
      );
    }

    //2. สร้าง URL สำหรับ redirect ไป GitLab OAuth
    const redirectUri = process.env.GITLAB_REDIRECT_URI;
    const state = String(user.id);  // ส่ง userId เป็น state เหมือนเดิม

    const url = new URL('https://gitlab.com/oauth/authorize');
    url.searchParams.append('client_id', user.gitlabClientId);
    url.searchParams.append('redirect_uri', redirectUri);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('scope', 'read_user read_repository api');
    url.searchParams.append('state', state);

    //3. return url
    return url.toString();
  }

  // Get repositories from GitLab
  async getRepositories(accessToken: string) {
    try {
      return await this.gitlabService.getUserRepositories(accessToken);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }


  // Logout — ลบ token ของ user
  async logout(userId: number) {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          if (!userId) {
            return reject(new HttpException('User ID is required', HttpStatus.BAD_REQUEST));
          }

          // 1. ลบ token ออกจาก DB
          const result = await this.usersService.clearGitlabToken(userId);

          // 2. revoke token ออกจาก GitLab
          if (result.accessToken) {
            try {
              // ดึง user เพื่อเอา client_id/secret
              const user = await this.usersService.findById(userId);
              if (user?.gitlabClientId && user?.gitlabClientSecret) {
                await this.gitlabService.revokeToken(
                  result.accessToken,
                  user.gitlabClientId,
                  user.gitlabClientSecret,
                );
              }
            } catch (e) {
              console.warn('Failed to revoke GitLab token:', e.message);
            }
          }

          resolve({ message: result.message });
        } catch (error) {
          reject(new InternalServerErrorException(error));
        }
      })();
    });
  }
}
