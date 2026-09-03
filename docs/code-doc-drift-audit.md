# Code-Doc Drift Audit

> 审计日期：2026-06-24\\
> 当前性质：历史审计记录；当前代码实现状态唯一事实源已迁移到 `docs/implementation-status.md`。\\
> 基准原则：以当前代码、迁移、测试和前端数据来源为事实，不把产品目标、历史基线或演示文案等同于已完成实现。

## 1. 审计范围

本次检查范围：

- 前端：`src/routes/`、`src/components/`、`src/hooks/`、`src/lib/` 中的页面、数据服务、Mock、fallback 和 localStorage 使用。
- 后端：`backend/app/main.py`、`backend/app/api/`、`backend/app/contracts/`、`backend/app/modules/`、`backend/migrations/versions/`。
- 测试：`backend/tests/contract/`、`backend/tests/auth_users/`、`backend/tests/human_interviews/`。
- 文档：`README.md`、`docs/*.md`、`docs/archive/` 下的 Markdown。

未检查或未验证：

- 未启动前后端服务做浏览器级完整流程验证。
- 未执行全量后端测试和前端构建。
- 未检查真实模型供应商、部署环境、线上数据库或外部服务配置。
- 未验证未提交代码改动的业务正确性，只按当前工作区文件事实记录文档漂移。

## 2. 对齐颗粒度

| 功能 / 页面 / 后端模块 / API / 数据模型 / 文档来源 | 当前状态 |
|---|---|
| 登录、注册、退出、当前用户 | 后端真实实现，前端通过 `authService` 接 `/api/v1/auth/*`；有 pytest 覆盖。 |
| 简历管理与解析 | 前端 `resume-parser` 使用浏览器 localStorage 和本地解析逻辑；后端 `/api/v1/resumes` 保存文本和结构化 JSON，但 `data_source="mock"`，未实现真实 PDF/DOCX 上传解析链路。 |
| 岗位发布与 JD 解析 | 后端 `/api/v1/jobs`、`/api/v1/jobs/{job_id}/parse` 存在；parse 使用 `demo_profile()` 和 mock ai_run，不是真实模型解析。 |
| 职业画像 | 文档描述为 P0 真实能力；代码中 `profiles` 模块未形成模型/API/服务闭环，主要通过 demo detail 或前端展示承载。 |
| 人岗匹配 | 后端有 `applications`、`match_results` 表和 demo API；匹配结果主要由 mock payload 提供，未见独立 `match_rule_v1` 规则实现 API。 |
| 智能面试提问 / 面试会话 | 前端有 `/interview` mock 页面；后端 `interviews` 模块无完整 router/service/model 落地。 |
| 岗位能力试炼 | 后端有 `trial_tasks`、`trial_submissions` 表和 demo API；前端通过 `trial-demo` 接 API 后 fallback localStorage，评价使用预设结果。 |
| AI 面试证据链报告 | 后端有 `evaluation_reports` 表和 generate/confirm/get demo API；报告生成使用预设 payload 和 mock ai_run，不是真实模型生成。 |
| 多 Agent 协作面板 | 前端 `/hr/agent-runs` 读取 `/api/v1/ai-runs` 并可 fallback；后端记录 `ai_runs`，但当前运行记录来自 demo/mock 操作，不是完整固定 Orchestrator。 |
| 智能招聘工作台 | 前端 HR 页面存在，部分通过 `hirelinkApi` 和 demo store 读取；核心指标仍混合 demo ID、localStorage 和后端 demo API。 |
| 真人面试预约 | 后端 `human_interviews` API、迁移和测试较完整；前端 `human-interviews` 页面组存在，但服务层主要使用 localStorage fallback，未接后端 API。 |
| 站内通知 | 后端 `/api/v1/notifications` 存在并有用户隔离测试；前端通知服务当前使用 localStorage。 |
| 数据模型 | 已有 auth、核心 demo 业务、ai_runs、human_interview、notifications 等表；`p0-contracts.md` 的 17 实体冻结口径已落后于当前迁移。 |
| PRD / roadmap / architecture / contract / implementation notes / demo guide | 多数文档仍以目标状态或历史基线描述 P0，缺少“当前代码实现状态”分层说明。 |

## 3. 已实现但文档缺失

