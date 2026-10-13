# 阿里巴巴 Java 后端规范 · 补充细则

> 本文件为 `alibaba-java-backend` 技能的补充参考，SKILL.md 覆盖核心高频规则，
> 此处提供更细的对照表、边界场景与工程实践。需要时用绝对路径读取本文件。

## 一、命名对照速查表

| 类型 | 规则 | 正例 | 反例 |
|------|------|------|------|
| 类名 | UpperCamelCase | `OrderService` | `orderService` |
| 方法/变量 | lowerCamelCase | `getUserById` | `GetUserByID` |
| 常量 | 全大写下划线 | `MAX_RETRY_COUNT` | `maxRetryCount` |
| 抽象类 | Abstract/Base 开头 | `AbstractHandler` | `HandlerAbs` |
| 异常类 | Exception 结尾 | `BizException` | `BizError` |
| 测试类 | 被测名+Test | `OrderServiceTest` | `TestOrder` |
| 枚举 | Enum 后缀，成员全大写 | `StatusEnum.ENABLED` | `Status.enabled` |
| 布尔变量 | 不加 is 前缀 | `deleted` | `isDeleted` |
| 包名 | 全小写单数 | `com.company.order` | `com.company.Orders` |
| Service 接口/实现 | XxxService/XxxServiceImpl | `UserService`/`UserServiceImpl` | `UserServiceImp` |

## 二、常量定义补充

- 跨应用共享常量：放在二方库 client 包的 constant 目录下。
- 应用内共享常量：放在 web 模块的 constant 包中。
- 子工程内部共享：当前子工程的 constant 包中。
- 包内共享：当前包下单独的 constant 类中。
- 类内共享：直接在类内部 `private static final` 定义。
- 常量复用有五层：跨应用 → 应用内 → 子工程 → 包内 → 类内，避免一个 Constants 类打天下。

## 三、OOP 补充边界

- 所有的相同类型的包装类对象之间值的比较，全部使用 equals（Integer 在 -128~127 之外 == 为 false）。
- 关于基本数据类型与包装数据类型的选择标准：
  1. 所有 POJO 类属性必须使用包装数据类型；
  2. RPC 方法的返回值和参数必须使用包装数据类型；
  3. 所有的局部变量使用基本数据类型。
- 定义 DO/DTO/VO 等 POJO 类时，不要设定任何属性默认值。
- 序列化类新增属性时，不要修改 serialVersionUID；完全不兼容升级时修改它。
- 类内方法定义顺序：公有 → 保护 → 私有 → getter/setter。

## 四、集合补充

- Set 存储对象必须重写 hashCode 和 equals；作为 Map key 的对象同理。
- 使用 Map 的方法 keySet()/values()/entrySet() 返回集合对象时，不可以对其进行 add 操作。
- Collections 类返回的对象，如 emptyList()/singletonList() 都是 immutable list，不可对其进行 add/remove。
- 使用 Collectors.toMap() 时，务必使用三参数版本处理 value 为 null 及 key 冲突：
  `Collectors.toMap(keyFn, valueFn, (v1, v2) -> v1)`。
- 利用 stream 的 filter 之后使用 findFirst()/findAny() 时，注意 Optional 的判空。

## 五、并发补充

- SimpleDateFormat 线程不安全，JDK8 用 DateTimeFormatter；SimpleDateFormat 若定义为 static 必须加锁或使用 Apache DateFormatUtils。
- 高并发时，同步调用应该考量锁的性能损耗，能用无锁数据结构就不要用锁；能锁区块就不要锁整个方法体；能用对象锁就不要用类锁。
- 加锁顺序保持一致防止死锁；加锁后必须在 finally 中解锁。
- 并发修改同一记录时，加锁或用乐观锁（版本号/CAS），乐观锁重试次数不超过 3 次。
- ThreadLocal 无法解决共享对象的更新问题，static 修饰后务必在 finally 中 remove。

## 六、异常与日志补充

- 有 try 块放到了事务代码中，catch 异常后，如果需要回滚，一定要注意手动回滚事务。
- 避免出现重复的代码（DRY）：抽公共方法、公共配置、公共常量。
- 事务场景：@Transactional 标注的方法内部 catch 了异常却不抛出，会导致事务不回滚。
- 日志级别使用规范：
  - error：影响业务流程、需要人工介入的错误；
  - warn：用户输入参数错误、可自愈的异常；
  - info：重要业务流程节点；
  - debug：开发调试信息，生产关闭。
