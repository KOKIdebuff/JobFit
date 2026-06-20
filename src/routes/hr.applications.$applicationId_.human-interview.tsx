import { createFileRoute } from "@tanstack/react-router";
import { HrHumanInterviewWorkspace } from "@/components/human-interviews/HrHumanInterviewWorkspace";
import { PageShell } from "@/components/site/PageShell";
import { useHrHumanInterview } from "@/hooks/use-human-interviews";

export const Route = createFileRoute("/hr/applications/$applicationId_/human-interview")({
  head: () => ({
    meta: [
      { title: "真人面试预约 - HireLink AI" },
      {
        name: "description",
        content: "HR 管理真人线上和线下面试预约、档期、取消改期、完成标记与报告发布。",
      },
    ],
  }),
  component: HrHumanInterviewPage,
});

function HrHumanInterviewPage() {
  const { applicationId } = Route.useParams();
  const controller = useHrHumanInterview(applicationId);
  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-5 py-8 pb-28 sm:px-8">
        <HrHumanInterviewWorkspace controller={controller} />
      </main>
    </PageShell>
  );
}
