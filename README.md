# SPORTPRINT LMS (MVP Demo)

Website LMS cho lĩnh vực **Kỹ thuật In ấn & Kinh doanh Đồ thể thao**.

## Tính năng demo đã có

- Bán khóa học và checkout qua VietQR (mock flow)
- Learning page mobile-first với sidebar chương/bài, custom video player, lưu vị trí xem
- Đánh dấu hoàn thành bài học + hiển thị tiến độ
- Kho tài liệu .CDR/.AI/.PSD theo quyền khóa học đã mua
- Dashboard học viên: khóa học, tiến độ, tài liệu tải, lịch sử giao dịch, thông báo
- Admin panel cơ bản: quản lý khóa học, đơn hàng, thống kê doanh thu
- Mock auth: email/số điện thoại + Google/Facebook (demo)
- Lead Facebook -> khách mua hàng -> QR thanh toán -> cấp tài khoản/mật khẩu
- Ghi log email cấp tài khoản tự động vào bảng `email_delivery_logs`

## Cấu trúc chính

- `src/app/*` các route trang
- `src/components/*` UI components
- `src/contexts/app-context.tsx` state toàn cục (mock)
- `src/lib/mock-data.ts` dữ liệu mẫu LMS
- `docs/solution-overview.md` tài liệu kiến trúc, schema, sitemap, flow

## Chạy dự án

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

## Tài khoản demo

- Vào `/login`, chọn role và đăng nhập mock.
- Để vào Admin, đăng nhập role `admin`.

## Lưu ý MVP

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
   - `POST /api/facebook/leads`: nhận lead Facebook và lưu vào `facebook_leads`.
   - `POST /api/sales/confirm-payment`: xác nhận thanh toán, tạo tài khoản học viên, ghi log email vào `email_delivery_logs`.
   - Trang checkout có nút kéo lead Facebook và cấp tài khoản ngay sau thanh toán.

> Lưu ý: `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng phía server, không để lộ ra client.