- 生产环境禁止输出 debug 日志；有选择地输出 info 日志；日志文件至少保存 15 天。

## 七、MySQL 补充

- 字段允许适当冗余，以提高查询性能，但必须考虑数据一致性。冗余字段应遵循：不是频繁修改的字段、不是 varchar 超长字段、不是唯一索引的字段。
- 单表行数超过 500 万行或单表容量超过 2GB，才推荐进行分库分表。
- 合适的字符存储长度，不但节约数据库表空间、节约索引存储，还能提升检索速度：
  - 无符号 tinyint 0~255，年龄用 unsigned tinyint；
  - 海龟寿命用 smallint；
  - 恐龙化石用 int；
  - 太阳年龄用 bigint。
- 索引规约：
  - 业务上具有唯一特性的字段，即使是组合字段，也必须建成唯一索引；
  - 超过三个表禁止 join；
  - 在 varchar 字段上建立索引时，必须指定索引长度（没必要对全字段建索引，可根据文本区分度决定）；
  - 页面搜索严禁左模糊或者全模糊，如 `LIKE '%xxx%'` 会导致索引失效；
  - 利用覆盖索引来进行查询操作，避免回表；
  - 利用延迟关联或者子查询优化超多分页场景；
  - 建组合索引的时候，区分度最高的在最左边；
  - SQL 性能优化的目标：至少要达到 range 级别，要求是 ref 级别，如果可以是 const 最好。
- ORM 规约补充：
  - 在表查询中，一律不要使用 * 作为查询的字段列表；
  - POJO 类的布尔属性不能加 is，而数据库字段必须加 is_，要求在 resultMap 中进行字段与属性之间的映射；
  - 不要用 resultClass 当返回参数，即使所有类属性名与数据库字段一一对应，也需要定义 resultMap；
  - sql.xml 配置参数使用 #{}，#param# 不要使用 ${} 此种方式，防止 SQL 注入；
  - iBATIS 自带的 queryForList(String statementName, int start, int size) 不推荐使用（内存分页）；
  - 不允许直接拿 HashMap 与 Hashtable 作为查询结果集的输出；
  - 更新数据表记录时，必须同时更新记录对应的 update_time 字段值为当前时间。

## 八、工程分层与二方库补充

- 分层异常处理规约：
  - DAO 层产生的异常，直接向上抛出；
  - Service 层出现异常时，必须捕获 DAO 层异常，转换成 Service 层的业务异常抛出；
  - Web 层不应捕获异常，交由全局异常处理器统一处理并返回友好提示。
- 分层日志规约：Web 层记录入口参数与耗时；Service 层记录关键业务节点；DAO 层记录 SQL（debug 级别）。
- 应用分层推荐依赖关系（自上而下）：
  - 开放接口层 → 终端显示层/门面层 → Web 层 → Service 层 → Manager 层 → DAO 层。
  - Manager 层职责：对第三方平台封装、缓存方案、中间件通用处理、与 DAO 层交互对多个 DAO 的组合复用。
- 二方库依赖版本命名：主版本号.次版本号.修订号。
  - 主版本号：产品方向改变，或不兼容的 API 变更；
  - 次版本号：增加功能，兼容老版本；
  - 修订版本号：修复 bug，兼容老版本。
- 底层基础技术框架、核心数据管理平台等尽可能不引入 RPC 依赖，只依赖二方库；发布 -SNAPSHOT 到本地仓库供上层依赖调试。
- 底层框架、核心应用等禁止反向依赖上层业务应用。

## 九、代码质量与安全补充

- 用户输入的 SQL 参数严格使用参数绑定或 METADATA 字段值限定，防止 SQL 注入，禁止字符串拼接 SQL 访问数据库。
- 用户请求传入的任何参数必须做有效性验证（忽略校验可能造成的：page size 过大导致内存溢出、恶意 order by 导致数据库慢查询、缓存穿透、任意重定向、SQL 注入、反序列化注入、XXE 攻击、路径穿越、CSRF、SSRF 等）。
- 禁止向 HTML 页面输出未经安全过滤或未正确转义的用户数据（防 XSS）。
- 表单、AJAX 提交必须执行 CSRF 安全验证。
- URL 外部重定向传入的目标地址必须执行白名单过滤。
- 在使用平台资源（短信、邮件、电话、下单、支付）时必须实现正确的防重放限制（数量限制、疲劳度控制、验证码校验），防止刷单、资损。
- 用户敏感数据禁止直接展示，必须脱敏（手机号中间四位、身份证等）。