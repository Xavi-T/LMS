# SPORTPRINT LMS

Website LMS cho lĩnh vực **Kỹ thuật In ấn & Kinh doanh Đồ thể thao**.

## Tính năng hiện có

- Bán khóa học và checkout qua VietQR
- Learning page mobile-first với sidebar chương/bài, custom video player, lưu vị trí xem
- Đánh dấu hoàn thành bài học + hiển thị tiến độ
- Kho tài liệu .CDR/.AI/.PSD theo quyền khóa học đã mua
- Dashboard học viên: khóa học, tiến độ, tài liệu tải, lịch sử giao dịch, thông báo
- Admin panel cơ bản: quản lý khóa học, đơn hàng, thống kê doanh thu
- Login chỉ bằng email + mật khẩu
- 1 tài khoản admin để quản lý học viên: tạo/cấp tài khoản, khóa/mở khóa, lấy/reset mật khẩu
- Yêu cầu ghi danh trên web -> thanh toán -> cấp tài khoản/mật khẩu
- Ghi log email cấp tài khoản tự động vào bảng `email_delivery_logs`

## Cấu trúc chính

- `src/app/*` các route trang
- `src/components/*` UI components
- `src/contexts/app-context.tsx` state toàn cục
- `src/lib/mock-data.ts` dữ liệu mẫu LMS
- `docs/solution-overview.md` tài liệu kiến trúc, schema, sitemap, flow

## Chạy dự án

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

## Tài khoản đăng nhập

- Học viên: chỉ đăng nhập bằng email đã đăng ký và mật khẩu đã cấp.
- Admin: thêm vào `.env.local` hoặc dùng mặc định `admin@sportprint.vn / Admin@123456`.

Nếu muốn cấu hình riêng:

```env
ADMIN_EMAIL=admin@sportprint.vn
ADMIN_PASSWORD=Admin@123456
```

Sau đó đăng nhập tại `/login` bằng cặp tài khoản trên.

## Lưu ý triển khai

- Chưa tích hợp backend thật, webhook thanh toán, OAuth thật, upload media/CDN thật.
- Kiến trúc đã tách sẵn để nâng cấp production bằng Prisma + PostgreSQL + storage bảo vệ video.

## Tích hợp Supabase (DB + Storage)

1. Tạo file `.env.local` từ `.env.example` và điền:

```env
NEXT_PUBLIC_SUPABASE_URL=https://qhqacpvcjtupvguamgxa.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_EWNctIfjAQcbo5AC6L76Ag_rbNKZ8XG
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=lms-resources
```

2. Vào Supabase SQL Editor và chạy file `supabase/schema.sql`.

3. Upload file `.CDR/.AI/.PSD` vào bucket `lms-resources` theo path giống `storagePath` trong dữ liệu.

4. Trang `/resources` đã tích hợp gọi API `POST /api/storage/signed-url` để tạo link tải private file (hết hạn sau 5 phút).

5. Sales flow đã thêm:
   - `POST /api/enrollments/request`: ghi nhận yêu cầu mua khóa học trực tiếp trên web.
   - `POST /api/sales/confirm-payment`: xác nhận thanh toán, tạo tài khoản học viên, ghi log email vào `email_delivery_logs`.
   - `POST /api/auth/login`: xác thực học viên/admin để vào dashboard/admin.
   - `GET/POST/PATCH /api/admin/users`: quản lý user từ trang admin.
   - `GET/PATCH/POST /api/admin/approvals`: admin duyệt yêu cầu và cấp tài khoản trực tiếp trên web.

## Tích hợp EmailJS gửi thông báo tài khoản học viên

1. Tạo service Gmail trên EmailJS (Service ID ví dụ: `service_aoom31s`).
2. Tạo template email cấp tài khoản và lấy `Template ID`.
3. Thêm vào `.env.local`:

```env
EMAILJS_SERVICE_ID=service_xxx
EMAILJS_TEMPLATE_ID_ACCOUNT=template_xxx
EMAILJS_PUBLIC_KEY=your_public_key
EMAILJS_PRIVATE_KEY=your_private_key
```

4. Template params cần có (đúng tên):
   - `to_email`
   - `student_name`
   - `course_slug`
   - `login_email`
   - `login_password`
   - `order_ref`
   - `transfer_note`
   - `source`

5. Luồng gửi email đã tích hợp sẵn:
   - Sau xác nhận thanh toán: `POST /api/sales/confirm-payment`
   - Sau admin phê duyệt cấp tài khoản: `POST /api/admin/approvals`

Kết quả gửi sẽ được cập nhật vào bảng `email_delivery_logs` với trạng thái `sent` hoặc `failed`.

## Import dữ liệu vào DB thật (Supabase)

1. Chạy lại SQL mới nhất trong `supabase/schema.sql` (có thêm bảng `course_outcomes`).
2. Đảm bảo `.env.local` có:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Chạy lệnh seed:

```bash
npm run seed:supabase
```

Script sẽ đọc dữ liệu từ `src/lib/mock-data.ts` và upsert vào các bảng:

- `courses`
- `chapters`
- `lessons`
- `course_resources`
- `course_reviews`
- `course_outcomes`

Lưu ý: mỗi lần seed, dữ liệu con của từng khóa học sẽ được xóa và nạp lại để đồng bộ theo dữ liệu hiện tại.

> Lưu ý: `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng phía server, không để lộ ra client.
