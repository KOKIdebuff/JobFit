# P0 Integration Issues

## F0-001 通用路由错误码未冻结

- 发现位置：`docs/p0-contracts.md` 只冻结了业务资源 `NOT_FOUND`，没有冻结通用
  API 路由不存在和 Method Not Allowed 的错误码。
- 当前兼容处理：F0 暂时将框架 404/405 映射为 HTTP 400 +
  `COMMON_BAD_REQUEST`，避免新增未授权错误码。
- 集成影响：F5 应确认是否新增 `COMMON_NOT_FOUND`、`COMMON_METHOD_NOT_ALLOWED`，
  或维持当前兼容行为，并补充契约测试。

## F0-002 Service Protocol 方法签名未冻结

- 发现位置：`docs/p0-contracts.md` 只冻结了九个 Service Protocol 的名称和最低职责，
  没有冻结方法名、参数 DTO、返回 DTO 和事务语义的类型签名。
- 当前兼容处理：F0 仅声明九个空 `Protocol` 作为公共导入入口，不猜测业务方法。
- 集成影响：对应业务 DTO 冻结后，应由公共文件 Owner 一次性补齐方法签名；业务线程
  不应复制同义 Protocol。

## F0-003 配置项名称未逐项列出

- 发现位置：基线要求遵守配置命名规则，但 Frozen v1 未列出具体环境变量键。
- 当前兼容处理：统一使用 `HIRELINK_` 前缀，首批键为
  `HIRELINK_ENVIRONMENT`、`HIRELINK_LOG_LEVEL`、`HIRELINK_DATABASE_URL` 和
  `HIRELINK_SQLITE_BUSY_TIMEOUT_MS`。
- 集成影响：后续线程新增配置必须继续使用该前缀，并由公共文件 Owner集中维护。
