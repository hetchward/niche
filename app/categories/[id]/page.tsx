import { CategoryDetailClient } from "@/components/category-detail-client";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CategoryDetailClient categoryId={id} />;
}
