import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEMO_IDS } from "@/lib/candidate-detail-demo";

export const Route = createFileRoute("/hr/applications/$applicationId_/assessment-plan")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/hr/jobs/$jobId/candidates/$applicationId/assessment-plan",
      params: {
        jobId: DEMO_IDS.job,
        applicationId: params.applicationId,
      },
      replace: true,
    });
  },
});
