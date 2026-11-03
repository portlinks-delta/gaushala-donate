"use client";
import { use } from "react";
import { CampaignForm } from "@/components/admin-pages";
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <CampaignForm key={id} id={id} />;
}
