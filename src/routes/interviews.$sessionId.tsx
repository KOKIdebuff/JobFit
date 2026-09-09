import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Send } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { jobFitApi } from "@/lib/jobfit/service";
import type { InterviewSession } from "@/lib/jobfit/types";

export const Route = createFileRoute("/interviews/$sessionId")({ component: InterviewPage });
type SpeechConstructor = new () => {
  lang: string;
  interimResults: boolean;
  start(): void;
  onresult: (event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void;
  onerror: () => void;
};
type InputMethod = "text" | "speech_to_text";

function InterviewPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [input, setInput] = useState("");
  const [inputMethod, setInputMethod] = useState<InputMethod>("text");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    void jobFitApi
      .interview(sessionId)
      .then(setSession)
      .catch((reason: Error) => setError(reason.message));
  }, [sessionId]);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [session?.messages.length]);

  async function send() {
    if (!session || !input.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      setSession(await jobFitApi.answer(session, input.trim(), inputMethod));
      setInput("");
      setInputMethod("text");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "提交失败");
    } finally {
      setBusy(false);
    }
  }
  function speech() {
    const host = window as unknown as {
      SpeechRecognition?: SpeechConstructor;
      webkitSpeechRecognition?: SpeechConstructor;
    };
    const Constructor = host.SpeechRecognition ?? host.webkitSpeechRecognition;
    if (!Constructor) {
      setError("当前浏览器不支持语音转写，请使用文字输入。");
      return;
    }
    const recognition = new Constructor();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      setInput(event.results[0][0].transcript);
      setInputMethod("speech_to_text");
    };
    recognition.onerror = () => {
      setInputMethod("text");
      setError("语音转写失败，未保存任何音频，请改用文字输入。");
    };
    recognition.start();
  }
  async function report() {
    if (!session) return;
    setBusy(true);
    try {
      const value = await jobFitApi.generateReport(session.id);
      await navigate({ to: "/reports/$reportId", params: { reportId: value.id } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "报告生成失败");
    } finally {
      setBusy(false);
    }
  }
  return (
    <PageShell>
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col px-5 py-8 sm:px-8">
        <header className="border-b pb-5">
          <h1 className="text-xl font-semibold">JobFit AI Interviewer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            岗位胜任力面试 · {session?.current_competency_id ?? "准备中"} · L
            {session?.current_difficulty ?? 1}
          </p>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto py-6">
          {session?.messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[80%] rounded-3xl bg-primary px-5 py-3 text-primary-foreground"
                  : "max-w-[85%] rounded-3xl bg-secondary px-5 py-4"
              }
            >
              <div className="mb-1 text-xs opacity-70">
                {message.role === "user" ? "你" : "JobFit"} · {message.competency_id} · L
                {message.difficulty}
              </div>
              <p className="whitespace-pre-wrap leading-7">{message.content}</p>
            </div>
          ))}
          <div ref={end} />
        </div>
        {error && (
          <p role="alert" className="mb-3 text-sm text-destructive">
            {error}
          </p>
        )}
        {session?.status === "COMPLETED" ? (
          <Button size="lg" onClick={() => void report()} disabled={busy}>
            生成证据驱动评估报告
          </Button>
        ) : (
          <footer className="rounded-3xl border bg-card p-3">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="输入回答……"
              className="min-h-24 border-0 shadow-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="icon" onClick={speech} aria-label="语音转文字">
                <Mic className="h-4 w-4" />
              </Button>
              <Button onClick={() => void send()} disabled={busy || !input.trim()}>
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                发送
              </Button>
            </div>
          </footer>
        )}
      </main>
    </PageShell>
  );
}
