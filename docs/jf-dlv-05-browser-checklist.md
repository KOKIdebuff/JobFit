# JF-DLV-05 人工 Browser Golden Journey 清单

> 本清单只验证当前 JobFit 基线的本地浏览器主路径。它不是 `JF-P1-09`，不证明真实外部 Provider、生产环境、音视频能力或后续 P1 Phase 已完成。

## 使用范围

- 使用仓库内合成文件 `docs/fixtures/jf-dlv-05-resume.txt`；不得上传真实简历或敏感内容。
- 使用 local / deterministic 配置，不填写真实 Provider URL、API key 或模型凭据。
- 浏览器语音转文字只产生用户确认后的文本；不得录制、上传、保存或回放音频。

## Fresh-clone 与启动检查

在包含 JF-DLV-05 且不混入未完成并行任务的干净源码快照中执行：

1. 仓库根目录执行 `bun install --frozen-lockfile`。
2. `backend/` 目录执行 `uv sync --frozen`、`uv run alembic upgrade head`。
3. 在同一目录启动 `uv run uvicorn app.main:app --host 127.0.0.1 --port 8000`，确认 `GET http://127.0.0.1:8000/health` 返回 `success: true` 与 `data.status: "ok"`。
4. 仓库根目录执行 `bun run build`，随后执行 `bun run preview -- --host 127.0.0.1 --port 5173`。
5. 访问 `http://127.0.0.1:5173/login`。后端首次演示账号登录会创建候选人演示账号。

## Golden Journey

1. 使用候选人演示账号登录：`candidate.demo@hirelink.local` / `HireLinkDemo2026!`。
2. 在岗位评估页上传合成 TXT 简历，选择 AI 工程师岗位模板，目标岗位填“AI 算法工程师”，JD 填“负责 RAG、模型评估、可观测性与 AI 工程交付”。点击“生成画像并开始面试”。
3. 确认 Interview 页面显示问题、文本输入框和“语音转文字”按钮。
4. 使用下列高质量回答完成至少八轮。除语音轮次外可直接粘贴文本；每轮确认页面出现下一题后再继续：

   > 我负责这个项目的设计和实现。我先用分层指标定位检索、重排和生成阶段，再基于错误样本验证假设；随后权衡召回率、延迟、成本和一致性，灰度上线后持续观察指标。如果指标回退，我会停止发布、复盘边界并修正方案。

5. 在任意一轮点击“语音转文字”，允许浏览器麦克风权限并口述一段完整回答。确认识别结果只进入文本框，没有自动发送；手工修改其中一段文字后，主动点击“发送”。
6. 在浏览器 Network 面板查看该 `POST /api/v1/interview-sessions/{id}/answers` 请求，确认 payload 的 `input_method` 为 `speech_to_text`。确认用户回答只保存一次、会话继续且出现下一题。
7. 单独验证降级：拒绝麦克风权限或在不支持 SpeechRecognition 的浏览器中点击语音按钮，确认提示用户改用文本；随后使用文本回答继续面试，不出现重复提交或状态异常。
8. 完成会话后点击“生成证据驱动评估报告”，确认报告页展示目标岗位、匹配度、能力雷达、能力边界 / Evidence 与提升建议。

## 证据记录模板

在 `docs/progress.md` 的 JF-DLV-05 事件中记录以下非敏感证据：

- 源码快照（commit）、操作系统、浏览器名称与版本、验证时间。
- install / migration / health / build 的命令与结果。
- 语音轮次的 Network payload 仅记录 `input_method=speech_to_text` 是否成立，不抄录完整转写文本。
- 降级行为、至少八轮完成、报告页关键区块的观察结果。
- 范围限制：local / manual V4，不是 production、真实外部 Provider、通用浏览器兼容性或音视频能力证据。
