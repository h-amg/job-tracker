"use client";

import { ApplicationDetail } from "@/components/features/application-detail";

interface ApplicationDetailPageProps {
  params: {
    id: string;
  };
}

export default function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  return <ApplicationDetail applicationId={params.id} />;
}
