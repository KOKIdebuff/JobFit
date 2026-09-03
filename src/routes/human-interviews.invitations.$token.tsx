import { createFileRoute } from "@tanstack/react-router";

import { CandidateInterviewInvitation } from "@/components/human-interviews/CandidateInterviewInvitation";
import { useHumanInterviewInvitation } from "@/hooks/use-human-interviews";

export const Route = createFileRoute("/human-interviews/invitations/$token")({
  head: () => ({
    meta: [
      { title: "真人面试预约邀约 - HireLink AI" },
      {
        name: "description",
        content: "候选人通过绑定预约链接选择真人面试时间，并确认联系方式。",
      },
    ],
  }),
  component: CandidateInterviewInvitationPage,
});

function CandidateInterviewInvitationPage() {
  const { token } = Route.useParams();
  const controller = useHumanInterviewInvitation(token);
  return (
    <main className="mx-auto max-w-7xl px-5 py-8 pb-28 sm:px-8">
      <CandidateInterviewInvitation controller={controller} />
    </main>
  );
}
