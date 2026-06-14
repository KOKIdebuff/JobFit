# HireLink P0 并行任务地图

> 状态：Frozen v1  
> 启动闸门：主控线程确认三份 P0 基线文档一致后，才允许启动 child agent。  
> 总原则：公共文件单一所有者；业务线程发现契约缺失时提交变更请求，不得直接修改公共基线。

## 1. 依赖顺序

```text
P0-F0 基础骨架与公共契约
  -> P0-F1 数据模型与初始迁移
       -> P0-F2 Mock AI 与文本解析
       -> P0-F3 确定性匹配
       -> P0-F4 演示数据
            -> P0-F5 API 契约与集成验收
```

`F2`、`F3`、`F4` 在 `F1` 合入并通过迁移验证后并行。`F5` 只在三条并行任务均完成后开始。

## 2. 任务定义

### P0-F0 基础骨架与公共契约

**目标**

建立可运行、可测试、可扩展但不包含具体业务实现的 FastAPI 模块化单体骨架。

**输入**

- `docs/p0-implementation-baseline.md`
- `docs/p0-contracts.md`

**输出**

- `backend/` 目录、Python 3.12 和 uv 项目配置。
- FastAPI app factory、`/health`、`/api/v1` 总路由。
- 配置、请求 ID、中间件、统一响应、异常处理和结构化日志。
- 同步 SQLAlchemy session、公共 Base 和 UUID/时间类型。
- Mock AI 公共 Protocol 占位和测试基座。

**允许修改**

- `backend/pyproject.toml`
- `backend/uv.lock`
- `backend/.python-version`
- `backend/app/main.py`
- `backend/app/core/**`
- `backend/app/db/**`
- `backend/app/api/router.py`
- `backend/app/contracts/**`
- `backend/tests/conftest.py`
- `backend/tests/contract/test_response_contract.py`

**禁止修改**

- 现有 `docs/prd.md`、`docs/architecture.md`、`docs/roadmap.md`
- 根目录前端代码和依赖
- 任何业务模块实现

**验收命令**

```powershell
cd backend
uv sync
uv run ruff format --check .
uv run ruff check .
uv run mypy app
uv run pytest tests/contract/test_response_contract.py
```

**Done When**

- `/health` 可返回统一成功响应。
- FastAPI 校验错误和未知异常都符合统一错误格式。
- 请求 ID 同时进入响应 Header、响应 meta 和日志。
- 业务模块可以注册 Router，但骨架不包含领域逻辑。

### P0-F1 数据模型与初始迁移

**目标**

统一建立 architecture 已冻结的 17 个实体模型、关系、索引和首个可回滚迁移。

**输入**

- F0 的数据库基座。
- architecture 数据实体、状态和权限关系。
- 本文档的模块所有权。

**输出**

- 所有模块的 `models.py`。
- ORM 模型统一注册。
- Alembic 初始迁移。
- SQLite 外键、唯一约束、必要索引和迁移测试。

**允许修改**

- `backend/app/modules/*/models.py`
- `backend/app/db/base.py`
- `backend/migrations/env.py`
- `backend/migrations/versions/**`
- `backend/tests/integration/test_migrations.py`
- `backend/tests/unit/test_model_constraints.py`

**所有权要求**

F1 是模型和迁移的唯一写入者。其他并行线程只能消费模型，不得新增列、表、索引或迁移。

**验收命令**

```powershell
cd backend
uv run alembic upgrade head
uv run alembic check
uv run pytest tests/integration/test_migrations.py tests/unit/test_model_constraints.py
```

**Done When**

- 空数据库可迁移到 `head`，再 downgrade 到 `base`。
- 17 个实体名称与 `docs/p0-contracts.md` 完全一致。
- 关键关系、唯一约束和状态字段存在。
- 所有主键为 UUID4，所有时间字段遵守 UTC 基线。

### P0-F2 Mock AI 与文本解析

**目标**

实现不依赖真实供应商的结构化 AI 调用链，以及 PDF/DOCX 文本抽取和简历/JD 解析基础设施。

**输入**

- F0 AI Contract。
- F1 的 `resumes`、`jobs`、`ai_runs` 模型。
- 简历和 JD 的 P0 字段要求。

**输出**

- Mock Provider、AI Adapter 和故障注入。
- `ai_runs` Repository/Service。
- PDF、DOCX 文本抽取，扩展名/MIME/大小校验。
- 简历解析和 JD 解析的 Pydantic Schema、Service、Repository 与 API。
- 成功、失败、非法输出和 fallback 测试。

**允许修改**