| 模块或功能 | 代码位置 | 当前实现事实 | 缺失的文档位置 | 建议更新方式 | 优先级 |
|---|---|---|---|---|---|
| 认证 demo 账号修复 | `backend/app/modules/auth_users/service.py` | 登录前会 `ensure_demo_accounts()`，并修复 HR/求职者 demo 账号显示名和组织归属。 | README、architecture、roadmap | 更新原文档 | P1 |
| 真人面试后端 API | `backend/app/modules/human_interviews/router.py`、`service.py` | 支持邀约、撤回、档期、候选人预约、取消、改期、状态标记、报告提交/发布。 | README、architecture、roadmap、p0-contracts | 更新原文档 | P0 |
| 真人面试状态历史与审计 | `backend/app/modules/human_interviews/models.py`、`service.py` | 有 `human_interview_booking_status_history` 和 `human_interview_audit_records`。 | architecture、p0-contracts | 更新原文档 | P1 |
| pending confirmation | `backend/app/modules/human_interviews/router.py`、迁移 `20260621_0004` | 支持待补全确认、6 小时过期释放、恢复确认。 | README、PRD、roadmap、architecture | 更新原文档 | P0 |
| 真人面试提醒维护接口 | `/api/v1/human-interviews/maintenance/reminders` | 可生成面试提醒并保持幂等测试。 | roadmap、architecture、contracts | 更新原文档 | P1 |
| 通知后端 API | `backend/app/modules/notifications/router.py` | 支持列表、单条已读、全部已读，用户隔离。 | README、architecture、p0-contracts | 更新原文档 | P0 |
| 前端通知入口 | `src/routes/notifications.tsx`、`src/components/site/Nav.tsx` | 导航和通知页存在，但数据服务仍为 localStorage。 | README、architecture | 更新原文档并标注前端 demo 存储 | P1 |
| 前端真人面试页面组 | `src/routes/human-interviews*.tsx`、`src/components/human-interviews/` | 有预约总入口、HR 管理、候选人邀约、候选人列表等页面。 | README、architecture | 更新原文档并标注未接后端 API | P0 |

## 4. 文档已写但代码未实现

| 文档位置 | 文档原描述 | 当前代码事实 | 风险 | 建议处理 | 优先级 |
|---|---|---|---|---|---|
| `README.md` 核心功能 / 技术架构 | 简历解析、JD 解析、匹配、面试题、岗位试炼、报告作为完整当前流程描述。 | 多数核心链路由 mock/demo/localStorage 承载。 | 读者误以为生产级主链路已完成。 | 降级为 Mock/demo 或当前目标。 | P0 |
| `docs/prd.md` 第 7-8 节 | MVP 的 AI 文本能力需要真实实现。 | 当前未接真实模型供应商；demo service 创建 mock ai_run 和预设 payload。 | 产品承诺与代码事实冲突。 | 标注为 P0 目标/规划，新增当前代码边界。 | P0 |
| `docs/roadmap.md` 第 9 节 | 必须真实实现简历解析、岗位解析、画像、匹配、报告等。 | 当前部分只有模型、demo API 或前端静态/本地实现。 | 误导后续排期和验收。 | 改为“目标真实实现”，补充当前状态。 | P0 |
| `docs/architecture.md` Agent / AI 描述 | 固定 Orchestrator 与多 Agent 真实工作流。 | 当前只有 `ai_runs` 记录和 mock 操作，无完整 Orchestrator。 | 架构图过度描述已实现能力。 | 降级为目标架构，标注当前 mock ai_runs。 | P0 |
| `docs/architecture.md` 文件解析 | PDF/DOCX 文本抽取与结构化解析基础设施。 | 依赖存在，但未见完整上传文件 router/service 接入；当前 `/resumes` 接 JSON payload。 | 文件能力被高估。 | 标注为未完整接入。 | P1 |
| `docs/p0-contracts.md` 实体冻结 | 冻结 17 个 P0 实体。 | 迁移已新增 notifications 和多张 human_interview 表。 | 契约文档落后于迁移事实。 | 加状态注记和当前扩展清单。 | P0 |
| `docs/p0-implementation-baseline.md` 第 1 节 | 本轮不实现完整认证业务、完整闭环和前后端联调。 | 认证、demo 核心 API、真人面试后端、部分前端联调已存在。 | 历史基线被误读为当前状态。 | 标注为历史基线。 | P1 |

## 5. 文档与代码冲突

| 冲突点 | 文档说法 | 代码事实 | 应以谁为准 | 修复建议 | 涉及文件 |
|---|---|---|---|---|---|
| P0 真实能力范围 | PRD/roadmap 把多个能力写成真实实现要求。 | 当前核心闭环大量 `data_source="mock"`、fallback、localStorage。 | 代码事实 | 加“当前代码状态”说明，目标与事实分层。 | `README.md`、`docs/prd.md`、`docs/roadmap.md` |
| 实体清单 | `p0-contracts.md` 冻结 17 个实体。 | 已有 `notifications` 和 `human_interview_*` 迁移表。 | 迁移事实 | 保留 Frozen v1，新增扩展说明。 | `docs/p0-contracts.md` |
| 认证实现状态 | P0 基线说不实现完整认证业务。 | `/api/v1/auth/register/login/logout/me` 已实现并测试。 | 代码事实 | 将基线标注为历史阶段文件。 | `docs/p0-implementation-baseline.md` |
| 真人面试状态 | README/PRD 仍称 P1 规划或当前不实现。 | 后端 API/表/测试已实现；前端仍 demo 存储。 | 双方分层 | 改为“后端已实现基础闭环，前端未接 API，产品阶段仍不等于 P0 主闭环”。 | `README.md`、`docs/prd.md`、`docs/roadmap.md`、`docs/architecture.md` |
| 通知能力 | 文档较少描述站内通知实现。 | 后端通知 API 存在，前端通知页使用 localStorage。 | 代码事实 | 增补为“后端已实现，前端当前本地存储”。 | `README.md`、`docs/architecture.md` |
| AI Orchestrator | 架构文档描述固定 Agent Orchestrator。 | 当前没有完整固定工作流实现；只有 mock ai_runs 和展示。 | 代码事实 | 降级为目标架构/展示层当前状态。 | `docs/architecture.md` |

