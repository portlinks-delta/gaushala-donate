"use client";
import { use } from "react";
import { DonorFlow } from "@/components/donor-flow";
export default function Page({
  params,
}: {
  params: Promise<{ slug: string; step: string }>;
}) {
  const { slug, step } = use(params);
  return <DonorFlow key={`${slug}-${step}`} slug={slug} step={step} />;
}
