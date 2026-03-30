import CheckoutClient from "@/app/checkout/checkout-client";
import { getCourseBySlug } from "@/lib/course";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

type CheckoutCourse = {
  slug: string;
  title: string;
  shortDescription: string;
  price: number;
};

const getCheckoutCourse = async (
  slug: string,
): Promise<CheckoutCourse | null> => {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return null;
  }

  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const { data } = await supabase
      .from("courses")
      .select("slug, title, short_description, price")
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (data) {
      return {
        slug: data.slug,
        title: data.title,
        shortDescription: data.short_description,
        price: data.price,
      };
    }
  }

  const fallback = getCourseBySlug(normalizedSlug);
  if (!fallback) {
    return null;
  }

  return {
    slug: fallback.slug,
    title: fallback.title,
    shortDescription: fallback.shortDescription,
    price: fallback.price,
  };
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    course?: string;
    packageName?: string;
    packagePrice?: string;
  }>;
}) {
  const params = await searchParams;
  const courseSlug = params.course ?? "";
  const packageName = params.packageName;
  const packagePrice = params.packagePrice
    ? Number(params.packagePrice)
    : undefined;
  const course = await getCheckoutCourse(courseSlug);

  return (
    <CheckoutClient
      courseSlug={courseSlug}
      course={course}
      packageName={packageName}
      packagePrice={Number.isFinite(packagePrice) ? packagePrice : undefined}
    />
  );
}
