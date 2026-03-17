import CheckoutClient from "@/app/checkout/checkout-client";

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

  return (
    <CheckoutClient
      courseSlug={courseSlug}
      packageName={packageName}
      packagePrice={Number.isFinite(packagePrice) ? packagePrice : undefined}
    />
  );
}
