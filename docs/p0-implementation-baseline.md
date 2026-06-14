# HireLink P0 实施基线

> 状态：Frozen v1  
> 生效范围：P0 后端骨架、数据层、AI 适配层、解析、匹配和演示数据并行开发  
> 上游依据：`docs/prd.md`、`docs/architecture.md`、`docs/roadmap.md`  
> 变更规则：仅主控线程或其明确指定的基线负责人可以修改本文档。

## 1. 目标与边界

本文档把现有产品与架构决策转换为并行编码必须共同遵守的工程基线。P0 采用独立 `backend/` 工程承载 FastAPI 模块化单体，保留现有 React / TanStack Start 前端，不拆仓库、不改写现有前端结构。

本轮基线只允许建设以下能力：

- FastAPI 模块化单体骨架。
- SQLite、Alembic 迁移和基础数据模型。
- 统一响应、异常、日志和请求追踪。
- Mock AI 适配层。
- PDF / DOCX 文本抽取与简历、JD 解析基础设施。
- `match_rule_v1` 确定性匹配原型。
- 可重复导入和重置的演示数据。

本轮不实现完整认证业务、完整招聘闭环、真实模型供应商接入和前后端联调。后续业务线程必须以本基线和 `docs/p0-contracts.md` 为公共契约。

## 2. 技术栈冻结

### 2.1 运行环境

| 项目 | 冻结选择 | 说明 |
|---|---|---|
| Python | 3.12.x | 开发、CI、Docker 使用同一小版本系列；不得以本机 3.14 生成锁文件 |
| Web 框架 | FastAPI 0.136.* | REST API 与 OpenAPI |
| 数据校验 | Pydantic 2.13.* | API DTO、AI 结构化输出和配置校验 |
| 配置 | pydantic-settings 2.14.* | 环境变量是运行配置唯一入口 |
| ORM | SQLAlchemy 2.0.* 同步模式 | P0 不使用 AsyncSession 或 aiosqlite |
| 数据库 | SQLite 3 | 开启 foreign keys，设置合理 busy timeout |
| 迁移 | Alembic 1.18.* | 所有表结构变更必须通过迁移 |
| ASGI Server | Uvicorn 0.49.* | 本地开发和容器运行 |
| 依赖管理 | uv + pyproject.toml + uv.lock | `pyproject.toml` 表达兼容范围，`uv.lock` 冻结精确依赖树 |

实施前由基线负责人安装 Python 3.12 和 `uv`。当前机器检测到 Python 3.14.5，且 `uv` 不在 PATH；该环境不能直接作为基线锁定环境。

### 2.2 直接依赖范围

| 类型 | 依赖 |
|---|---|
| API | `fastapi>=0.136,<0.137`、`uvicorn[standard]>=0.49,<0.50`、`python-multipart==0.0.32` |
| 数据 | `sqlalchemy>=2.0,<2.1`、`alembic>=1.18,<1.19` |
| 配置与 DTO | `pydantic>=2.13,<2.14`、`pydantic-settings>=2.14,<2.15` |
| 认证基础 | `pyjwt>=2.13,<2.14`、`pwdlib[argon2]>=0.3,<0.4` |
| 文档解析 | `pypdf>=6.13,<6.14`、`python-docx>=1.2,<1.3` |
| HTTP 与日志 | `httpx>=0.28,<0.29`、`structlog>=26.1,<26.2` |
| 测试与质量 | `pytest>=9.0,<9.1`、`ruff>=0.15,<0.16`、`mypy>=2.1,<2.2` |

`uv.lock` 是精确版本的唯一来源。业务线程不得直接修改依赖范围或添加模型供应商 SDK；新增依赖必须由主控线程评审。

## 3. 后端目录结构

```text
backend/
├─ pyproject.toml
├─ uv.lock
├─ .python-version
├─ alembic.ini
├─ app/
│  ├─ main.py
│  ├─ api/
│  │  └─ router.py
│  ├─ contracts/
│  │  ├─ api.py
│  │  ├─ errors.py
│  │  ├─ pagination.py
│  │  ├─ ai.py
│  │  └─ services.py
│  ├─ core/
│  │  ├─ config.py
│  │  ├─ exceptions.py
│  │  ├─ error_handlers.py
│  │  ├─ logging.py
│  │  ├─ middleware.py
│  │  ├─ security.py
│  │  └─ time.py
│  ├─ db/
│  │  ├─ base.py
│  │  ├─ session.py
│  │  └─ types.py
│  └─ modules/
│     ├─ auth_users/
│     ├─ resumes/
│     ├─ jobs/
│     ├─ profiles/
│     ├─ applications_matches/
│     ├─ interviews/
│     ├─ trials/
│     ├─ reports/
│     ├─ ai_runs/
│     └─ demo_data/
├─ migrations/
│  ├─ env.py
│  └─ versions/
├─ scripts/
└─ tests/
   ├─ conftest.py
   ├─ contract/
   ├─ integration/
   └─ unit/
```

