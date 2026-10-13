---
name: api-auto-test
description: 后端接口自动化测试技能。读取 Controller/接口源码与 DTO/参数校验注解，自动分析入参与约束，设计正常/边界/异常测试用例，并通过内置 Node 执行器向本地 localhost 接口发起 HTTP（curl 风格）请求、断言响应、生成测试报告。当用户要求测试后端接口、跑接口自动化测试、验证 REST API、用 curl 调用本地服务、给 Controller 写/执行测试用例时加载此技能。
license: MIT
version: 1.0.0
tags: [接口测试, api, 自动化测试, 测试, test, curl, http, localhost, rest, controller, 后端, backend, 测试用例, postman]
---

# 后端接口自动化测试

目标：**读接口代码 → 推导入参用例 → 向 localhost 发请求 → 断言并出报告**，全流程自动化。

## ⚠️ 关键约束（务必先读）

1. **不能直接执行裸 `curl`。** 本 Agent 的 `shell_exec` 使用命令白名单，`curl` 不在其中，直接跑会报
   `Shell command not allowed by policy. Command prefix: curl`。
2. **正确做法：** 用本技能目录下的 Node 执行器发请求（`node` 在白名单内）：
   `/Users/ayuan/.yuan-claw/skills/api-auto-test/scripts/api-test.mjs`
   该脚本支持 **curl 风格** 的输入，你仍然可以用熟悉的 curl 语法描述请求，由脚本翻译成 HTTP 调用。
3. `shell_exec` 是 `dangerous` 级别，执行前会请求用户确认——这是正常的，向用户说明你在跑本地接口测试即可。
4. **只测试本地/内网地址**（`localhost`、`127.0.0.1`）。对 `POST/PUT/DELETE/PATCH` 等写操作，
   务必在报告中提示用户这会产生真实副作用（写库/发消息等），必要时先征得同意。
5. 需要更系统的用例设计方法（等价类、边界值、错误注入清单），读取本技能目录下
   `reference/test-case-design.md`（用绝对路径）。

---

## 工作流程（按阶段执行）

### 阶段 1：定位并阅读接口代码

用 `grep_text` / `read_file` 找到目标接口。常见检索模式：

```
@RequestMapping   @GetMapping   @PostMapping   @PutMapping   @DeleteMapping
@RestController   @Controller   @PathVariable  @RequestParam  @RequestBody
```

需要提取的信息：
- **HTTP 方法**（GET/POST/...）与**完整路径**（类级 `@RequestMapping` + 方法级注解拼接）。
- **入参来源**：`@PathVariable`（路径）、`@RequestParam`（查询串/表单）、`@RequestBody`（JSON body）、`@RequestHeader`（请求头）。
- **参数类型**：基本类型 / 包装类型 / DTO 对象（需 `read_file` 打开 DTO 看字段）。
- **校验约束**：`@NotNull` `@NotBlank` `@NotEmpty` `@Min` `@Max` `@Size` `@Pattern` `@Email` `@DecimalMin` 等。
- **枚举取值**：字段类型是枚举时，读取枚举类拿到合法值集合。
- **鉴权要求**：是否有 `@PreAuthorize`、拦截器、`Authorization`/token/cookie 头，或全局登录校验。
- **服务端口与 context-path**：查 `application.yml`/`application.properties` 的 `server.port`、`server.servlet.context-path`，拼出 `baseUrl`。

### 阶段 2：分析入参，构建参数模型

为每个参数整理：名称、位置（path/query/body/header）、类型、是否必填、取值范围/正则/枚举、示例值。
把它落成一张表（写进最终报告），这是设计用例的依据。

### 阶段 3：设计测试用例

每个接口至少覆盖以下类别（详见 `reference/test-case-design.md`）：

| 类别 | 说明 |
|------|------|
| 正常用例 | 全部必填参数合法，期望成功（2xx / 业务 code=0） |
| 边界值 | 数值取 min/min-1/max/max+1；字符串取长度上下界 |
| 必填校验 | 逐个删除/置空必填参数，期望校验失败（400 / 业务错误码） |
| 类型/格式非法 | 字符串传数字位、超长、非法枚举、错误邮箱/手机号正则 |
| 鉴权用例 | 不带 token / 带非法 token，期望 401/403 |
| 幂等与副作用（可选） | 重复提交、越权 id 访问等 |

每个用例给出：`name`、请求参数、`expect`（期望状态码 + 期望响应包含内容或字段值）。

### 阶段 4：确认服务在运行

先探活，避免把"连不上"误判为用例失败：

```bash
node /Users/ayuan/.yuan-claw/skills/api-auto-test/scripts/api-test.mjs --health http://localhost:8080
```

若连不上，提示用户先启动后端服务（并给出端口），不要盲目重试。

### 阶段 5：生成测试配置并写入文件

把用例组织成 JSON 配置（结构见下），用 `write_file` 写到 skill 目录下，例如：
`/Users/ayuan/.yuan-claw/skills/api-auto-test/cases/<接口名>.test.json`

### 阶段 6：执行测试

