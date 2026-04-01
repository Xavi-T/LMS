import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Khóa học",
  description:
    "Danh sách khóa học kỹ thuật in ấn, thiết kế file in và kinh doanh đồ thể thao tại SportPrint LMS.",
  alternates: {
    canonical: "/courses",
  },
  openGraph: {
    title: "Khóa học | SportPrint LMS",
    description:
      "Khám phá các khóa học thực chiến về in áo thể thao, thiết kế file in và vận hành kinh doanh.",
    url: "/courses",
    type: "website",
    images: [
      {
        url: "/logo-sportprint.svg",
        width: 1200,
        height: 630,
        alt: "Danh sách khóa học SportPrint LMS",
      },
    ],
  },
};

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