- `backend/app/modules/ai_runs/{router,schemas,service,repository}.py`
- `backend/app/modules/resumes/{router,schemas,service,repository}.py`
- `backend/app/modules/jobs/{router,schemas,service,repository}.py`
- `backend/tests/unit/test_ai_adapter.py`
- `backend/tests/unit/test_text_extractors.py`
- `backend/tests/integration/test_resume_parse.py`
- `backend/tests/integration/test_job_parse.py`

**禁止修改**

- 任意 `models.py`、迁移、公共 Contract、公共异常和依赖版本。
- 接入真实模型 SDK。

**验收命令**

```powershell
cd backend
uv run pytest tests/unit/test_ai_adapter.py tests/unit/test_text_extractors.py
uv run pytest tests/integration/test_resume_parse.py tests/integration/test_job_parse.py
```

**Done When**

- Mock 结果确定且通过与真实 Provider 相同的 Schema 校验。
- PDF/DOCX 可提取文本；扫描 PDF、旧 DOC、MIME 不匹配和超限文件返回冻结错误码。
- `ai_runs` 包含模型、Prompt/Schema 版本、状态、耗时和脱敏摘要。
- 测试过程不访问公网。

### P0-F3 确定性匹配

**目标**

实现 `match_rule_v1` 的四维确定性评分，确保分数和排序不由 LLM 决定。

**输入**

- 已确认岗位画像 DTO。
- 职业画像、结构化简历和求职意向 DTO。
- application 授权关系。
- 固定权重：技能 30%、经历 25%、项目 35%、求职意向 10%。

**输出**

- `match_rule_v1` 纯函数规则。
- 四维分、总分、命中项、缺口和解释输入 DTO。
- application 和 match_result 的 Service、Repository 与 API。
- 边界、确定性和排序测试。

**允许修改**

- `backend/app/modules/applications_matches/{router,schemas,service,repository}.py`
- `backend/tests/unit/test_match_rule_v1.py`
- `backend/tests/integration/test_match_api.py`

**禁止修改**

- `models.py`、迁移、AI Adapter 和公共 Contract。
- 使用随机数、模型裸打分或向量数据库。

**验收命令**

```powershell
cd backend
uv run pytest tests/unit/test_match_rule_v1.py
uv run pytest tests/integration/test_match_api.py
```

**Done When**

- 相同输入始终得到相同四维分、总分和排序。
- 总分严格使用 30/25/35/10 权重并限制在 0 到 100。
- 缺失信息只产生扣分或待验证项，不自动拒绝候选人。
- 敏感属性不会进入评分和解释输入。

### P0-F4 演示数据

**目标**

提供可重复导入、可识别来源、可恢复的完整基础演示数据。

**输入**

- F1 数据模型。
- roadmap 至少 2 个岗位、3 份候选人数据的要求。
- Frozen v1 文档中已定义的实体名称、状态、固定 UUID 和 `data_source` 规则。

**输出**

- 固定 UUID 的 JSON/结构化演示数据。
- 幂等 seed 脚本。
- 仅清理非演示数据并恢复演示快照的受控 reset 脚本。
- 数据来源和重复执行测试。

**允许修改**

- `backend/app/modules/demo_data/{schemas,service,repository}.py`
- `backend/scripts/seed_demo.py`
- `backend/scripts/reset_demo.py`
- `backend/tests/integration/test_demo_seed.py`
- `backend/tests/fixtures/demo/**`

**禁止修改**

- 面向普通用户提供 reset Router。
- 修改模型、迁移、公共 Contract 或其他模块实现。

**验收命令**

```powershell
cd backend
uv run python scripts/seed_demo.py
uv run python scripts/seed_demo.py
uv run pytest tests/integration/test_demo_seed.py
```

**Done When**

- 连续执行 seed 不产生重复记录。
- 至少包含 2 个岗位和 3 个候选人的基础数据；F2/F3 完成后由 F5 验证解析与匹配兼容性。
- 所有 ID 固定，所有预置结果可识别 `data_source`。
- reset 不删除演示快照定义，且不能通过普通业务 API 触发。

### P0-F5 API 契约与集成验收

**目标**

验证公共响应、错误码、OpenAPI、模型关系和并行模块之间的契约一致性。

**输入**

- F0-F4 全部合入结果。
- 三份 Frozen v1 基线文档。

**输出**

- 契约测试、跨模块集成测试和 OpenAPI 快照/断言。
- 冲突清单及最小修复。
- P0 基础设施可启动结论。

**允许修改**

- `backend/tests/contract/**`
- `backend/tests/integration/**`
- 由主控明确授权的公共文件缺陷修复

**验收命令**

