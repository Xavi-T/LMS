import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { courses } from "../src/lib/mock-data";

dotenv.config({ path: ".env.local" });
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
}

const supabase = createClient(url, serviceRole, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientError = (message: string) => {
  const lower = message.toLowerCase();
  return (
    lower.includes("502") ||
    lower.includes("503") ||
    lower.includes("504") ||
    lower.includes("bad gateway") ||
    lower.includes("gateway") ||
    lower.includes("cloudflare") ||
    lower.includes("fetch failed") ||
    lower.includes("network")
  );
};

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  maxRetries = 5,
) {
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const transient = isTransientError(message);

      if (!transient || attempt === maxRetries) {
        throw error;
      }

      const delay = 500 * 2 ** attempt;
      console.warn(
        `[retry ${attempt + 1}/${maxRetries}] ${label} failed: ${message}. Retrying in ${delay}ms...`,
      );
      await sleep(delay);
      attempt += 1;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`${label} failed after retries`);
}

async function seedCourse(course: (typeof courses)[number]) {
  const { data: courseRow, error: upsertCourseError } = await withRetry(
    `upsert course ${course.slug}`,
    () =>
      supabase
        .from("courses")
        .upsert(
          {
            slug: course.slug,
            title: course.title,
            short_description: course.shortDescription,
            detailed_description: course.detailedDescription,
            category: course.category,
            level: course.level,
            is_best_seller: course.isBestSeller,
            created_at: course.createdAt,
            students_count: course.studentsCount,
            rating: course.rating,
            price: course.price,
            thumbnail: course.thumbnail,
            intro_video_url: course.introVideoUrl ?? null,
            instructor_name: course.instructor.name,
            instructor_title: course.instructor.title,
            instructor_avatar: course.instructor.avatar,
            instructor_bio: course.instructor.bio,
          },
          { onConflict: "slug" },
        )
        .select("id")
        .single(),
  );

  if (upsertCourseError || !courseRow?.id) {
    throw new Error(
      `Upsert course failed (${course.slug}): ${upsertCourseError?.message}`,
    );
  }

  const courseId = courseRow.id;

  await withRetry(`delete outcomes ${course.slug}`, () =>
    supabase.from("course_outcomes").delete().eq("course_id", courseId),
  );
  await withRetry(`delete reviews ${course.slug}`, () =>
    supabase.from("course_reviews").delete().eq("course_id", courseId),
  );
  await withRetry(`delete resources ${course.slug}`, () =>
    supabase.from("course_resources").delete().eq("course_id", courseId),
  );
  await withRetry(`delete chapters ${course.slug}`, () =>
    supabase.from("chapters").delete().eq("course_id", courseId),
  );

  if (course.outcomes.length > 0) {
    const outcomeRows = course.outcomes.map((content, index) => ({
      course_id: courseId,
      content,
      position: index + 1,
    }));

    const { error: outcomeError } = await withRetry(
      `insert outcomes ${course.slug}`,
      () => supabase.from("course_outcomes").insert(outcomeRows),
    );
    if (outcomeError) {
      throw new Error(
        `Insert outcomes failed (${course.slug}): ${outcomeError.message}`,
      );
    }
  }

  for (
    let chapterIndex = 0;
    chapterIndex < course.chapters.length;
    chapterIndex += 1
  ) {
    const chapter = course.chapters[chapterIndex];

    const { data: chapterRow, error: chapterError } = await withRetry(
      `insert chapter ${course.slug}/${chapter.title}`,
      () =>
        supabase
          .from("chapters")
          .insert({
            course_id: courseId,
            title: chapter.title,
            position: chapterIndex + 1,
          })
          .select("id")
          .single(),
    );

    if (chapterError || !chapterRow?.id) {
      throw new Error(
        `Insert chapter failed (${course.slug}/${chapter.title}): ${chapterError?.message}`,
      );
    }

    if (chapter.lessons.length > 0) {
      const lessonRows = chapter.lessons.map((lesson, lessonIndex) => ({
        chapter_id: chapterRow.id,
        title: lesson.title,
        type: lesson.type,
        duration: lesson.duration,
        summary: lesson.summary,
        content: lesson.content ?? null,
        video_url: lesson.videoUrl ?? null,
        position: lessonIndex + 1,
      }));

      const { error: lessonError } = await withRetry(
        `insert lessons ${course.slug}/${chapter.title}`,
        () => supabase.from("lessons").insert(lessonRows),
      );
      if (lessonError) {
        throw new Error(
          `Insert lessons failed (${course.slug}/${chapter.title}): ${lessonError.message}`,
        );
      }
    }
  }

  if (course.resources.length > 0) {
    const resourceRows = course.resources
      .filter((resource) => Boolean(resource.storagePath))
      .map((resource) => ({
        course_id: courseId,
        title: resource.title,
        description: resource.description,
        file_type: resource.fileType,
        preview_image: resource.previewImage,
        storage_path: resource.storagePath!,
      }));

    if (resourceRows.length > 0) {
      const { error: resourceError } = await withRetry(
        `insert resources ${course.slug}`,
        () => supabase.from("course_resources").insert(resourceRows),
      );
      if (resourceError) {
        throw new Error(
          `Insert resources failed (${course.slug}): ${resourceError.message}`,
        );
      }
    }
  }

  if (course.reviews.length > 0) {
    const reviewRows = course.reviews.map((review) => ({
      course_id: courseId,
      student_name: review.studentName,
      rating: review.rating,
      comment: review.comment,
    }));

    const { error: reviewError } = await withRetry(
      `insert reviews ${course.slug}`,
      () => supabase.from("course_reviews").insert(reviewRows),
    );

    if (reviewError) {
      throw new Error(
        `Insert reviews failed (${course.slug}): ${reviewError.message}`,
      );
    }
  }

  return {
    slug: course.slug,
    chapters: course.chapters.length,
    lessons: course.chapters.flatMap((item) => item.lessons).length,
    resources: course.resources.length,
    reviews: course.reviews.length,
    outcomes: course.outcomes.length,
  };
}

async function main() {
  console.log("Start seeding Supabase from src/lib/mock-data.ts...");

  const summaries = [] as Array<{
    slug: string;
    chapters: number;
    lessons: number;
    resources: number;
    reviews: number;
    outcomes: number;
  }>;

  for (const course of courses) {
    const summary = await seedCourse(course);
    summaries.push(summary);
    console.log(
      `Seeded ${summary.slug}: ${summary.chapters} chapters, ${summary.lessons} lessons, ${summary.resources} resources`,
    );
  }

  const totalLessons = summaries.reduce((sum, item) => sum + item.lessons, 0);
  console.log("Done.");
  console.log(
    `Courses: ${summaries.length}, Lessons: ${totalLessons}, Reviews: ${summaries.reduce((sum, item) => sum + item.reviews, 0)}`,
  );
}

main().catch((error) => {
  const message =
    error instanceof Error ? error.message : "Unknown seeding error";

  if (
    message.includes("Could not find the table") ||
    message.includes("relation")
  ) {
    console.error("Seed failed because database schema is not initialized.");
    console.error(
      "Run SQL in supabase/schema.sql first, then rerun: npm run seed:supabase",
    );
    console.error(`Detail: ${message}`);
    process.exit(1);
  }

  console.error(error);
  process.exit(1);
});
