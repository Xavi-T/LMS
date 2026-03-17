import Link from "next/link";
import { Download } from "lucide-react";

const packages = [
  {
    name: "Gói Cơ bản",
    content: "Video hướng dẫn Corel + In chuyển nhiệt cơ bản",
    price: 1490000,
  },
  {
    name: "Gói Thực chiến",
    content: "Toàn bộ kỹ thuật in + Decal + File Vector mẫu + Nguồn hàng",
    price: 2990000,
  },
  {
    name: "Gói Mentor",
    content: "Gói Thực chiến + 1 tháng hỗ trợ kỹ thuật qua Ultraview/Zalo",
    price: 5500000,
  },
  {
    name: "Gói Truyền nghề",
    content: "Học trực tiếp tại xưởng + Hướng dẫn mở shop từ A-Z",
    price: 12000000,
  },
];

const modules = [
  {
    title: "Module 1: Nhập môn & Thiết kế (Nền tảng quan trọng nhất)",
    lessons: [
      "Bài 1: Tổng quan các công nghệ in phổ biến hiện nay (In chuyển nhiệt, decal, in PET). Ưu và nhược điểm của từng loại trên vải thun lạnh, mè.",
      "Bài 2: Hướng dẫn sử dụng Corel/Photoshop cơ bản để dàn trang áo bóng đá, chỉnh sửa logo CLB, font số.",
      "Bài 3: Cách tách màu, bù màu để bản in lên áo sắc nét, không bị nhòe.",
    ],
  },
  {
    title: "Module 2: Kỹ thuật In Chuyển Nhiệt (Heat Transfer)",
    lessons: [
      "Bài 4: Cách chọn giấy in chuyển nhiệt và mực in không gây tắc đầu phun.",
      "Bài 5: Thực hành: Cài đặt nhiệt độ và thời gian ép chuẩn cho từng loại vải (vải sáng màu vs vải tối màu).",
      "Bài 6: Bí quyết xử lý lỗi: Áo bị bóng vải, bị nhiễm màu từ hình in cũ, hoặc hình in bị mờ.",
      "Bài: Thiết kế và in cờ lưu niệm.",
    ],
  },
  {
    title: "Module 3: Kỹ thuật In Decal & Số Áo (Decal Vinyl)",
    lessons: [
      "Bài 7: Hướng dẫn sử dụng máy cắt Decal (cài đặt lực cắt, tốc độ cắt cho decal phản quang, decal 7 màu).",
      "Bài 8: Kỹ thuật lột decal nhanh và cách ép số áo không bao giờ bong tróc sau khi giặt.",
      "Bài 9: Cách phối hợp giữa in chuyển nhiệt (thân áo) và ép decal (logo, số) để tối ưu chi phí.",
      "Bài: Khắc phục sửa lỗi khi in sai decal.",
    ],
  },
  {
    title: "Module 4: Kinh doanh & Vận hành Shop Sport",
    lessons: [
      "Bài 10: Tìm nguồn hàng phôi áo bóng đá, phụ kiện và vật tư giá sỉ tốt nhất.",
      "Bài 11: Cách tính giá thành một bộ đồ sau khi in và chiến lược định giá bán lẻ/bán đội.",
      "Bài 12: Quy trình nhận đơn: Từ lúc khách gửi mẫu -> Thiết kế -> In ấn -> Đóng gói giao hàng.",
      "Bài 13: Tạo Fanpage, quản lý và cách đăng bài viết.",
      "Bài 14: Sử dụng công cụ AI miễn phí để thiết kế logo.",
      "Bài 15: Marketing xây dựng thương hiệu cửa hàng tại địa phương.",
      "Bài 16: Cách nhập hàng tối ưu chi phí nhất cho người mới bắt đầu.",
    ],
  },
];

const scriptRows = [
  {
    time: "00:00 - 01:00",
    content: "Mở đầu: Nêu vấn đề áo bị cháy hoặc hình mờ do sai nhiệt độ.",
    visual: "Quay cận cảnh một chiếc áo bị hỏng để tạo sự chú ý.",
  },
  {
    time: "01:00 - 03:00",
    content:
      "Lý thuyết: Giải thích tại sao 180°C - 200°C là khoảng nhiệt an toàn.",
    visual: "Hiện bảng thông số nhiệt độ/thời gian trên màn hình.",
  },
  {
    time: "03:00 - 07:00",
    content:
      "Thực hành: Thao tác trực tiếp trên máy ép nhiệt. Cách đặt giấy, cách vuốt áo phẳng.",
    visual: "Quay góc máy từ trên xuống (POV) để học viên dễ bắt chước.",
  },
  {
    time: "07:00 - 10:00",
    content:
      "Kết quả: Lột giấy in, cho khách xem độ thẩm thấu của mực vào vải.",
    visual: "Quay cận cảnh thớ vải sau khi in (mực đều, mịn).",
  },
];

