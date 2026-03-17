import { Course } from "@/types/lms";

export const COURSE_CATEGORIES = [
  { value: "all", label: "Tất cả" },
  { value: "in-an", label: "In ấn" },
  { value: "thiet-ke", label: "Thiết kế" },
  { value: "kinh-doanh", label: "Kinh doanh" },
] as const;

export const courses: Course[] = [
  {
    slug: "xuong-in-the-thao-thuc-chien",
    title: "Xưởng In Thể Thao Thực Chiến",
    shortDescription:
      "Vận hành xưởng in áo bóng đá từ setup máy đến giao hàng.",
    detailedDescription:
      "Khóa học giúp bạn nắm toàn bộ quy trình thực tế: chọn vật liệu, canh màu, in decal chuyển nhiệt, đóng gói và quản trị đơn theo mùa giải.",
    category: "in-an",
    level: "Nâng cao",
    isBestSeller: true,
    createdAt: "2026-02-25T09:00:00.000Z",
    studentsCount: 328,
    rating: 4.9,
    price: 2490000,
    thumbnail:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop",
    introVideoUrl:
      "https://cdn.coverr.co/videos/coverr-printing-press-1579/1080p.mp4",
    instructor: {
      name: "Nguyễn Hoàng Sơn",
      title: "Founder SportPrint Lab",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop",
      bio: "12 năm vận hành xưởng in thể thao, triển khai hơn 50.000 áo đội tuyển học sinh - doanh nghiệp.",
    },
    outcomes: [
      "Thiết lập quy trình in áo bóng đá chuẩn xưởng",
      "Giảm lỗi màu và lệch ép dưới 3%",
      "Tạo workflow nhận đơn nhanh trên mobile",
    ],
    chapters: [
      {
        id: "c1",
        title: "Nền tảng xưởng in thể thao",
        lessons: [
          {
            id: "l1",
            title: "Tổng quan thiết bị và vật tư",
            type: "video",
            duration: "18:20",
            videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
            summary: "Các loại máy in, máy ép và tiêu chuẩn vật tư.",
          },
          {
            id: "l2",
            title: "Checklist setup xưởng trong 7 ngày",
            type: "text",
            duration: "10 phút",
            summary: "Bộ checklist thực chiến trước khi chạy đơn đầu tiên.",
            content:
              "Bạn cần định tuyến luồng vật liệu một chiều, phân khu ép - in - QC rõ ràng để giảm sai sót trong giờ cao điểm.",
          },
        ],
      },
      {
        id: "c2",
        title: "Quy trình in & kiểm soát chất lượng",
        lessons: [
          {
            id: "l3",
            title: "Canh màu và profile cho áo thi đấu",
            type: "video",
            duration: "25:40",
            videoUrl: "https://www.w3schools.com/html/movie.mp4",
            summary:
              "Thiết lập profile màu nhất quán giữa màn hình và sản phẩm thật.",
          },
          {
            id: "l4",
            title: "QC 5 bước trước khi giao hàng",
            type: "text",
            duration: "12 phút",
            summary: "Quy trình phát hiện lỗi nhanh theo ca sản xuất.",
            content:
              "Sử dụng bảng lỗi tiêu chuẩn theo nhóm: lỗi ép, lỗi mực, lỗi biên cắt để đào tạo nhân sự mới trong 2 buổi.",
          },
        ],
      },
    ],
    resources: [
      {
        id: "r1",
        title: "Template áo bóng đá fullsize",
        description: "Template chuẩn xưởng cho in chuyển nhiệt.",
        fileType: ".CDR",
        storagePath:
          "resources/xuong-in-the-thao-thuc-chien/template-ao-bong-da-fullsize.cdr",
        previewImage:
          "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop",
      },
      {
        id: "r2",
        title: "Bảng kiểm tra màu CMYK",
        description: "Bảng test màu ứng dụng cho áo đội.",
        fileType: ".AI",
        storagePath:
          "resources/xuong-in-the-thao-thuc-chien/bang-kiem-tra-mau-cmyk.ai",
        previewImage:
          "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=800&auto=format&fit=crop",
      },
    ],
    reviews: [
      {
        id: "rv1",
        studentName: "Trần Quốc Nam",
        rating: 5,
        comment: "Áp dụng ngay được cho xưởng, giảm lỗi in rất rõ.",
      },
      {
        id: "rv2",
        studentName: "Lê Mỹ Anh",
        rating: 5,
        comment: "Nội dung thực chiến, dễ follow ngay trên điện thoại.",
      },
    ],
  },
  {
    slug: "corel-thiet-ke-file-in-bao-tro",
    title: "Corel: Thiết Kế File In Báo Trợ",
    shortDescription: "Thiết kế file in áo thi đấu tối ưu sản xuất hàng loạt.",
    detailedDescription:
      "Từ dựng layout số áo - tên cầu thủ đến tách lớp in và xuất file chuẩn cho nhiều loại máy. Tập trung workflow nhanh, ít lỗi.",
    category: "thiet-ke",
    level: "Cơ bản",
    isBestSeller: false,
    createdAt: "2026-03-03T09:00:00.000Z",
    studentsCount: 210,
    rating: 4.8,
    price: 1490000,
    thumbnail:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop",
    instructor: {
      name: "Phạm Minh Quân",
      title: "Design Lead - Teamwear Studio",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
      bio: "Chuyên gia thiết kế file in với hơn 8 năm xử lý đơn hàng CLB và trường học.",
    },
    outcomes: [
      "Thiết kế 1 file gốc áp dụng cho nhiều size áo",
      "Xuất file đúng chuẩn in hàng loạt",
      "Tối ưu thời gian sửa file trước sản xuất",
    ],
    chapters: [
      {
        id: "c3",
        title: "Thiết kế layout",
        lessons: [
          {
            id: "l5",
            title: "Grid thiết kế áo thể thao",
            type: "video",
            duration: "14:10",
            videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
            summary: "Dùng grid để kiểm soát bố cục số áo và logo.",
          },
          {
            id: "l6",
            title: "Xuất file chuẩn xưởng",
            type: "text",
            duration: "8 phút",
            summary: "Thiết lập thông số xuất file AI/CDR đúng profile.",
            content:
              "Luôn khóa layer nền, embed font và đặt tên lớp theo chuẩn để giảm lỗi giao nhận file.",
          },
        ],
      },
    ],
    resources: [
      {
        id: "r3",
        title: "Preset Corel cho áo bóng đá",
        description: "Preset layer và naming convention.",
        fileType: ".CDR",
        storagePath:
          "resources/corel-thiet-ke-file-in-bao-tro/preset-corel-ao-bong-da.cdr",
        previewImage:
          "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop",
      },
    ],
    reviews: [
      {
        id: "rv3",
        studentName: "Đỗ Huy Hoàng",
        rating: 5,
        comment: "Bài học ngắn gọn, xem trên mobile rất tiện.",
      },
    ],
  },
  {
    slug: "kinh-doanh-shop-do-the-thao-online",
    title: "Kinh Doanh Shop Đồ Thể Thao Online",
    shortDescription:
      "Xây phễu bán áo đội và đồ thể thao từ 0 đến 100 đơn/ngày.",
    detailedDescription:
      "Đi từ định vị thương hiệu, setup nội dung social, chiến dịch ads đến vận hành đơn hàng và chăm sóc khách hàng sau mua.",
    category: "kinh-doanh",
    level: "Nâng cao",
    isBestSeller: true,
    createdAt: "2026-01-20T09:00:00.000Z",
    studentsCount: 512,
    rating: 4.7,
    price: 1990000,
    thumbnail:
      "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=1200&auto=format&fit=crop",
    instructor: {
      name: "Lương Nhật Long",
      title: "E-commerce Strategist",
      avatar:
        "https://images.unsplash.com/photo-1542204625-de293a9b7b2c?q=80&w=300&auto=format&fit=crop",
      bio: "Tư vấn tăng trưởng cho 30+ shop đồ thể thao nội địa.",
    },
    outcomes: [
      "Thiết kế offer và combo tăng AOV",
      "Vận hành quy trình chốt đơn nhanh",
      "Theo dõi PnL theo từng campaign",
    ],
    chapters: [
      {
        id: "c4",
        title: "Hệ thống bán hàng",
        lessons: [
          {
            id: "l7",
            title: "Định vị thương hiệu thể thao",
            type: "video",
            duration: "20:00",
            videoUrl: "https://www.w3schools.com/html/movie.mp4",
            summary: "Tạo thông điệp thương hiệu mạnh trên thị trường niche.",
          },
          {
            id: "l8",
            title: "KPI doanh thu theo tuần",
            type: "text",
            duration: "9 phút",
            summary: "Mẫu KPI quản lý doanh thu và biên lợi nhuận.",
            content:
              "Theo dõi tỷ lệ chuyển đổi từ inbox sang đơn, và lợi nhuận gộp từng SKU để tối ưu nhập hàng.",
          },
        ],
      },
    ],
    resources: [
      {
        id: "r4",
        title: "Mẫu kế hoạch nội dung 30 ngày",
        description: "Template content calendar cho shop thể thao.",
        fileType: ".PSD",
        storagePath:
          "resources/kinh-doanh-shop-do-the-thao-online/mau-content-30-ngay.psd",
        previewImage:
          "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop",
      },
    ],
    reviews: [
      {
        id: "rv4",
        studentName: "Vũ Quốc Khánh",
        rating: 4,
        comment: "Flow bán hàng rõ ràng, dễ triển khai thực tế.",
      },
    ],
  },
];

export const feedbacks = [
  {
    name: "Ngọc Linh",
    quote: "Mình vừa học vừa làm theo và đã tự mở xưởng in mini sau 2 tháng.",
  },
  {
    name: "Anh Tú",
    quote:
      "Nội dung không lý thuyết suông, rất sát vận hành đơn hàng thể thao.",
  },
  {
    name: "Thu Hà",
    quote: "Giao diện học trên điện thoại cực dễ dùng, không bị rối.",
  },
];

export const instructorNotices = [
  "Livestream Q&A tối thứ 5: xử lý lỗi màu trên áo tối nền.",
  "Đã cập nhật tài liệu mới: Template áo giải phong trào 2026.",
  "Tuần này có case study thực tế về chiến dịch mở bán áo CLB.",
];