每个 `app/modules/<module>/` 只允许以下标准业务文件：

```text
router.py
schemas.py
service.py
repository.py
models.py
```

允许存在不承载业务逻辑的 `__init__.py` 包标记。模块可以暂时不使用某个标准业务文件，但不得自行创建第二套 `config`、数据库 session、异常基类、响应包装、分页模型或跨模块共享工具。确需新增公共能力时，先向主控线程提交基线变更请求。

## 4. 模块职责

| 模块 | 拥有的职责 | 禁止承担的职责 |
|---|---|---|
| `auth_users` | organizations、users、密码和 JWT 基础、角色信息 | 读取或修改具体招聘业务资源 |
| `resumes` | 简历版本、文件元数据、文本抽取、结构化简历 | 生成职业画像或计算岗位匹配 |
| `jobs` | 岗位、JD 原文、岗位画像和岗位状态 | 修改申请、匹配或面试状态 |
| `profiles` | 候选人职业画像和证据 | 直接读取文件系统或调用岗位 Repository |
| `applications_matches` | application 授权关系、`match_rule_v1`、匹配结果 | 生成面试题、任务或报告 |
| `interviews` | 题目集、题目、修改记录、会话和回答 | 保存音视频或作最终招聘决定 |
| `trials` | 岗位任务、最终提交、附件元数据和 AI 参考评价 | 主动访问外部提交链接 |
| `reports` | 单一证据链报告、角色视图和确认发布 | 修改 AI 原始内容或自动录用/淘汰 |
| `ai_runs` | AI Adapter、Mock Provider、运行追踪和脱敏摘要 | 修改业务模块状态或绕过 Service |
| `demo_data` | 固定演示数据、导入、清理和恢复脚本 | 提供面向普通用户的重置 API |

模块内调用顺序固定为：

```text
router -> service -> repository -> models
                 -> Service Protocol / DTO -> other module service
```

Router 不得直接访问 Repository。跨模块不得导入其他模块的 `repository.py` 或 `models.py`，不得提交其他模块拥有的事务。

## 5. 数据与编码约定

- 核心实体主键统一使用 UUID4，在 API 中表现为标准小写连字符字符串。
- ORM 中 UUID 使用公共 `GUID` TypeDecorator，SQLite 存储为 36 字符字符串；业务模块不得自定义 UUID 类型。
- 所有时间在应用内部使用带时区 UTC `datetime`，API 输出 ISO 8601 `Z` 格式，例如 `2026-06-13T08:30:00Z`。
- 数据库时间列由公共时间工具生成 UTC 值；不得使用本地时区、无时区时间或字符串时间参与业务判断。
- API 路径使用复数名词和 kebab-case，JSON 字段统一 `snake_case`。
- 枚举值统一使用稳定的小写 `snake_case` 字符串，不使用中文值或数据库原生 Enum。
- 金额、分数和权重禁止使用二进制浮点参与关键等值判断；匹配分在计算结束后统一限制到 `0..100`。
- JSON 结构化字段 P0 可存 SQLite JSON/TEXT，但写入前必须经过 Pydantic Schema 校验。
- 数据库事务由 Service 边界拥有；Repository 只执行查询和持久化，不在内部隐式 commit。
- SQLite 连接必须启用 `PRAGMA foreign_keys=ON`，并设置 busy timeout；测试使用独立临时数据库。

## 6. P0 明确不采用

- 异步 SQLAlchemy、`AsyncSession`、aiosqlite。
- Redis、Celery、消息队列和后台任务平台。
- LangGraph、自由决策 Agent 或运行时工作流编辑。
- 向量数据库、机器学习排序服务和独立推荐服务。
- 微服务、API Gateway、Kubernetes。
- 业务模块直接依赖具体大模型供应商 SDK。
- 音频、视频上传和持久化。
- 绕过 Alembic 的运行时建表作为正式初始化方式。

## 7. 公共质量门槛

后端骨架落地后统一使用以下命令：

```powershell
cd backend
uv sync --frozen
uv run ruff format --check .
uv run ruff check .
uv run mypy app
uv run pytest
uv run alembic upgrade head
uv run alembic check
```

完成标准：

- 全新 SQLite 数据库可从空库迁移到 `head`。
- 测试数据库不复用开发数据库。
- OpenAPI 可生成，所有业务响应引用统一契约。
- Mock AI 和确定性规则测试不访问公网。
- 日志与异常测试证明敏感字段不会进入标准日志。
- 三份 P0 基线文档不存在目录、名称、状态或所有权冲突。

版本范围核对来源：

- [FastAPI](https://pypi.org/project/fastapi/)
- [SQLAlchemy](https://pypi.org/project/SQLAlchemy/)
- [Alembic](https://pypi.org/project/alembic/)
- [Pydantic](https://pypi.org/project/pydantic/)
- [uv](https://pypi.org/project/uv/)
