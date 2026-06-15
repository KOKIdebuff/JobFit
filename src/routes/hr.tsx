import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/hr")({
  component: HrLayout,
});

function HrLayout() {
  return <Outlet />;
}
