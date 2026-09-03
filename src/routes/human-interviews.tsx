import { createFileRoute, Outlet } from "@tanstack/react-router";

import { PageShell } from "@/components/site/PageShell";

export const Route = createFileRoute("/human-interviews")({
  component: HumanInterviewsLayout,
});

function HumanInterviewsLayout() {
  return (
    <PageShell>
      <Outlet />
    </PageShell>
  );
}