## 6. Mock 与真实能力边界

### 当前真实实现

- FastAPI app、`/health`、`/api/v1` 路由前缀、统一响应、错误处理、请求 ID。
- SQLite + SQLAlchemy + Alembic 迁移。
- 认证注册、登录、退出、`/auth/me`，JWT HttpOnly Cookie，Argon2id 密码哈希，demo 账号自动修复。
- 核心 demo API：岗位、简历、申请、候选人列表、岗位试炼、报告、HR 决策和 ai_runs 查询。
- 真人面试后端：邀约、档期、预约、取消、改期、履约状态、pending confirmation、提醒维护、真人面试报告、审计和通知写入。
- 通知后端：列表、单条已读、全部已读，并按用户隔离。
- 后端测试覆盖：contract、auth_users、human_interviews。

### 当前 Mock 实现

- `backend/app/modules/demo_data/service.py` 中岗位、简历、匹配结果、岗位试炼、任务评价、报告 payload 多处标记 `data_source="mock"` 或 `source="mock"`。
- JD parse、resume parse、trial task、trial evaluation、report generate 创建 mock ai_run 或使用预设结构。
- 匹配结果以预设 `total_score` 和 payload 为主，未见完整确定性评分服务 API。
- Agent 运行记录主要用于展示 mock/demo 操作过程。

### 当前仅 UI 演示

- `/resume`、`/match`、`/interview`、`/network` 等页面大量使用 localStorage、`mock-data` 或浏览器本地解析。
- 真人面试前端页面组通过 `src/lib/human-interviews/service.ts` 使用 localStorage/fallback 状态，没有接 `/api/v1/human-interviews/*`。
- 前端通知服务 `src/lib/notifications/service.ts` 使用 localStorage，没有接 `/api/v1/notifications`。

### 当前仅文档规划

- 真实模型供应商接入。
- 完整 PDF/DOCX 上传、文本抽取、文件鉴权下载和保留策略。
- 独立职业画像模块和职业画像版本 API。
- 完整智能面试题集、面试会话、逐题回答后端。
- 固定多 Agent Orchestrator。
- 动态追问、音视频回放、可信面试、企业人才运营、AI 内推网络、ATS 对接。

## 7. 文档更新决策

| 文档 | 是否需要更新 | 更新内容 |
|---|---|---|
| `README.md` | 需要 | 增加“当前实现状态”小节，明确真实、mock/demo、前端本地存储和真人面试后端/前端断点；新增本审计文档链接。 |
| `docs/prd.md` | 需要 | 保留产品目标，增加“截至当前代码实现状态”说明，把未完成能力标注为目标/规划，不写成已完成。 |
| `docs/roadmap.md` | 需要 | 增加当前代码状态；将“必须真实实现的部分”改成“P0 目标真实实现的部分”。 |
| `docs/architecture.md` | 需要 | 增加当前实现快照，说明 demo_data、human_interviews、notifications、profiles/interviews 的真实状态。 |
| `docs/p0-contracts.md` | 需要 | 加历史基线/已扩展注记，补充当前实际 API 和实体扩展摘要。 |
| `docs/p0-implementation-baseline.md` | 需要 | 加历史基线注记，避免被误读为当前状态。 |
| `docs/p0-parallel-task-map.md` | 需要 | 加历史任务图注记，说明当前实现已超过 F0-F5 原范围。 |
| `docs/HireLink-AI大赛作品说明文档.md` | 需要小改 | 加演示/规划能力边界提示，不重写比赛说明。 |
| 是否新增其他文档 | 暂不需要 | 本次新增审计文档已承载临时审计结果和修复计划。 |

## 8. 建议执行顺序

1. 先新增本审计文档，固定代码事实与修复依据。
2. 先修正误导性最强的 `README.md`、`docs/prd.md`、`docs/roadmap.md`。
3. 再更新 `docs/architecture.md` 和 `docs/p0-contracts.md`，补齐当前模块/API/实体状态。
4. 再给 `docs/p0-implementation-baseline.md`、`docs/p0-parallel-task-map.md` 加历史基线注记。
5. 最后小改作品说明文档，避免把演示/规划能力写成生产完成度。
