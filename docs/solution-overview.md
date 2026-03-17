# Tổng quan giải pháp

## Tech stack đề xuất

- **Frontend + BFF:** Next.js App Router (TypeScript, Tailwind CSS v4)
- **State MVP:** React Context + localStorage (mock auth/payment/progress)
- **Auth Production-ready hướng mở rộng:** NextAuth/Auth.js + OAuth Google/Facebook + OTP phone
- **Database Production-ready hướng mở rộng:** PostgreSQL + Prisma ORM
- **Storage video/tài liệu tương lai:** Bunny.net Stream/CDN hoặc Amazon S3 + CloudFront + signed URL
- **Thanh toán hiện tại:** VietQR transfer flow (mock xác nhận), sẵn kiến trúc webhook auto-activate

## Kiến trúc hệ thống

- **Web App (Next.js):** render landing/course/checkout/dashboard/admin
- **App State Layer:** quản lý user, order, purchased courses, learning progress, video position, downloads
- **Domain Data Layer (mock-data):** courses, chapters, lessons, resources, reviews, notices
- **Security MVP:** kiểm tra quyền tải tài liệu theo khóa học đã mua; role-based view (`admin`, `instructor`, `student`)
- **Mở rộng production:**
  - Tách API route/module service cho `auth`, `courses`, `orders`, `progress`
  - Webhook payment cập nhật `orders.status=paid` -> cấp quyền khóa học
  - Signed URLs cho video/tài liệu để tránh lộ link gốc

## Database schema (đề xuất)

```prisma
model User {
  id          String   @id @default(cuid())
  name        String
  email       String?  @unique
  phone       String?  @unique
  role        Role     @default(STUDENT)
  createdAt   DateTime @default(now())
  enrollments Enrollment[]
  orders      Order[]
  progress    LessonProgress[]
  downloads   ResourceDownload[]
}

model Course {
  id          String    @id @default(cuid())
  slug        String    @unique
  title       String
  category    Category
  price       Int
  thumbnail   String
  description String
  createdAt   DateTime  @default(now())
  chapters    Chapter[]
  resources   Resource[]
  enrollments Enrollment[]
  reviews     Review[]
}

model Chapter {
  id        String   @id @default(cuid())
  courseId  String
  title     String
  position  Int
  course    Course   @relation(fields: [courseId], references: [id])
  lessons   Lesson[]
}

model Lesson {
  id         String   @id @default(cuid())
  chapterId  String
  title      String
  type       LessonType
  videoKey   String?
  content    String?
  position   Int
  chapter    Chapter  @relation(fields: [chapterId], references: [id])
  progress   LessonProgress[]
}

model Enrollment {
  id        String   @id @default(cuid())
  userId    String
  courseId  String
  source    String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  course    Course   @relation(fields: [courseId], references: [id])

  @@unique([userId, courseId])
}

model Order {
  id           String      @id @default(cuid())
  userId       String?
  courseId     String
  amount       Int
  status       OrderStatus @default(PENDING)
  transferNote String      @unique
  couponCode   String?
  createdAt    DateTime    @default(now())
  user         User?       @relation(fields: [userId], references: [id])
}

model LessonProgress {
  id          String   @id @default(cuid())
  userId      String
  lessonId    String
  completed   Boolean  @default(false)
  videoSecond Int      @default(0)
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id])
  lesson      Lesson   @relation(fields: [lessonId], references: [id])

  @@unique([userId, lessonId])
}

model Resource {
  id          String   @id @default(cuid())
  courseId    String
  title       String
  fileType    String
  fileKey     String
  previewUrl  String
  course      Course   @relation(fields: [courseId], references: [id])
}

model ResourceDownload {
  id         String   @id @default(cuid())
  userId     String
  resourceId String
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
}

enum Role {
  ADMIN
  INSTRUCTOR
  STUDENT
}

enum Category {
  IN_AN
  THIET_KE
  KINH_DOANH
}

enum LessonType {
  VIDEO
  TEXT
}

enum OrderStatus {
  PENDING
  PAID
  FAILED
}
```

## Sitemap

- `/` Trang chủ
- `/courses` Danh mục khóa học
- `/courses/[slug]` Chi tiết khóa học
- `/learn/[courseSlug]/[lessonId]` Trang học tập
- `/resources` Kho tài liệu
- `/checkout?course=...` Thanh toán VietQR
- `/dashboard` Dashboard học viên
- `/contact` Liên hệ
- `/admin` Quản trị
- `/login` Đăng nhập / đăng ký

## User flow chính

1. **Khách truy cập** vào trang chủ -> danh mục -> chi tiết khóa học
2. Nhấn **Mua ngay** -> checkout -> tạo đơn với `transferNote` riêng
3. Quét **VietQR** -> xác nhận thanh toán (mock) -> khóa học được kích hoạt
4. Vào **Learning Page** học video/text, đánh dấu hoàn thành, lưu vị trí video tự động
5. Vào **Resources** tải file .CDR/.AI/.PSD nếu đã mua
6. Vào **Dashboard** xem tiến độ, lịch sử giao dịch, tài liệu đã tải
7. **Admin** theo dõi khóa học, học viên, đơn hàng, doanh thu

## Danh sách component

- `SiteHeader`, `SiteFooter`, `AppShell`
- `CourseCard`
- `VideoPlayer` (custom controls, lưu vị trí video, chặn right-click)
- `ProgressBar`
- Các page module: home/courses/course-detail/learn/resources/checkout/dashboard/contact/admin/login

## Những phần đang mock và phần sẵn sàng production

- **Đang mock:** auth social/phone, order payment verify, CMS, dữ liệu khóa học/user
- **Sẵn sàng production concept:** route architecture, role-based view, progress tracking model, VietQR order note strategy, database schema blueprint, scalable storage direction
