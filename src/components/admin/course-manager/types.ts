export type ManagedCourse = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  detailed_description: string;
  category: "in-an" | "thiet-ke" | "kinh-doanh";
  level: "Cơ bản" | "Nâng cao";
  price: number;
  thumbnail: string;
  intro_video_url: string | null;
  instructor_name: string;
  instructor_title: string;
  outcomes?: string[];
};

export type ManagedResource = {
  id: string;
  course_id: string;
  lesson_id: string | null;
  title: string;
  description: string | null;
  file_type: string;
  preview_image: string | null;
  storage_path: string;
};

export type LessonItem = {
  id: string;
  chapter_id: string;
  title: string;
  type: "video" | "text";
  duration: string;
  summary: string;
  content: string | null;
  video_url: string | null;
  position: number;
  resources?: ManagedResource[];
};

export type ChapterItem = {
  id: string;
  course_id: string;
  title: string;
  position: number;
  lessons: LessonItem[];
};
