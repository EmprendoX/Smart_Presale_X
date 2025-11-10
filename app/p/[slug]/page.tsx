import { redirect } from "next/navigation";

export const revalidate = 0;

export default function LegacyProjectPage({ params }: { params: { slug: string } }) {
  redirect(`/es/p/${params.slug}`);
}
