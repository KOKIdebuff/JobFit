import { createFileRoute } from "@tanstack/react-router";
import { CandidateHumanInterviews } from "@/components/human-interviews/CandidateHumanInterviews";
import { PageShell } from "@/components/site/PageShell";
import { useCandidateHumanInterviews } from "@/hooks/use-human-interviews";

export const Route = createFileRoute("/candidate/interviews")({
  head: () => ({
    meta: [
      { title: "我的真人面试 - HireLink AI" },
      {
        name: "description",
        content: "候选人查看、取消、改期企业真人面试，并查看已发布的求职者摘要版真人报告。",
      },
    ],
  }),
  component: CandidateInterviewsPage,
});

function CandidateInterviewsPage() {
  const controller = useCandidateHumanInterviews();
  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-5 py-8 pb-28 sm:px-8">
        <CandidateHumanInterviews controller={controller} />
      </main>
    </PageShell>
  );
}
