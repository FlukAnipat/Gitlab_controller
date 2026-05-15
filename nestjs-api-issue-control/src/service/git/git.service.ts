import axios from 'axios';
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { UsersService } from '../../modules/users/users.service';
import {
  GitlabIssueLinkResponse,
  GitlabIssueResponse,
  GitlabLabelResponse,
  GitlabProjectMemberResponse,
  GitlabProjectResponse,
  GitlabTokenResponse,
  GitlabTimeStatsResponse,
  GitlabUserResponse,
} from '../../types/gitlab.types';

@Injectable()
export class GitlabService {
  private readonly logger = new Logger(GitlabService.name);
  private readonly gitlabApiUrl = process.env.GITLAB_API_URL;

  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  // Helpers 
  private formatAxiosError(error: any): string {
    // 1. ดึงข้อมูลจาก response.data
    const d = error?.response?.data;
    // 2. ถ้าไม่มี response data ให้ใช้ message หรือ 'Unknown error'
    if (!d) return error?.message || 'Unknown error';
    // 3. พยายามแปลงเป็น string ถ้าเป็น object ให้ JSON.stringify
    try { return typeof d === 'string' ? d : JSON.stringify(d); } catch { return String(d); }
  }

  private authHeader(token: string) {
    // สร้าง HTTP headers สำหรับ GitLab API (Bearer token + JSON content type)
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  private formatDurationFromMinutes(minutes: number): string {
    // 1. แปลงเป็นจำนวนนาที (ป้องกันค่าติดลบ)
    const m = Math.max(0, Number(minutes) || 0);
    // 2. คำนวณชั่วโมงและนาทีที่เหลือ
    const h = Math.floor(m / 60), r = m % 60;
    // 3. จัดรูปแบบการแสดงผล: 2h 30m / 2h / 30m
    if (h > 0 && r > 0) return `${h}h ${r}m`;
    if (h > 0) return `${h}h`;
    return `${r}m`;
  }

  // ขอ access token จาก GitLab ด้วย authorization code
  async getAccessToken(code: string, clientId: string, clientSecret: string): Promise<GitlabTokenResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. เตรียมข้อมูลสำหรับขอ access token
        const params = new URLSearchParams({
          client_id: clientId, client_secret: clientSecret, code,
          grant_type: 'authorization_code', redirect_uri: process.env.GITLAB_REDIRECT_URI,
        });
        
        // 2. ส่ง request ไปที่ GitLab OAuth endpoint
        const res = await axios.post('https://gitlab.com/oauth/token', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        
        // 3. คืนผลลัพธ์ access token
        resolve(res.data);
      } catch (error) {
        this.logger.error(`Failed to get access token: ${this.formatAxiosError(error)}`);
        reject(new Error('Failed to exchange authorization code for access token'));
      }
    });
  }

  // รีเฟรช access token ใหม่จาก refresh token
  async refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<GitlabTokenResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. เตรียมข้อมูลสำหรับรีเฟรช token
        const params = new URLSearchParams({
          client_id: clientId, client_secret: clientSecret,
          refresh_token: refreshToken, grant_type: 'refresh_token',
          redirect_uri: process.env.GITLAB_REDIRECT_URI,
        });
        
        // 2. ส่ง request ไปที่ GitLab OAuth endpoint
        const res = await axios.post('https://gitlab.com/oauth/token', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        
        // 3. คืนผลลัพธ์ access token ใหม่
        resolve(res.data);
      } catch (error) {
        this.logger.error(`Failed to refresh access token: ${this.formatAxiosError(error)}`);
        reject(new Error('Failed to refresh GitLab access token'));
      }
    });
  }

  // revoke GitLab token ตอน logout
  async revokeToken(token: string, clientId: string, clientSecret: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. เตรียมข้อมูลสำหรับ revoke token
        const params = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, token });
        
        // 2. ส่ง request ไปที่ GitLab revoke endpoint
        await axios.post('https://gitlab.com/oauth/revoke', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        
        // 3. คืนผลลัพธ์สำเร็จ
        resolve(true);
      } catch (error) {
        this.logger.error(`Failed to revoke token: ${this.formatAxiosError(error)}`);
        reject(new Error('Failed to revoke GitLab token'));
      }
    });
  }

  // ดึงข้อมูลผู้ใช้จาก GitLab API
  async getUser(accessToken: string): Promise<GitlabUserResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ส่ง request ไปที่ GitLab API เพื่อดึงข้อมูลผู้ใช้
        const res = await axios.get(`${this.gitlabApiUrl}/user`, { headers: this.authHeader(accessToken) });
        // 2. คืนผลลัพธ์ข้อมูลผู้ใช้
        resolve(res.data);
      } catch (error) {
        // 3. จัดการ error และ log ข้อความ
        const msg = this.formatAxiosError(error);
        this.logger.error(`Failed to get user data: ${msg}`);
        reject(new Error(`Failed to fetch user data from GitLab: ${msg}`));
      }
    });
  }

  // ดึงรายการ repositories ที่ผู้ใช้เป็นสมาชิกจาก GitLab
  async getUserRepositories(accessToken: string): Promise<GitlabProjectResponse[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ส่ง request ไปที่ GitLab API เพื่อดึงรายการ projects ที่ผู้ใช้เป็นสมาชิก
        const res = await axios.get(`${this.gitlabApiUrl}/projects?membership=true&per_page=50`, {
          headers: this.authHeader(accessToken),
        });
        // 2. คืนผลลัพธ์รายการ repositories
        resolve(res.data);
      } catch (error) {
        // 3. จัดการ error และ log ข้อความ
        this.logger.error(`Failed to get user repositories: ${this.formatAxiosError(error)}`);
        reject(new Error('Failed to fetch user repositories from GitLab'));
      }
    });
  }

  // ดึงรายการ repositories สำหรับผู้ใช้ด้วย userId พร้อมการจัดการ token
  async getRepositoriesForUser(userId: number): Promise<GitlabProjectResponse[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ดึงข้อมูลผู้ใช้และตรวจสอบ access token
        const user = await this.usersService.findById(userId);
        if (!user?.accessToken) { reject(new Error('User not found or no access token')); return; }
        let accessToken = user.accessToken;
        // 2. ตรวจสอบความถูกต้องของ token และ refresh ถ้าจำเป็น
        try { await this.getUser(accessToken); } catch {
          if (!user.refreshToken) { reject(new Error('No refresh token available')); return; }
          const newTokens = await this.refreshAccessToken(user.refreshToken, user.gitlabClientId, user.gitlabClientSecret);
          await this.usersService.updateGitlabTokens(userId, newTokens.access_token, newTokens.refresh_token || user.refreshToken, newTokens.expires_in);
          accessToken = newTokens.access_token;
        }
        // 3. ดึงรายการ repositories และคืนผลลัพธ์
        const res = await axios.get(`${this.gitlabApiUrl}/projects?membership=true&per_page=50`, {
          headers: this.authHeader(accessToken),
        });
        resolve(res.data);
      } catch (error) {
        reject(new Error(`Failed to get repositories for user: ${error.message}`));
      }
    });
  }
  
  // ดึงรายการสมาชิกทั้งหมดของ GitLab project
  async getProjectMembers(projectId: number, accessToken: string): Promise<GitlabProjectMemberResponse[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ส่ง request ไปที่ GitLab API เพื่อดึงรายการสมาชิกทั้งหมด
        const res = await axios.get(`${this.gitlabApiUrl}/projects/${projectId}/members/all`, {
          params: { per_page: 100 }, headers: this.authHeader(accessToken),
        });
        // 2. ตรวจสอบและจัดรูปแบบข้อมูลให้เป็น array
        resolve(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        // 3. จัดการ error และ log ข้อความ
        this.logger.error(`Failed to get project members: ${this.formatAxiosError(error)}`);
        reject(new Error(`Failed to fetch GitLab project members: ${error.response?.data?.message || error.message}`));
      }
    });
  }

  // ค้นหาสมาชิกของ project ด้วย username
  async getProjectMemberByUsername(projectId: number, username: string, accessToken: string): Promise<GitlabProjectMemberResponse | null> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ทำให้ username เป็นตัวพิมพ์เล็กและตัดช่องว่าง
        const normalized = String(username || '').trim().toLowerCase();
        if (!normalized) { resolve(null); return; }
        // 2. ดึงรายการสมาชิกทั้งหมดและค้นหาตาม username
        const members = await this.getProjectMembers(projectId, accessToken);
        const foundMember = members.find((m) => String(m?.username || '').toLowerCase() === normalized);
        // 3. คืนผลลัพธ์สมาชิกที่พบ หรือ null ถ้าไม่พบ
        resolve(foundMember || null);
      } catch (error) {
        reject(new Error(`Failed to find project member by username: ${error.message}`));
      }
    });
  }

  // ดึงรายการสมาชิกของ project สำหรับผู้ใช้ด้วย userId พร้อมการจัดการ token
  async getProjectMembersForUser(projectId: number, userId: number): Promise<GitlabProjectMemberResponse[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ดึงข้อมูลผู้ใช้และตรวจสอบ access token
        const user = await this.usersService.findById(userId);
        if (!user?.accessToken) { reject(new Error('User not found or no access token')); return; }
        let accessToken = user.accessToken;
        // 2. ตรวจสอบความถูกต้องของ token และ refresh ถ้าจำเป็น
        try { await this.getUser(accessToken); } catch {
          if (!user.refreshToken) { reject(new Error('No refresh token available')); return; }
          const newTokens = await this.refreshAccessToken(user.refreshToken, user.gitlabClientId, user.gitlabClientSecret);
          await this.usersService.updateGitlabTokens(userId, newTokens.access_token, newTokens.refresh_token || user.refreshToken, newTokens.expires_in);
          accessToken = newTokens.access_token;
        }
        // 3. ดึงรายการสมาชิกของ project และคืนผลลัพธ์
        const members = await this.getProjectMembers(projectId, accessToken);
        resolve(members);
      } catch (error) {
        reject(new Error(`Failed to get project members for user: ${error.message}`));
      }
    });
  }

  // ดึงข้อมูล issue จาก GitLab project
  async getProjectIssue(projectId: number, issueIid: number, accessToken: string): Promise<GitlabIssueResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ส่ง request ไปที่ GitLab API เพื่อดึงข้อมูล issue
        const res = await axios.get(`${this.gitlabApiUrl}/projects/${projectId}/issues/${issueIid}`, {
          headers: this.authHeader(accessToken),
        });
        // 2. คืนผลลัพธ์ข้อมูล issue
        resolve(res.data);
      } catch (error) {
        // 3. จัดการ error และ log ข้อความ
        this.logger.error(`Failed to get project issue: ${this.formatAxiosError(error)}`);
        reject(new Error(`Failed to get project issue: ${error.message}`));
      }
    });
  }

  // ดึงรายการ issues ทั้งหมดจาก GitLab project
  async getProjectIssues(projectId: number, accessToken: string): Promise<GitlabIssueResponse[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ส่ง request ไปที่ GitLab API เพื่อดึงรายการ issues ทั้งหมด
        const res = await axios.get(`${this.gitlabApiUrl}/projects/${projectId}/issues`, {
          headers: this.authHeader(accessToken),
        });
        // 2. คืนผลลัพธ์รายการ issues
        resolve(res.data);
      } catch (error) {
        // 3. จัดการ error และ log ข้อความ
        this.logger.error(`Failed to get project issues: ${this.formatAxiosError(error)}`);
        reject(new Error(`Failed to get project issues: ${error.response?.data?.message || error.message}`));
      }
    });
  }

  // ปิด issue ใน GitLab project
  async closeIssue(projectId: number, issueIid: number, accessToken: string): Promise<GitlabIssueResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ส่ง request ไปที่ GitLab API เพื่อปิด issue
        const res = await axios.put(`${this.gitlabApiUrl}/projects/${projectId}/issues/${issueIid}`,
          { state_event: 'close' }, { headers: this.authHeader(accessToken) });
        // 2. log การปิด issue
        this.logger.log(`Issue ${issueIid} closed in project ${projectId}`);
        // 3. คืนผลลัพธ์ข้อมูล issue ที่ถูกปิด
        resolve(res.data);
      } catch (error) {
        this.logger.error(`Failed to close issue ${issueIid}: ${this.formatAxiosError(error)}`);
        reject(new Error(`Failed to close GitLab issue: ${error.response?.data?.message || error.message}`));
      }
    });
  }

  // เปิด issue ที่ถูกปิดไว้ใน GitLab project
  async reopenIssue(projectId: number, issueIid: number, accessToken: string): Promise<GitlabIssueResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ส่ง request ไปที่ GitLab API เพื่อเปิด issue ที่ถูกปิด
        const res = await axios.put(`${this.gitlabApiUrl}/projects/${projectId}/issues/${issueIid}`,
          { state_event: 'reopen' }, { headers: this.authHeader(accessToken) });
        // 2. log การเปิด issue ซ้ำ
        this.logger.log(`Issue ${issueIid} reopened in project ${projectId}`);
        // 3. คืนผลลัพธ์ข้อมูล issue ที่ถูกเปิด
        resolve(res.data);
      } catch (error) {
        this.logger.error(`Failed to reopen issue ${issueIid}: ${this.formatAxiosError(error)}`);
        reject(new Error(`Failed to reopen GitLab issue: ${error.response?.data?.message || error.message}`));
      }
    });
  }

  // สร้าง issue ใหม่ใน GitLab project
  async createProjectIssue(
    projectId: number,
    issueData: { title: string; description?: string; labels?: string[]; assigneeId?: number; assigneeUsername?: string; dueDate?: string | null; startDate?: string | null; },
    accessToken: string,
  ): Promise<GitlabIssueResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. เตรียมข้อมูลสำหรับสร้าง issue
        const body: any = {
          title: issueData.title,
          description: issueData.description || '',
          labels: issueData.labels || [],
        };
        // 2. เพิ่มข้อมูลเพิ่มเติม (due date, assignee)
        if (issueData.dueDate !== undefined) body.due_date = issueData.dueDate || null;
        if (issueData.assigneeId) {
          body.assignee_ids = [issueData.assigneeId];
        } else if (issueData.assigneeUsername) {
          const user = await this.getProjectMemberByUsername(projectId, issueData.assigneeUsername, accessToken);
          if (!user) { reject(new Error(`Assignee ${issueData.assigneeUsername} is not a member of this GitLab project`)); return; }
          body.assignee_ids = [user.id];
        }
        // 3. ส่ง request สร้าง issue และคืนผลลัพธ์
        const res = await axios.post(`${this.gitlabApiUrl}/projects/${projectId}/issues`, body, {
          headers: this.authHeader(accessToken),
        });
        this.logger.log(`Issue created in project ${projectId}`);
        resolve(res.data);
      } catch (error) {
        this.logger.error(`Failed to create issue in project ${projectId}: ${this.formatAxiosError(error)}`);
        reject(new Error(`Failed to create GitLab issue: ${error.response?.data?.message || error.message}`));
      }
    });
  }

  // อัปเดตข้อมูล issue ใน GitLab project
  async updateProjectIssue(
    projectId: number, issueIid: number,
    issueData: { title?: string; description?: string; labels?: string[]; assigneeUsername?: string | null; state?: string; dueDate?: string | null; startDate?: string | null; milestone?: string | null; },
    accessToken: string,
  ): Promise<GitlabIssueResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ดึงข้อมูล issue ปัจจุบันและเตรียมข้อมูลสำหรับอัปเดต
        const current = await this.getProjectIssue(projectId, issueIid, accessToken);
        const body: any = {};
        // 2. ตั้งค่าฟิลด์ที่ต้องการอัปเดต
        if (issueData.title !== undefined) body.title = issueData.title;
        if (issueData.description !== undefined) body.description = issueData.description || '';
        if (issueData.labels !== undefined) body.labels = Array.isArray(issueData.labels) ? issueData.labels.join(',') : issueData.labels;
        if (issueData.dueDate !== undefined) body.due_date = issueData.dueDate || null;
        if (issueData.startDate !== undefined) body.start_date = issueData.startDate || null;
        if (issueData.milestone !== undefined) {
          if (issueData.milestone) {
            const milestones = await this.getProjectMilestones(projectId, accessToken);
            const found = milestones.find((m: any) => m.title === issueData.milestone);
            body.milestone_id = found?.id ?? 0;
          } else { body.milestone_id = 0; }
        }
        if (issueData.assigneeUsername !== undefined) {
          if (issueData.assigneeUsername) {
            const user = await this.getProjectMemberByUsername(projectId, issueData.assigneeUsername, accessToken);
            if (!user) { reject(new Error(`Assignee ${issueData.assigneeUsername} is not a member of this GitLab project`)); return; }
            body.assignee_ids = [user.id];
          } else { body.assignee_ids = []; }
        }
        if (issueData.state === 'closed' && current?.state !== 'closed') body.state_event = 'close';
        else if (issueData.state === 'opened' && current?.state !== 'opened') body.state_event = 'reopen';
        // 3. ส่ง request อัปเดต issue และคืนผลลัพธ์
        await axios.put(`${this.gitlabApiUrl}/projects/${projectId}/issues/${issueIid}`, body, {
          headers: this.authHeader(accessToken),
        });
        const updated = await this.getProjectIssue(projectId, issueIid, accessToken);
        this.logger.log(`Issue ${issueIid} updated in project ${projectId}`);
        resolve(updated);
      } catch (error) {
        this.logger.error(`Failed to update issue ${issueIid} in project ${projectId}: ${this.formatAxiosError(error)}`);
        reject(new Error(`Failed to update GitLab issue: ${error.response?.data?.message || error.message}`));
      }
    });
  }

  // ตั้งค่าเวลาประเมินสำหรับ issue ใน GitLab
  async setIssueTimeEstimate(projectId: number, issueIid: number, minutes: number, accessToken: string): Promise<GitlabTimeStatsResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. สร้าง URL สำหรับ issue
        const url = `${this.gitlabApiUrl}/projects/${projectId}/issues/${issueIid}`;
        // 2. ถ้าเวลาเป็น 0 หรือติดลบ ให้ reset time estimate
        if ((Number(minutes) || 0) <= 0) {
          const res = await axios.post(`${url}/reset_time_estimate`, null, { headers: this.authHeader(accessToken) });
          resolve(res.data); return;
        }
        // 3. ตั้งค่า time estimate และคืนผลลัพธ์
        const res = await axios.post(`${url}/time_estimate`, null, {
          params: { duration: this.formatDurationFromMinutes(minutes) },
          headers: this.authHeader(accessToken),
        });
        resolve(res.data);
      } catch (error) {
        this.logger.error(`Failed to set time estimate: ${this.formatAxiosError(error)}`);
        reject(new Error(`Failed to set GitLab issue time estimate: ${error.response?.data?.message || error.message}`));
      }
    });
  }

  // ตั้งค่าเวลาที่ใช้จริงสำหรับ issue ใน GitLab
  async setIssueSpentTime(projectId: number, issueIid: number, minutes: number, accessToken: string, summary?: string): Promise<GitlabTimeStatsResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. สร้าง URL สำหรับ issue และ reset spent time เก่า
        const url = `${this.gitlabApiUrl}/projects/${projectId}/issues/${issueIid}`;
        await axios.post(`${url}/reset_spent_time`, null, { headers: this.authHeader(accessToken) });
        // 2. ถ้าเวลาเป็น 0 หรือติดลบ ให้คืนข้อมูล time stats ปัจจุบัน
        if ((Number(minutes) || 0) <= 0) {
          const res = await axios.get(`${url}/time_stats`, { headers: this.authHeader(accessToken) });
          resolve(res.data); return;
        }
        // 3. เพิ่ม spent time ใหม่และคืนผลลัพธ์
        const params: any = { duration: this.formatDurationFromMinutes(minutes) };
        if (summary) params.summary = summary;
        const res = await axios.post(`${url}/add_spent_time`, null, { params, headers: this.authHeader(accessToken) });
        resolve(res.data);
      } catch (error) {
        this.logger.error(`Failed to set spent time: ${this.formatAxiosError(error)}`);
        reject(new Error(`Failed to set GitLab issue spent time: ${error.response?.data?.message || error.message}`));
      }
    });
  }

  // สร้างลิงก์เชื่อมโยงระหว่าง issues ใน GitLab (รองรับ cross-project link)
  async createIssueLink(
    sourceProjectId: number,
    sourceIssueIid: number,
    targetIssueIid: number,
    accessToken: string,
    targetProjectId?: number,
  ): Promise<GitlabIssueLinkResponse | null> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. เตรียม request body
        // GitLab ต้องการ target_project_id เสมอถ้า cross-project
        // ถ้า same project ส่ง sourceProjectId ไปเลย GitLab จะจัดการเอง
        const effectiveTargetProjectId = targetProjectId || sourceProjectId;
        const body: any = {
          target_project_id: effectiveTargetProjectId,
          target_issue_iid: targetIssueIid,
          link_type: 'relates_to',
        };
        // 3. ยิง POST ไปที่ source project issue
        const res = await axios.post(
          `${this.gitlabApiUrl}/projects/${sourceProjectId}/issues/${sourceIssueIid}/links`,
          body,
          { headers: this.authHeader(accessToken) },
        );
        // 4. คืนผลลัพธ์ข้อมูลลิงก์ที่สร้าง
        resolve(res.data);
      } catch (error) {
        // 5. ถ้ามีการเชื่อมโยงอยู่แล้วให้คืน null ไม่ใช่ throw
        const message = error.response?.data?.message || error.message;
        if (String(message).toLowerCase().includes('already linked')) { resolve(null); return; }
        this.logger.error(`Failed to create issue link: ${this.formatAxiosError(error)}`);
        reject(new Error(`Failed to create GitLab issue link: ${message}`));
      }
    });
  }

  // ดึงรายการลิงก์เชื่อมโยงทั้งหมดของ issue ใน GitLab
  async getIssueLinks(projectId: number, issueIid: number, accessToken: string): Promise<GitlabIssueLinkResponse[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ส่ง request ไปที่ GitLab API เพื่อดึงรายการลิงก์ทั้งหมด
        const res = await axios.get(`${this.gitlabApiUrl}/projects/${projectId}/issues/${issueIid}/links`, {
          headers: this.authHeader(accessToken),
        });
        // 2. คืนผลลัพธ์รายการลิงก์
        resolve(res.data);
      } catch (error) {
        // 3. จัดการ error และ log ข้อความ
        this.logger.error(`Failed to get issue links: ${this.formatAxiosError(error)}`);
        reject(new Error(`Failed to get GitLab issue links: ${error.response?.data?.message || error.message}`));
      }
    });
  }

  // ลบลิงก์เชื่อมโยงของ issue ใน GitLab
  async deleteIssueLink(projectId: number, issueIid: number, issueLinkId: number, accessToken: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ส่ง request ไปที่ GitLab API เพื่อลบลิงก์
        await axios.delete(`${this.gitlabApiUrl}/projects/${projectId}/issues/${issueIid}/links/${issueLinkId}`, {
          headers: this.authHeader(accessToken),
        });
        // 2. คืนผลลัพธ์สำเร็จ
        resolve(true);
      } catch (error) {
        // 3. จัดการ error และ log ข้อความ
        this.logger.error(`Failed to delete issue link: ${this.formatAxiosError(error)}`);
        reject(new Error(`Failed to delete GitLab issue link: ${error.response?.data?.message || error.message}`));
      }
    });
  }

  // สร้าง label ใหม่ใน GitLab project
  async createLabelInGitlab(accessToken: string, projectId: number, name: string, color: string): Promise<GitlabLabelResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ส่ง request ไปที่ GitLab API เพื่อสร้าง label
        const res = await axios.post(`${this.gitlabApiUrl}/projects/${projectId}/labels`, { name, color }, {
          headers: this.authHeader(accessToken),
        });
        // 2. คืนผลลัพธ์ข้อมูล label ที่สร้าง
        resolve(res.data);
      } catch (error) {
        // 3. จัดการ error และ log ข้อความ
        this.logger.error(`Failed to create label: ${this.formatAxiosError(error)}`);
        reject(new Error(`Failed to create label: ${error.message}`));
      }
    });
  }

  // อัปเดตข้อมูล label ใน GitLab project
  async updateLabelInGitlab(accessToken: string, projectId: number, currentName: string, newName?: string, color?: string): Promise<GitlabLabelResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ค้นหา label ที่ต้องการอัปเดต
        const labelsRes = await axios.get(`${this.gitlabApiUrl}/projects/${projectId}/labels`, { headers: this.authHeader(accessToken) });
        const labels = Array.isArray(labelsRes.data) ? labelsRes.data : [];
        const matchedLabel = labels.find((label: any) =>
          String(label?.name || '').trim().toLowerCase() === String(currentName || '').trim().toLowerCase()
        );
        // 2. ถ้าไม่พบ label ให้สร้างใหม่
        if (!matchedLabel) {
          const fallbackName = newName || currentName;
          const fallbackColor = color || '#9E9E9E';
          const createdLabel = await this.createLabelInGitlab(accessToken, projectId, fallbackName, fallbackColor);
          resolve(createdLabel); return;
        }
        // 3. เตรียมข้อมูลสำหรับอัปเดตและส่ง request
        const body: any = { name: matchedLabel.name };
        if (newName && newName !== matchedLabel.name) body.new_name = newName;
        if (color) body.color = color;
        const res = await axios.put(`${this.gitlabApiUrl}/projects/${projectId}/labels`, body, {
          headers: this.authHeader(accessToken),
        });
        resolve(res.data);
      } catch (error) {
        this.logger.error(`Failed to update label: ${this.formatAxiosError(error)}`);
        reject(new Error(`Failed to update label: ${error.message}`));
      }
    });
  }

  // ลบ label ใน GitLab project
  async deleteLabelInGitlab(accessToken: string, projectId: number, labelName: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ส่ง request ไปที่ GitLab API เพื่อลบ label
        await axios.delete(`${this.gitlabApiUrl}/projects/${projectId}/labels?name=${encodeURIComponent(labelName)}`, {
          headers: this.authHeader(accessToken),
        });
        // 2. คืนผลลัพธ์สำเร็จ
        resolve(true);
      } catch (error) {
        const status = error?.response?.status;
        const message = String(error?.response?.data?.message || error?.message || '').toLowerCase();
        if (status === 404 || message.includes('not found')) {
          resolve(true);
          return;
        }
        // 3. จัดการ error และ log ข้อความ
        this.logger.error(`Failed to delete label: ${this.formatAxiosError(error)}`);
        reject(new Error(`Failed to delete label: ${error.message}`));
      }
    });
  }

  // ดึงรายการ labels ทั้งหมดจาก GitLab project
  async getProjectLabels(projectId: number, accessToken: string): Promise<GitlabLabelResponse[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ส่ง request ไปที่ GitLab API เพื่อดึงรายการ labels ทั้งหมด
        const res = await axios.get(`${this.gitlabApiUrl}/projects/${projectId}/labels`, {
          headers: this.authHeader(accessToken),
        });
        // 2. คืนผลลัพธ์รายการ labels
        resolve(res.data);
      } catch (error) {
        // 3. จัดการ error และ log ข้อความ
        this.logger.error(`Failed to get project labels: ${this.formatAxiosError(error)}`);
        reject(new Error(`Failed to get project labels: ${error.response?.data?.message || error.message}`));
      }
    });
  }

  // อัปโหลดไฟล์/รูปภาพไปยัง GitLab project uploads
  // GitLab API คืน: { alt, url, full_path, markdown }
  async uploadProjectFile(
    projectId: number,
    file: { buffer: Buffer; originalname: string; mimetype: string },
    accessToken: string,
  ): Promise<{ url: string; markdown: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. เตรียม FormData
        const FormData = require('form-data');
        const form = new FormData();
        form.append('file', file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });

        // 2. upload ไปที่ GitLab
        const res = await axios.post(
          `${this.gitlabApiUrl}/projects/${projectId}/uploads`,
          form,
          { headers: { ...form.getHeaders(), Authorization: `Bearer ${accessToken}` } },
        );

        // 3. GitLab คืน { alt, url, full_path, markdown }
        //    url อาจเป็น "/uploads/hash/file.png" หรือ "/namespace/repo/uploads/hash/file.png"
        const data = res.data;
        const rawUrl: string = data.url || data.full_path || '';

        // 4. สร้าง absolute URL ด้วย format ที่ GitLab รองรับ:
        //    https://gitlab.com/-/project/{gitlabProjectId}/uploads/{hash}/file.png
        //    ดึงเอาเฉพาะส่วน /uploads/hash/file.png หลังเสมอ เพราะ GitLab
        //    อาจคืน path แบบ /namespace/repo/uploads/... หรือ /uploads/... ก็ได้
        const gitlabHost = (process.env.GITLAB_URL || 'https://gitlab.com').replace(/\/$/, '');

        // หา /uploads/hash/file.png จากทุก format
        const uploadsMatch = rawUrl.match(/(\/uploads\/[^?#]+)/);
        const uploadsPath  = uploadsMatch ? uploadsMatch[1] : rawUrl;

        const absoluteUrl = `${gitlabHost}/-/project/${projectId}${uploadsPath}`;
        const markdown: string = `![${data.alt || file.originalname}](${absoluteUrl})`;

        this.logger.log(`File uploaded to project ${projectId}: ${absoluteUrl}`);

        resolve({
          url: absoluteUrl,  // https://gitlab.com/-/project/81507040/uploads/hash/file.png
          markdown,
        });
      } catch (error) {
        this.logger.error(`Failed to upload file to project ${projectId}: ${this.formatAxiosError(error)}`);
        reject(new Error(`Failed to upload file: ${error.response?.data?.message || error.message}`));
      }
    });
  }

  // ดึงรายการ milestones ที่กำลังใช้งานอยู่จาก GitLab project
  async getProjectMilestones(projectId: number, accessToken: string): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. ส่ง request ไปที่ GitLab API เพื่อดึงรายการ milestones ที่ active
        const res = await axios.get(`${this.gitlabApiUrl}/projects/${projectId}/milestones`, {
          params: { state: 'active' }, headers: this.authHeader(accessToken),
        });
        // 2. คืนผลลัพธ์รายการ milestones
        resolve(res.data);
      } catch (error) {
        // 3. จัดการ error และ log ข้อความ
        this.logger.error(`Failed to get milestones: ${this.formatAxiosError(error)}`);
        reject(new Error(`Failed to get milestones: ${error.message}`));
      }
    });
  }

  // สร้าง milestone ใหม่ใน GitLab project
  async createMilestone(projectId: number, title: string, accessToken: string, options?: { description?: string; dueDate?: string; startDate?: string; }): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. เตรียมข้อมูลสำหรับสร้าง milestone
        const body: any = { title, description: options?.description || '' };
        // 2. เพิ่มข้อมูลเพิ่มเติม (due date, start date)
        if (options?.dueDate)   body.due_date   = options.dueDate;
        if (options?.startDate) body.start_date = options.startDate;
        // 3. ส่ง request สร้าง milestone และคืนผลลัพธ์
        const res = await axios.post(`${this.gitlabApiUrl}/projects/${projectId}/milestones`, body, {
          headers: this.authHeader(accessToken),
        });
        resolve(res.data);
      } catch (error) {
        this.logger.error(`Failed to create milestone: ${this.formatAxiosError(error)}`);
        reject(new Error(`Failed to create milestone: ${error.message}`));
      }
    });
  }
}