const priceFormat = new Intl.NumberFormat("vi-VN");

export default function ProgramPage() {
  const csvContent = [
    "Thời lượng,Nội dung Video,Hình ảnh minh họa",
    ...scriptRows.map((row) => `${row.time},${row.content},${row.visual}`),
  ].join("\n");

  return (
    <div className="container-app space-y-6 py-6 md:py-10">
      <section className="card space-y-4 p-5 md:p-8">
        <p className="text-xs uppercase tracking-wider text-accent">
          Chương trình đào tạo thực chiến
        </p>
        <h1 className="text-2xl font-black leading-tight md:text-4xl">
          LÀM CHỦ CÔNG NGHỆ IN & KINH DOANH ĐỒ THỂ THAO THỰC CHIẾN
        </h1>
        <p className="text-sm text-zinc-300">
          Lộ trình dành cho người mới bắt đầu đến người muốn mở rộng xưởng in và
          vận hành shop thể thao chuyên nghiệp.
        </p>
      </section>

      <section className="card overflow-hidden">
        <div className="grid grid-cols-[1fr_2fr_1fr] bg-zinc-100/90 px-3 py-3 text-sm font-semibold text-black md:px-6">
          <p>Gói khóa học</p>
          <p>Nội dung chính</p>
          <p>Giá đề xuất (VND)</p>
        </div>
        {packages.map((item) => (
          <div
            key={item.name}
            className="grid gap-2 border-t border-border px-3 py-4 md:grid-cols-[1fr_2fr_1fr_auto] md:items-center md:px-6"
          >
            <p className="text-xl font-bold">{item.name}</p>
            <p className="text-sm text-zinc-200">{item.content}</p>
            <p className="text-xl font-semibold">
              {priceFormat.format(item.price)}
            </p>
            <Link
              href={`/checkout?course=xuong-in-the-thao-thuc-chien&packageName=${encodeURIComponent(item.name)}&packagePrice=${item.price}`}
              className="btn-primary inline-flex items-center justify-center px-4 py-2 text-sm"
            >
              Mua gói
            </Link>
          </div>
        ))}
      </section>

      {modules.map((module) => (
        <section key={module.title} className="card p-4 md:p-6">
          <h2 className="text-xl font-bold">{module.title}</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {module.lessons.map((lesson) => (
              <li key={lesson}>• {lesson}</li>
            ))}
          </ul>
        </section>
      ))}

      <section className="card space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">
              Kịch bản chi tiết video bài giảng (Ví dụ Bài 5)
            </h2>
            <p className="text-sm text-zinc-300">
              Tiêu đề: Bí mật nhiệt độ &quot;Vàng&quot; khi in áo thun lạnh.
            </p>
          </div>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`}
            download="kich-ban-bai-5.csv"
            className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"
          >
            <Download size={14} /> Xuất sang Trang tính
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-zinc-400">
                <th className="px-2 py-2">Thời lượng</th>
                <th className="px-2 py-2">Nội dung Video</th>
                <th className="px-2 py-2">Hình ảnh minh họa</th>
              </tr>
            </thead>
            <tbody>
              {scriptRows.map((row) => (
                <tr
                  key={row.time}
                  className="border-b border-border/60 align-top"
                >
                  <td className="px-2 py-2 font-semibold">{row.time}</td>
                  <td className="px-2 py-2 text-zinc-200">{row.content}</td>
                  <td className="px-2 py-2 text-zinc-300">{row.visual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-4 md:p-6">
        <h2 className="text-xl font-bold">Mẹo nhỏ để bán khóa học hiệu quả</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-300">
          <li>
            Tặng kèm File Vector: bộ font số CLB nổi tiếng 2026 hoặc mockup áo
            đấu mới.
          </li>
          <li>
            Video quay thực tế tại xưởng: quay máy chạy, máy ép, đóng gói đơn
            hàng để tăng thuyết phục.
          </li>
          <li>
            Cam kết hỗ trợ sau khóa học qua UltraView/Zalo để xử lý lỗi máy in
            và setup phần mềm.
          </li>
        </ol>
        <p className="mt-4 rounded-lg border border-accent/50 bg-accent/10 p-3 text-sm text-orange-100">
          Bạn muốn đội ngũ dựng chi tiết lời thoại cho 1 bài cụ thể (ví dụ bài
          Corel) có thể liên hệ ở trang tư vấn.
        </p>
      </section>
    </div>
  );
}
