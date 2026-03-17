export type CourseCategory = "in-an" | "thiet-ke" | "kinh-doanh";

export type UserRole = "admin" | "instructor" | "student";

export interface Lesson {
  id: string;
  title: string;
  type: "video" | "text";
  duration: string;
  videoUrl?: string;
  summary: string;
  content?: string;
}

export interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface CourseResource {
  id: string;
  title: string;
  description: string;
  fileType: ".CDR" | ".AI" | ".PSD";
  previewImage: string;
  storagePath?: string;
}

export interface CourseReview {
  id: string;
  studentName: string;
  rating: number;
  comment: string;
}

export interface Course {
  slug: string;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  category: CourseCategory;
  level: "Cơ bản" | "Nâng cao";
  isBestSeller: boolean;
  createdAt: string;
  studentsCount: number;
  rating: number;
  price: number;
  thumbnail: string;
  introVideoUrl?: string;
  instructor: {
    name: string;
    title: string;
    avatar: string;
    bio: string;
  };
  outcomes: string[];
  chapters: Chapter[];
  resources: CourseResource[];
  reviews: CourseReview[];
}

export interface Order {
  id: string;
  createdAt: string;
  courseSlug: string;
  amount: number;
  couponCode?: string;
  transferNote: string;
  status: "pending" | "paid";
}

export interface AppUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
}
