import { CategoryCriteriaClient } from "@/components/category-criteria-client";

export default async function CategoryCriteriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CategoryCriteriaClient categoryId={id} />;
}
