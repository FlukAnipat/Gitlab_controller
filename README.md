# GitLab Issue Control System

ระบบจัดการ Project และ Issue ที่พัฒนาขึ้นเพื่อเชื่อมต่อกับ GitLab API โดยรองรับการเข้าสู่ระบบด้วย GitLab OAuth และสามารถจัดการ Project, Issue, Product และ Labels ผ่าน Web Application ได้อย่างครบถ้วน

## Tech Stack
- Frontend: Nuxt.js, Vuetify
- Backend: NestJS, TypeORM
- Database: PostgreSQL
- Authentication: GitLab OAuth, JWT
- Deployment: Docker, Docker Compose

## Features
- Login ด้วย GitLab OAuth
- ดึงข้อมูล Project จาก GitLab
- สร้างและจัดการ Issue
- จัดการ Labels และ Product
- ระบบ Authentication และ Authorization
- REST API และ Web Interface

## Project Structure
```text
Gitlab_project/
├── nestjs-api-issue-control/   # Backend API (NestJS)
└── nuxtjs-issue-control/       # Frontend (Nuxt.js)
