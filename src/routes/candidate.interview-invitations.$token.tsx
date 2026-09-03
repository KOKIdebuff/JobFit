import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/candidate/interview-invitations/$token")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/human-interviews/invitations/$token",
      params: { token: params.token },
      replace: true,
    });
  },
});
