# Archived：JobFit / HireLink P0 实施基线

> 此文件为旧 HireLink P0 历史文档，内容已归纳进 docs/implementation-plan.md、docs/progress.md、docs/implementation-status.md 和 docs/architecture-decisions.md，不再作为当前 JobFit 主文档入口。
>
> **生命周期：deprecated。** 本文件只保留历史 P0 基线的追溯入口，不再定义当前产品、技术边界、任务、代码状态或质量门。

## 替代主源

| 原有内容 | 当前权威位置 |
| --- | --- |
| JobFit 产品目标、能力边界和数据最小化原则 | [prd.md](../../prd.md) 与 [architecture-decisions.md](../../architecture-decisions.md) |
| 技术结构、模块边界和当前/目标架构 | [architecture.md](../../architecture.md) |
| 代码、迁移、配置与测试可证明的状态 | [implementation-status.md](../../implementation-status.md) |
| 当前 API、幂等、错误、文件和配置兼容语义 | [implementation-plan.md](../../implementation-plan.md) 的 P0 接口与契约基线 |
| 可执行任务、验证和风险 | [implementation-plan.md](../../implementation-plan.md) |
| 实际执行状态与证据 | [progress.md](../../progress.md) |

## 保留理由

该文件曾承载 P0 实施基线。其历史内容仍可通过 Git 历史恢复和审计，但继续在正文复制当前实现状态、模块边界或质量命令会造成多个事实源并可能与 JobFit Runtime 漂移。

## 归档建议

本文件已于本轮移动至 `docs/archive/legacy-p0/`。后续只可维护历史说明和链接，不能重新把本文件作为当前代码事实或工程质量门来源。
