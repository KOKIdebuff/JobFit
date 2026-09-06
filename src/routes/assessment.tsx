import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { jobFitApi } from "@/lib/jobfit/service";
import type { CompetencyProfile } from "@/lib/jobfit/types";

export const Route = createFileRoute("/assessment")({ component: AssessmentPage });

function AssessmentPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<CompetencyProfile[]>([]);
  const [role, setRole] = useState<CompetencyProfile["id"]>("ai_engineer");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("AI / 人工智能算法工程师");
  const [jd, setJd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void jobFitApi
      .profiles()
      .then((result) => setProfiles(result.profiles))
      .catch(() => {
        setError("请先登录并启动 JobFit API。");
      });
  }, []);

  async function start() {
    if (!file) {
      setError("请先上传 PDF、DOCX 或 TXT 简历。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const resume = await jobFitApi.uploadResume(file);
      const candidate = await jobFitApi.candidateProfile(resume.id);
      const job = await jobFitApi.jobProfile(role, title, jd);
      const assessment = await jobFitApi.assessment(
        resume.id,
        String(candidate.id),
        String(job.id),
      );
      let interview = await jobFitApi.createInterview(assessment.id);
      interview = await jobFitApi.startInterview(interview.id);
      await navigate({ to: "/interviews/$sessionId", params: { sessionId: interview.id } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "创建评估失败");
    } finally {
      setBusy(false);
    }
  }

  const selected = profiles.find((profile) => profile.id === role);
  return (
    <PageShell>
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <h1 className="text-3xl font-bold">岗位评估准备</h1>
        <p className="mt-2 text-muted-foreground">
          上传简历并选择岗位胜任力模板。所有岗位共享同一套自适应面试 Runtime。
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="space-y-5 rounded-3xl border bg-card p-6">
            <label className="block text-sm font-medium">
              简历文件
              <Input
                className="mt-2"
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <label className="block text-sm font-medium">
              岗位模板
              <select
                className="mt-2 h-10 w-full rounded-md border bg-background px-3"
                value={role}
                onChange={(event) => {
                  const next = event.target.value as CompetencyProfile["id"];
                  setRole(next);
                  setTitle(profiles.find((profile) => profile.id === next)?.name ?? "");
                }}
              >
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              目标岗位
              <Input
                className="mt-2"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              JD（可选）
              <Textarea
                className="mt-2 min-h-32"
                value={jd}
                onChange={(event) => setJd(event.target.value)}
                placeholder="粘贴岗位职责和任职要求…"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button className="w-full" disabled={busy} onClick={() => void start()}>
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="mr-2 h-4 w-4" />
              )}
              生成画像并开始面试
            </Button>
          </section>
          <section className="rounded-3xl border bg-card p-6">
            <h2 className="font-semibold">{selected?.name ?? "岗位胜任力"}</h2>
            <div className="mt-5 space-y-3">
              {selected?.competencies.map((competency) => (
                <div key={competency.id} className="rounded-2xl bg-secondary/50 p-4">
                  <div className="flex justify-between">
                    <span className="font-medium">{competency.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(competency.weight * 100)}%
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{competency.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </PageShell>
  );
}