```powershell
cd backend
uv sync --frozen
uv run ruff format --check .
uv run ruff check .
uv run mypy app
uv run alembic upgrade head
uv run alembic check
uv run pytest
```

**Done When**

- 成功、分页、参数错误、认证、权限、404、冲突、AI 和文件错误场景全部通过。
- OpenAPI 中所有 `/api/v1` JSON 接口引用统一响应模型。
- 模块间不存在跨 Repository、跨 Model 或隐式 commit。
- Mock AI、解析、匹配和演示数据可在离线环境完整测试。

## 3. P0 能力映射

| P0 能力 | 后端模块 | 当前任务 |
|---|---|---|
| 登录和基础角色权限 | `auth_users` | F0/F1 只建公共安全基座和模型；完整认证后续实施 |
| 简历上传与解析 | `resumes`、`ai_runs` | F1、F2 |
| 岗位发布与 JD 解析 | `jobs`、`ai_runs` | F1、F2 |
| 职业画像 | `profiles`、`ai_runs` | F1 建模；生成逻辑后续实施 |
| 人岗匹配 | `applications_matches` | F1、F3 |
| 智能面试提问 | `interviews`、`ai_runs` | F1 建模；P0 预生成逻辑后续实施，P2 动态追问不进入当前任务 |
| 岗位能力试炼 | `trials`、`ai_runs` | F1 建模；P0 单任务业务逻辑后续实施，P2 多步骤形态不进入当前任务 |
| 轻量面试与文字稿 | `interviews` | F1 建模；业务逻辑后续实施 |
| 证据链报告 | `reports`、`ai_runs` | F1 建模；生成逻辑后续实施 |
| 智能招聘工作台 | 查询 `jobs`、`applications_matches`、`reports` | 当前不实施前端/聚合 API；P1 Copilot、对比和批量能力不进入当前任务 |
| 求职者成长中心 | `profiles`、`reports` | 当前不实施视图 API；P1 学习路径和复盘训练不进入当前任务 |
| 多 Agent 面板 | `ai_runs` | F1、F2 提供真实运行记录基础 |
| 演示预置数据 | `demo_data` | F1、F4 |

该映射说明全部 P0 能力都有明确模块归属，但不表示本轮已实现完整业务闭环。

## 4. 公共文件保护

### 4.1 仅主控/基线负责人可修改

- `docs/p0-implementation-baseline.md`
- `docs/p0-contracts.md`
- `docs/p0-parallel-task-map.md`
- `docs/prd.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `backend/pyproject.toml`
- `backend/uv.lock`
- `backend/.python-version`
- `backend/app/main.py`
- `backend/app/core/**`
- `backend/app/db/session.py`
- `backend/app/db/base.py`
- `backend/app/db/types.py`
- `backend/app/api/router.py`
- `backend/app/contracts/**`
- `backend/migrations/env.py`
- `backend/migrations/versions/**`
- `backend/tests/conftest.py`
- 根目录 `package.json`
- 根目录 `bun.lock`
- `src/router.tsx`
- `src/routeTree.gen.ts`

F1 经主控授权后是 `models.py` 和迁移版本链的临时唯一负责人。任务完成后所有权自动回到主控。

### 4.2 业务线程修改边界

业务 child agent 只能修改：

- 分配给自己的 `backend/app/modules/<module>/` 标准文件。
- 对应的 `backend/tests/unit/`、`backend/tests/integration/` 测试文件。
- 任务中明确列出的 `backend/scripts/` 或 fixture。

不得顺手格式化、重命名或重构其他模块和前端文件。

## 5. 契约变更流程

发现公共契约缺失或冲突时：

1. 停止修改公共文件。
2. 向主控提交变更请求，写明问题、影响任务、候选方案、兼容性和所需文件。
3. 主控更新三份基线文档中的相关口径。
4. 公共测试更新并通过后，发布新的 Frozen 版本。
5. 业务线程基于新版本继续。

不得通过复制公共类型、创建临时同义错误码或跨模块直连来绕过等待。

## 6. 启动检查清单

主控在启动 child agent 前必须确认：

- 三份文档均为 `Frozen v1`。
- F0、F1、F2、F3、F4、F5 各有唯一负责人。
- 每个线程只拿到其“允许修改”文件清单。
- F0 未完成前不启动 F1；F1 未完成前不启动 F2/F3/F4。
- F5 不与 F2/F3/F4 同时修改集成测试。
- 当前工作区既有未提交改动已明确排除在 child agent 任务外。
- 未授权线程不会修改 PRD、architecture、roadmap、根前端依赖或路由生成文件。
