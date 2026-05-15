j# Product Module

## ภาพรวม
Product Module สำหรับจัดการข้อมูลสินค้า/ผลิตภัณฑ์ในระบบ พร้อมการเชื่อมต่อกับ GitLab Issues

## 🚀 ฟีเจอร์หลัก

### CRUD Operations
- ✅ **สร้าง** (Create) - สร้าง product ใหม่พร้อม user tracking
- ✅ **อ่าน** (Read) - ดึงข้อมูล product พร้อม filtering options
- ✅ **อัพเดท** (Update) - แก้ไขข้อมูล product
- ✅ **ลบ** (Delete) - Soft delete พร้อม audit trail

### ฟีเจอร์เพิ่มเติม
- 🔄 **Restore** - คืนข้อมูลที่ถูกลบ
- 📁 **Project filtering** - ดึง products ตาม project ID
- 🔗 **GitLab integration** - ค้นหาตาม GitLab issue ID
- 👤 **User tracking** - บันทึก createdBy/updatedBy อัตโนมัติ
- 🗑️ **Soft delete** - เก็บประวัติการลบข้อมูล

## 📡 API Endpoints

### Base CRUD (จาก @nestjsx/crud)
```
GET    /product              - ดึงข้อมูล products ทั้งหมด
GET    /product/:id          - ดึงข้อมูล product ตาม ID
POST   /product              - สร้าง product ใหม่
PUT    /product/:id          - อัพเดท product
DELETE /product/:id          - Soft delete product
```

### Custom Endpoints
```
GET /product/project/:projectId      - ดึง products ตาม project
GET /product/gitlab/:gitlabIssueId   - ดึง product ตาม GitLab issue ID
PUT /product/:id/restore             - คืน product ที่ถูกลบ
```

##  ตัวอย่างการใช้งาน

### สร้าง Product
```bash
POST /product
{
  "name": "New Product",
  "description": "รายละเอียดสินค้า",
  "projectId": 1,
  "gitlabIssueId": 123,
  "labels": ["feature", "backend"]
}
```

### ดึง Products ตาม Project
```bash
GET /product/project/1
```

### อัพเดท Product
```bash
PUT /product/1
{
  "name": "Updated Product Name",
  "state": "in_progress"
}
```

## 🔐 ความปลอดภัย
- ทุก endpoints ต้องมี JWT authentication
- ดึง user ID จาก JWT token อัตโนมัติ
- Soft delete เพื่อรักษาความสมบูรณ์ของข้อมูล
- Audit trail บันทึกว่าใครสร้าง/อัพเดท/ลบ

## 📁 โครงสร้างไฟล์
```
src/modules/product/
├── dto/
│   ├── create-product.dto.ts    # DTO สำหรับสร้าง
│   └── update-product.dto.ts    # DTO สำหรับอัพเดท
├── product.controller.ts        # Controller
├── product.service.ts          # Service
├── product.entity.ts          # Entity
├── product.module.ts          # Module
└── README.md                 # เอกสารนี้
```
  issueType?: string;            // Issue type (default: 'product')
  state?: string;                // Product state
  webUrl?: string;               // GitLab web URL
  confidential?: boolean;         // Confidential flag
  locked?: boolean;              // Locked flag
  milestone?: string;            // Milestone
  labels?: string[];             // Labels array
  authorName?: string;           // Author name
  authorUsername?: string;        // Author username
  assigneeName?: string;         // Assignee name
  assigneeUsername?: string;    // Assignee username
  closedAt?: Date;              // Closed date
  dueDate?: Date;               // Due date
  startDate?: Date;             // Start date
  timeEstimate?: number;         // Time estimate
  timeSpent?: number;           // Time spent
  weight?: number;              // Weight
  createdAt: Date;              // Created timestamp
  updatedAt: Date;              // Updated timestamp
  createdBy?: number;           // Created by user ID
  updatedBy?: number;           // Updated by user ID
  deletedAt?: Date;             // Soft delete timestamp
  deleteBy?: number;            // Deleted by user ID
}
```

## Usage Examples

### Create a Product
```typescript
POST /product
{
  "name": "New Product",
  "description": "Product description",
  "projectId": 1,
  "gitlabIssueId": 123,
  "labels": ["feature", "backend"]
}
```

### Get Products by Project
```typescript
GET /product/project/1
```

### Get Product by GitLab Issue ID
```typescript
GET /product/gitlab/123
```

### Update a Product
```typescript
PUT /product/1
{
  "name": "Updated Product Name",
  "state": "in_progress"
}
```

### Restore a Deleted Product
```typescript
PUT /product/1/restore
```

## Security
- All endpoints require JWT authentication
- User ID is automatically extracted from JWT token
- Soft delete maintains data integrity
- Audit trail tracks who created/updated/deleted records

## Validation
- `name` field is required
- All optional fields have proper type validation
- Date fields accept ISO date format
- Boolean fields accept true/false values
- Array fields accept string arrays

## Relationships
- **Project**: Many-to-One relationship with Project entity
- **User**: Implicit relationship through createdBy/updatedBy fields

## Testing
The module includes comprehensive unit tests:
- Controller tests for all endpoints
- Service tests for business logic
- Mock implementations for repository operations
- Error handling validation

Run tests with:
```bash
npm test -- --testPathPattern=product
```

## Integration
- Uses TypeORM for database operations
- Integrates with GitLab API through issue IDs
- Follows established patterns from Project module
- Compatible with existing authentication system