```bash
node /Users/ayuan/.yuan-claw/skills/api-auto-test/scripts/api-test.mjs \
  /Users/ayuan/.yuan-claw/skills/api-auto-test/cases/order.test.json
```

脚本会逐条发请求、断言、打印每条用例的 `PASS/FAIL`、状态码、耗时、响应摘要，末尾输出汇总。
退出码：全部通过 `0`，有失败 `1`，用法/运行错误 `2`。

也可以直接用 curl 风格快速验证单个请求：

```bash
node /Users/ayuan/.yuan-claw/skills/api-test.mjs --curl \
  'curl -X POST http://localhost:8080/api/orders -H "Content-Type: application/json" -d "{\"userId\":1,\"amount\":100}"'
```

### 阶段 7：分析结果并出报告

- 汇总 通过/失败/总数、失败原因（状态码不符 / 断言不符 / 连接失败 / 超时）。
- 对失败用例，结合接口代码判断是**代码缺陷**还是**用例预期有误**，给出结论与修复建议。
- 若因环境问题（服务未起、端口错、鉴权头缺失）导致失败，修正配置后重跑（阶段 4→6）。
- 输出结构化报告（见"报告模板"）。

---

## 测试配置 JSON 结构

```json
{
  "baseUrl": "http://localhost:8080",
  "defaults": {
    "headers": { "Content-Type": "application/json", "Authorization": "Bearer <token>" },
    "timeoutMs": 5000
  },
  "cases": [
    {
      "name": "创建订单-正常",
      "method": "POST",
      "path": "/api/orders",
      "headers": { "X-Trace-Id": "t-001" },
      "query": { "debug": "1" },
      "body": { "userId": 1, "amount": 100, "status": "PAID" },
      "expect": {
        "status": 200,
        "bodyContains": ["success"],
        "jsonEquals": { "code": 0, "data.status": "PAID" },
        "maxTimeMs": 2000
      }
    },
    {
      "name": "创建订单-金额为负-应校验失败",
      "method": "POST",
      "path": "/api/orders",
      "body": { "userId": 1, "amount": -1 },
      "expect": { "status": [400, 200], "jsonEquals": { "code": 40001 } }
    },
    {
      "name": "创建订单-未带token-应鉴权失败",
      "method": "POST",
      "path": "/api/orders",
      "headers": { "Authorization": "" },
      "body": { "userId": 1, "amount": 100 },
      "expect": { "status": [401, 403] }
    }
  ]
}
```

字段说明：
- `baseUrl`：所有 case 的 `path` 会拼接其后；case 内也可直接写完整 `url`。
- `defaults.headers` / `defaults.timeoutMs`：全局默认，case 内的 `headers` 会合并覆盖。
- `method`：默认 `GET`。
- `query`：查询参数对象，自动 URL 编码拼接。
- `body`：对象则 JSON 序列化（自动补 `Content-Type: application/json`）；字符串则原样发送。
- `expect.status`：单个数字或数组（数组表示"其中之一即可"）。
- `expect.bodyContains`：响应体需包含的字符串数组。
- `expect.jsonEquals`：点路径 → 期望值，如 `"data.user.id": 5`（对 JSON 响应断言）。
- `expect.maxTimeMs`：响应时间上限（可选）。
- case 也可用 `"curl": "curl ..."` 字段直接给一条 curl 命令，脚本会解析。

---

## 报告模板

```
## 接口自动化测试报告：<接口名>

**目标**：<METHOD> <baseUrl><path>
**执行时间**：<时间>   **服务状态**：在线/离线

### 入参分析
| 参数 | 位置 | 类型 | 必填 | 约束 | 示例 |
|------|------|------|------|------|------|
| userId | body | Long | 是 | @NotNull | 1 |
| amount | body | BigDecimal | 是 | @DecimalMin("0.01") | 100.00 |

### 用例结果
| # | 用例 | 期望 | 实际状态 | 结果 |
|---|------|------|---------|------|
| 1 | 创建订单-正常 | 200 & code=0 | 200 | ✅ PASS |
| 2 | 金额为负 | 400/40001 | 200 code=0 | ❌ FAIL |
| 3 | 未带 token | 401/403 | 401 | ✅ PASS |

**汇总**：通过 2 / 失败 1 / 总数 3

### 失败分析
- 用例 2：预期金额为负时校验拦截，实际返回成功。**疑似缺陷**：`amount` 缺少 `@DecimalMin` 校验，
  建议在 `CreateOrderDTO.amount` 上补充 `@DecimalMin(value="0.01", message="金额必须大于0")`。
```

---

## 安全与稳健性清单

- [ ] 只对 `localhost`/`127.0.0.1` 发起请求，不打生产域名。
- [ ] 写操作（POST/PUT/DELETE）已在报告中提示副作用；破坏性操作前征得用户同意。
- [ ] 先探活（`--health`）再跑用例，区分"服务未起"与"用例失败"。
- [ ] 鉴权 token、密钥等敏感信息不要写死进仓库文件，提示用户用环境变量或占位符替换。
- [ ] 用例失败先复核预期是否正确，再下"代码缺陷"结论。
- [ ] 每条用例独立、可重复执行（不依赖执行顺序，符合 AIR 原则）。