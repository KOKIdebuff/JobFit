import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/candidate/interviews")({
  beforeLoad: () => {
    throw redirect({
      to: "/human-interviews/candidate",
      replace: true,
    });
  },
});
