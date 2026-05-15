import { Inject, Injectable, InternalServerErrorException, NotFoundException, forwardRef, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Repository } from 'typeorm';
import { Users } from './users.entity';
import { UserResponseDto } from './dto/user-response.dto';
import { GitlabService } from '../../service/git/git.service';

@Injectable()
export class UsersService extends TypeOrmCrudService<Users> {
  constructor(
    @InjectRepository(Users)
    private readonly userRepo: Repository<Users>,
    @Inject(forwardRef(() => GitlabService))
    private readonly gitlabService: GitlabService,
  ) {
    super(userRepo);
  }

  // อัปเดตหรือสร้าง user จากข้อมูล GitLab
async upsertGitlabUser(profile: any, token: any): Promise<Users> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        // 1. คำนวณ expire time
        const expiresAt = token.expires_in
          ? new Date(Date.now() + token.expires_in * 1000)
          : null;

        // 2. หา user จาก gitlabId ก่อน
        let user = await this.userRepo.findOne({
          where: { gitlabId: profile.id },
        });

        // 3. ถ้าไม่เจอจาก gitlabId → หาจาก username
        if (!user) {
          user = await this.userRepo.findOne({
            where: { username: profile.username },
          });
        }

        if (user) {
          // 4. update user เดิม
          user.gitlabId = profile.id;
          user.email = profile.email;
          user.avatarUrl = profile.avatar_url;
          user.accessToken = token.access_token;
          user.refreshToken = token.refresh_token;
          user.tokenExpiresAt = expiresAt?.toISOString();
          user.updatedBy = String(user.id); // ← updatedBy = userId ของตัวเอง
          user.updatedAt = new Date();
        } else {
          // 5. สร้าง user ใหม่
          user = this.userRepo.create({
            gitlabId: profile.id,
            username: profile.username,
            email: profile.email,
            avatarUrl: profile.avatar_url,
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
            tokenExpiresAt: expiresAt?.toISOString(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // 6. save ก่อนเพื่อได้ id แล้วค่อย update createdBy/updatedBy
          user = await this.userRepo.save(user);
          await this.userRepo.update(user.id, {
            createdBy: String(user.id),
            updatedBy: String(user.id),
          });

          // 7. reload
          user = await this.userRepo.findOne({ where: { id: user.id } });
        }

        // 8. save
        resolve(await this.userRepo.save(user));
      } catch (error) {
        console.error('Upsert GitLab User Error:', error);
        reject(new InternalServerErrorException('Failed to save user'));
      }
    })();
  });
}

  // Login ด้วย username/password
  async validateUser(username: string, password: string,): Promise<Users | null> {
    try {
      // 1. ค้นหา user ด้วย username
      const user = await this.userRepo.findOne({ where: { username } });
      // 2. ตรวจสอบ password
      if (!user || !user.password) return null;
      // 3. ตรวจสอบ password
      return user.password === password ? user : null;
    } catch (error) {
      // 4. แสดง error
      console.error('Validate User Error:', error);
      throw new InternalServerErrorException('Failed to validate user');
    }
  }
  // ค้นหา user ด้วย id
  async findById(id: number): Promise<Users | null> {
    // 1. ค้นหา user ด้วย id
     try {
      // 2. ค้นหา user ด้วย id
      return await this.userRepo.findOne({ where: { id } });
    } catch (error) {
      // 3. แสดง error
      console.error('Find User Error:', error);
      throw new InternalServerErrorException('Failed to find user');
    }
  }

  // ลบ token ออกจาก user
  async clearGitlabToken(userId: number): Promise<{ message: string; accessToken: string | null }> {
    // 1. ค้นหา user ด้วย id
     try {
      // 2. ค้นหา user ด้วย id
      const user = await this.userRepo.findOne({
        where: { id: userId },
      });
      // 3. ตรวจสอบ user
      if (!user) {
        throw new InternalServerErrorException('User not found');
      }
      // 4. ดึง accessToken
      const { accessToken } = user;
      // 5. ลบ token
      await this.userRepo.update(userId, {
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
      });
      // 6. return response
      return {
        message: 'Logout success',
        accessToken,
      };
      // 7. แสดง error
    } catch (error) {
      console.error('Clear Token Error:', error);
      throw new InternalServerErrorException(error);
    }
  }

  // update GitLab tokens ของ user นั้น
  async updateGitlabTokens(userId: number, accessToken: string, refreshToken: string | null, expiresIn?: number): Promise<void> {
    try {
      await this.userRepo.update(userId, {
        accessToken,
        refreshToken,
        tokenExpiresAt: expiresIn
          ? new Date(Date.now() + expiresIn * 1000).toISOString()
          : null,
      });
    } catch (error) {
      console.error('Update GitLab Token Error:', error);
      throw new InternalServerErrorException('Failed to update GitLab token');
    }
  }

  // ใช้ userId เป็น anchor ไม่ใช้ username
  async mergeGitlabProfile(userId: number, profile: any, token: any): Promise<Users> {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const now = new Date();
          const expiresAt = token.expires_in
            ? new Date(Date.now() + token.expires_in * 1000)
            : null;

          // 1. ดึง user จาก id
          const user = await this.userRepo.findOne({ where: { id: userId } });
          if (!user) {
            return reject(new InternalServerErrorException('User not found'));
          }

          // 2. merge ข้อมูล GitLab เข้า row เดิม
          await this.userRepo.update(userId, {
            gitlabId: profile.id,
            email: profile.email,
            avatarUrl: profile.avatar_url,
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
            tokenExpiresAt: expiresAt?.toISOString(),
            updatedBy: String(userId),
            updatedAt: now,
          });

          // 3. return updated user
          resolve(await this.userRepo.findOne({ where: { id: userId } }));
        } catch (error) {
          reject(new InternalServerErrorException('Failed to merge GitLab profile'));
        }
      })();
    });
  }

  // Get repo gitlab
  async getRepositories(userId: number) {
    if (!userId) {
      return { message: 'User not authenticated' };
    }

    try {
      return await this.gitlabService.getRepositoriesForUser(userId);
    } catch (error) {
      return { message: 'Failed to fetch repositories', error: error.message };
    }
  }

  // Get project members from gitlab
  async getProjectMembers(projectId: number, userId: number) {
    if (!userId) {
      return { message: 'User not found or no access token' };
    }

    return this.gitlabService.getProjectMembersForUser(projectId, userId);
  }

  // Get valid access token (refresh if needed)
  async getValidAccessToken(userId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          // 1. ดึง user จาก DB
          const user = await this.userRepo.findOne({ where: { id: userId } });
          if (!user?.accessToken) {
            return reject(new UnauthorizedException('User not authenticated'));
          }

          // 2. เช็ก expiry จาก DB เลย ไม่ต้องยิง GitLab API
          const isExpired = user.tokenExpiresAt
            ? new Date(user.tokenExpiresAt).getTime() < Date.now() + 60_000  // buffer 1 นาที
            : false;  // ไม่มี expiry ถือว่ายังใช้ได้

          // 3. token ยังดี คืนเลย
          if (!isExpired) {
            return resolve(user.accessToken);
          }

          // 4. token expired → ต้องมี refresh token + client credentials
          if (!user.refreshToken || !user.gitlabClientId || !user.gitlabClientSecret) {
            return reject(new UnauthorizedException('Token expired. Please reconnect GitLab.'));
          }

          // 5. refresh
          const newTokens = await this.gitlabService.refreshAccessToken(
            user.refreshToken,
            user.gitlabClientId,
            user.gitlabClientSecret,
          );

          // 6. บันทึก token ใหม่
          await this.userRepo.update(userId, {
            accessToken: newTokens.access_token,
            refreshToken: newTokens.refresh_token || user.refreshToken,
            tokenExpiresAt: newTokens.expires_in
              ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
              : null,
          });

          // 7. คืน token ใหม่
          resolve(newTokens.access_token);
        } catch (error) {
          reject(error);
        }
      })();
    });
  }

  // UPDATE GITLAB CLIENT CREDENTIALS
  async updateGitlabClientCredentials(userId: number, clientId: string, clientSecret: string): Promise<void> {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          // 1. ตรวจว่ามี user
          const user = await this.userRepo.findOne({ where: { id: userId } });
          if (!user) {
            return reject(new UnauthorizedException('User not found'));
          }

          // 2. save client_id + client_secret
          await this.userRepo.update(userId, {
            gitlabClientId: clientId,
            gitlabClientSecret: clientSecret,
          });

          resolve();
        } catch (error) {
          reject(new InternalServerErrorException('Failed to save GitLab credentials'));
        }
      })();
    });
  }

  // FIND BY USERNAME
  async findByUsername(username: string): Promise<Users | null> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        resolve(await this.userRepo.findOne({ where: { username } }));
      } catch (error) {
        reject(new InternalServerErrorException('Failed to find user'));
      }
    })();
  });
}

  // SETUP USER
 async setupUser(username: string, password: string, clientId: string, clientSecret: string): Promise<Users> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const now = new Date();

        // 1. ตรวจสอบว่า username ซ้ำไหม
        const existing = await this.userRepo.findOne({ where: { username } });
        if (existing) {
          // 2. update credentials
          await this.userRepo.update(existing.id, {
            gitlabClientId: clientId,
            gitlabClientSecret: clientSecret,
            updatedBy: String(existing.id),
            updatedAt: now,
            ...(password ? { password } : {}),
          });
          return resolve(await this.userRepo.findOne({ where: { id: existing.id } }));
        }

        // 3. สร้าง user ใหม่ (ยังไม่มี id → save ก่อน)
        let user = this.userRepo.create({
          username,
          password,
          gitlabClientId: clientId,
          gitlabClientSecret: clientSecret,
          createdAt: now,
          updatedAt: now,
        });

        user = await this.userRepo.save(user);

        // 4. อัพเดท createdBy/updatedBy ด้วย id ที่ได้หลัง save
        await this.userRepo.update(user.id, {
          createdBy: String(user.id),
          updatedBy: String(user.id),
        });

        resolve(await this.userRepo.findOne({ where: { id: user.id } }));
      } catch (error) {
        reject(new InternalServerErrorException('Failed to setup user'));
      }
    })();
  });
}

  // dto
  toResponse(user: any): UserResponseDto {
    // 1. return user response
    return {
      id: user.id,
      gitlabId: user.gitlabId,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  }
}
