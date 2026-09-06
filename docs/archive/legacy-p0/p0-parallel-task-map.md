# Archived：JobFit / HireLink P0 任务地图

> 此文件为旧 HireLink P0 历史文档，内容已归纳进 docs/implementation-plan.md、docs/progress.md、docs/implementation-status.md 和 docs/architecture-decisions.md，不再作为当前 JobFit 主文档入口。
>
> **生命周期：deprecated。** 本文件仅保留历史任务编号和迁移说明，不再定义任务设计、依赖、完成条件、并行关系或实时状态。

## 保留的任务身份

- `JF-P0-01` 至 `JF-P0-06` 是 JobFit P0 的历史规划标识，阶段目标和依赖摘要见 [roadmap.md](../../roadmap.md)。
- `JF-P1-01` 至 `JF-P1-04` 的当前 pending 定义见 [implementation-plan.md](../../implementation-plan.md)，真实状态见 [progress.md](../../progress.md)。
- `JF-DOC-01` 和 `JF-DOC-02` 的计划与运行记录只以当前 Plan / Progress 为准。
- 更早的 P0-F 系列属于历史招聘平台标识，仅在 Git 历史或归档中保留，不得复用或重新编号。

## 职责迁移

| 原有职责 | 替代主源 |
| --- | --- |
| 阶段、里程碑与方向依赖 | [roadmap.md](../../roadmap.md) |
| 可执行 Task、Done When、验证、风险与 Gate | [implementation-plan.md](../../implementation-plan.md) |
| 当前状态、执行者、证据、阻塞和事件历史 | [progress.md](../../progress.md) |
| 代码与测试是否存在 | [implementation-status.md](../../implementation-status.md) |

## 归档建议

本文件已于本轮移动至 `docs/archive/legacy-p0/`。后续不得通过删除或重编号消除历史；如需调整归档内容，只能补充历史说明或修复链接。
