import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/hr/applications/$applicationId_/human-interview")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/human-interviews/hr/applications/$applicationId",
      params: { applicationId: params.applicationId },
      replace: true,
    });
  },
});
