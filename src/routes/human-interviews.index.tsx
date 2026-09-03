import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Link2, UserCheck } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  HUMAN_INTERVIEW_DEMO_APPLICATION_ID,
  HUMAN_INTERVIEW_DEMO_TOKEN,
} from "@/lib/human-interviews/fallback";

export const Route = createFileRoute("/human-interviews/")({
  head: () => ({
    meta: [
      { title: "真人面试预约 - HireLink AI" },
      {
        name: "description",
        content: "统一查看 HR 真人面试预约管理、候选人预约列表和候选人预约邀约入口。",
      },
    ],
  }),
  component: HumanInterviewsHomePage,
});

function HumanInterviewsHomePage() {
  return (
    <>
      <section className="relative overflow-hidden px-5 pb-8 pt-12 sm:px-8 sm:pt-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-56 max-w-2xl bg-rainbow opacity-[0.08] blur-[80px]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-medium text-muted-foreground">真人面试预约</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            统一管理真人面试邀约、选时、履约和报告
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            这里是真人面试预约的主入口。HR
            可以管理指定申请的预约链接、会议或地点、一次性档期、履约状态和真人面试报告；候选人可以查看自己的预约安排，也可以通过绑定邀约链接完成选时确认。
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <EntryCard
            icon={<UserCheck />}
            title="HR 预约管理"
            description="生成候选人预约入口，维护会议或地点、一次性档期、履约状态和真人面试报告。"
            action={
              <Button className="rounded-full" asChild>
                <Link
                  to="/human-interviews/hr/applications/$applicationId"
                  params={{ applicationId: HUMAN_INTERVIEW_DEMO_APPLICATION_ID }}
                >
                  进入申请工作台
                </Link>
              </Button>
            }
          />
          <EntryCard
            icon={<CalendarClock />}
            title="候选人我的预约"
            description="查看已确认的真人面试安排，处理取消、改期，并查看已发布的求职者摘要版报告。"
            action={
              <Button variant="outline" className="rounded-full" asChild>
                <Link to="/human-interviews/candidate">查看我的预约</Link>
              </Button>
            }
          />
          <EntryCard
            icon={<Link2 />}
            title="候选人邀约入口"
            description="通过 HR 发送的受控邀约 token 选择可预约时间，并确认本次面试联系方式。"
            action={
              <Button variant="outline" className="rounded-full" asChild>
                <Link
                  to="/human-interviews/invitations/$token"
                  params={{ token: HUMAN_INTERVIEW_DEMO_TOKEN }}
                >
                  打开预约邀约
                </Link>
              </Button>
            }
          />
        </div>
      </main>
    </>
  );
}

function EntryCard({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-muted-foreground [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
      <h2 className="mt-5 text-xl font-semibold">{title}</h2>
      <p className="mt-2 min-h-20 text-sm leading-7 text-muted-foreground">{description}</p>
      <div className="mt-5">{action}</div>
    </article>
  );
}
