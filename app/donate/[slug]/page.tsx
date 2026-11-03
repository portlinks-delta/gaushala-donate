"use client";
import { use } from "react";
import { DonorFlow } from "@/components/donor-flow";
export default function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <DonorFlow key={slug} slug={slug} />;
}
