# JobFit Repository Audit

## 产品边界

JobFit 是面向新一代信息技术岗位的岗位胜任力评估智能体。核心路径为：简历上传、Candidate Competency Profile、Job Competency Profile、自适应对话面试、Evidence Ledger、能力边界、岗位匹配度和评估报告。

## 保留与改造

- 保留：认证、SQLite/Alembic、受控文件解析、FastAPI API 基础、React/TanStack、Recharts。
- 改造：简历与岗位画像、匹配、AI 运行记录、报告和语音输入。
- 新增：统一 Competency Profile、Interview Orchestrator、BM25 RAG、Working/Summary/Evidence Memory、Evidence Ledger、确定性评分器。

## 已移除的产品域

- 人才库、内推网络、HR 招聘工作台、招聘 CRM、岗位任务试炼和真人面试预约。
- 数字人、虚拟人、视频面试、WebRTC、摄像头监考、反作弊、录音录像和行为分析。

旧数据库表和历史 Alembic migration 不物理删除；它们不再由当前 JobFit Runtime 挂载或调用。

## 验证边界

`deterministic` Provider 仅用于本地测试和离线演示。只有配置并实际调用 OpenAI-compatible Provider 后，才能声称真实模型集成已验证。Speech-to-Text 仅生成文本，不保存或上传音频。
