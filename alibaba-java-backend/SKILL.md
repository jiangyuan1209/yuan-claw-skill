
---
name: alibaba-java-backend
description: 编写、审查或重构 Java 后端代码时必须使用的技能。涵盖阿里巴巴 Java 开发手册的命名规约、常量定义、代码格式、OOP、集合、并发、控制语句、注释、异常处理、日志、单元测试、MySQL/ORM 与工程分层规范。当用户要求写 Java、Spring Boot、后端接口、Service/Controller/Mapper、DTO/VO/DO 或做 Java 代码评审时，加载此技能以产出规范、优雅、可维护的代码。
license: MIT
version: 1.0.0
tags: [java, backend, 后端, 阿里巴巴, alibaba, spring, springboot, 代码规范, coding-standard, controller, service, mapper, mybatis, 代码评审, review]
---


# 阿里巴巴 Java 后端开发规范

编写任何 Java 后端代码前，先阅读本技能并严格遵循。规则等级：
- **【强制】** 必须遵守，违反视为 Bug。
- **【推荐】** 应当遵守，除非有充分理由。
- **【参考】** 建议了解。

需要更完整的分类细则（命名对照表、异常/并发/MySQL/工程分层全集），读取本技能目录下的
`reference/alibaba-java-checklist.md`（使用绝对路径）。

---

## 一、编码总原则

1. 代码首先是写给人看的，其次才是给机器执行的。可读性优先于"炫技"。
2. 遵守 **SOLID** 与 **DRY**：单一职责、开闭、里氏替换、接口隔离、依赖倒置；不重复自己。
3. 优先使用标准库与成熟框架能力，不重复造轮子。
4. 任何魔法值（未预先定义的数字/字符串）都不允许直接出现在代码中。
5. 提交前自检：命名、格式、注释、异常、日志、空指针、边界条件。

---

## 二、命名风格

**【强制】**
- 代码中命名不允许以下划线或美元符号开始或结束，如 `_name`、`$name`、`name_`。
- 严禁使用拼音与英文混合，更不允许直接用中文。国际通用拼音（如 alibaba、taobao）可视同英文。
- 类名使用 **UpperCamelCase**（大驼峰）；但 DO / BO / DTO / VO / AO / PO / UID 等缩写保持全大写。
- 方法名、参数名、成员变量、局部变量使用 **lowerCamelCase**（小驼峰）。
- 常量命名全部大写，单词间用下划线隔开，力求语义完整，如 `MAX_STOCK_COUNT`。
- 抽象类命名使用 `Abstract` 或 `Base` 开头；异常类命名使用 `Exception` 结尾；测试类命名以被测类名开始、以 `Test` 结尾。
- POJO 类中布尔类型变量**不要加 `is` 前缀**（否则部分框架解析会引起序列化错误）。
- 包名统一使用小写，点分隔符之间有且仅有一个自然语义的英语单词，包名统一使用单数形式。
- 避免在子父类的成员变量之间、不同代码块的局部变量之间采用完全相同的命名。
- 杜绝完全不规范的缩写，避免望文不知义。

**【推荐】**
- 接口类中的方法和属性不要加任何修饰符号（`public` 也不要），保持简洁，并加上有效 Javadoc。
- 接口和实现类命名规则：
  - Service/DAO 层：接口 `XxxService`，实现 `XxxServiceImpl`。
  - 形容能力的接口用 `-able` 形式，如 `Translatable`。
- 枚举类名带上 `Enum` 后缀，枚举成员名称需要全大写，单词间用下划线隔开。

**领域模型命名约定：**
| 后缀 | 含义 |
|------|------|
| DO | Data Object，与数据库表结构一一对应 |
| DTO | Data Transfer Object，服务间/远程传输对象 |
| BO | Business Object，业务逻辑层聚合对象 |
| VO | View Object，展示层对象 |
| Query | 数据查询对象，各层接收上层的查询请求参数 |

**方法命名参考动词约定：** 获取用 `get`/`find`/`query`，插入用 `save`/`insert`，删除用 `remove`/`delete`，修改用 `update`。

---

## 三、常量定义

**【强制】** 不允许任何未经定义的常量（魔法值）直接出现在代码中。

```java
// 反例
if ("Y".equals(status)) { ... }
// 正例
private static final String STATUS_ENABLED = "Y";
if (STATUS_ENABLED.equals(status)) { ... }
```

**【强制】** `long` 或 `Long` 赋值时，数值后使用大写 `L`，不能用小写 `l`（易与数字 1 混淆）。

**【推荐】** 不要使用一个常量类维护所有常量，要按常量功能进行归类，分开维护（如缓存相关 `CacheConsts`、系统配置 `SystemConfigConsts`）。

**【推荐】** 如果变量值仅在一个固定范围内变化用 `enum` 类型来定义。

---

## 四、代码格式

**【强制】**
- 大括号：左大括号前不换行、后换行；右大括号前换行、后有 `else` 则不换行。
- 左小括号和右小括号与字符之间不出现空格。
- `if`/`for`/`while`/`switch`/`do` 等保留字与括号之间必须加空格。
- 任何二目、三目运算符的左右两边都必须加一个空格。
- 采用 4 个空格缩进，禁止使用 Tab 字符。
- 注释的双斜线与注释内容之间有且仅有一个空格。
- 单行字符数不超过 120 个，超出需换行，换行时运算符/点符号跟随上一行、下一行缩进对齐。

---

## 五、OOP 规约

**【强制】**
- 避免通过一个类的对象引用访问此类的静态变量或静态方法，直接用类名访问即可。
- 所有的覆写方法，必须加 `@Override` 注解。
- 相同参数类型、相同业务含义，才可以使用 Java 的可变参数，避免使用 `Object` 作为可变参数。
- 外部正在调用的接口或二方库依赖的接口，不允许修改方法签名，避免对调用方产生影响。可使用 `@Deprecated` 注解，并清晰地说明新接口。
- 不能使用过时的类或方法。
- 对象的 `equals` 比较容易抛空指针异常，应使用常量或确定有值的对象来调用 `equals`：`"test".equals(object)`。推荐使用 `java.util.Objects#equals`。
- 所有整型包装类对象之间值的比较，全部使用 `equals` 方法。
- 浮点数之间的等值判断，禁止直接用 `==`；应使用 `BigDecimal`，且用 `BigDecimal.valueOf()` 或字符串构造，避免精度丢失。
- 定义 DO/DTO/VO 等 POJO 类时，不要设定任何属性默认值。
- 序列化类新增属性时，不要修改 `serialVersionUID` 字段。
- 构造方法里面禁止加入任何业务逻辑，如果有初始化逻辑，请放在 `init` 方法中。
- POJO 类必须写 `toString` 方法（使用 IDE 或工具生成，继承时注意调用父类）。
- 禁止在 POJO 类中同时存在对应属性 xxx 的 `isXxx()` 和 `getXxx()` 方法。

**【推荐】**
- 使用索引访问用 String 的 `split` 方法得到的数组时，需做最后一个分隔符后有无内容的检查。
- 类内方法定义的顺序：公有 → 保护 → 私有 → getter/setter。
- 当一个类有多个构造或多个重载方法时，这些方法应顺序放置在一起。
- 循环体内的字符串连接，使用 `StringBuilder` 的 `append` 方法（避免每次 new StringBuilder）。
- `final` 可以声明类、成员变量、方法及本地变量，下列情况使用 `final`：不允许被继承的类、不允许修改引用的对象、不允许被覆写的方法、不允许运行过程中重新赋值的局部变量、避免上下文重复使用一个变量。
- 慎用 `Object` 的 `clone` 方法（默认浅拷贝）。
- 类成员与方法访问控制从严：如果不允许外部直接通过 new 创建对象，构造方法必须是 private；工具类不允许有 public/default 构造；类非 static 成员变量并且与子类共享，必须是 protected；类非 static 成员变量并且仅在本类使用，必须是 private；类 static 成员变量如果仅在本类使用，必须是 private；若是 static 成员变量，考虑是否为 final；类成员方法只对继承类公开，那么限制为 protected；类成员方法仅对类内部调用，限制为 private。

```java
// 反例：浮点等值 / 包装类 ==
if (0.1 + 0.2 == 0.3) { }          // 错误
if (integerA == integerB) { }      // 缓存外为 false

// 正例
BigDecimal a = BigDecimal.valueOf(0.1);
BigDecimal b = BigDecimal.valueOf(0.2);
if (a.add(b).compareTo(BigDecimal.valueOf(0.3)) == 0) { }
if (Objects.equals(integerA, integerB)) { }
```

---

## 六、集合处理

**【强制】**
- 关于 `hashCode` 和 `equals`：只要覆写 `equals`，就必须覆写 `hashCode`；Set 存储的对象、Map 的 key 必须覆写这两个方法。
- ArrayList 的 `subList` 结果不可强转成 ArrayList（是内部类）。
- 使用集合转数组的方法，必须使用集合的 `toArray(T[] array)`，传入类型完全一致、长度为 0 的空数组。
- 在使用 `java.util.stream.Collectors` 类的 `toMap()` 方法转为 Map 集合时，一定要注意当 value 为 null 时会抛 NPE，必须使用含参数类型为 `BinaryOperator` 的方法（三参数重载），防止 key 重复。
- 不要在 foreach 循环里进行元素的 `remove`/`add` 操作。remove 元素请使用 `Iterator` 方式，如果并发操作，需要对 Iterator 对象加锁。
- 在 JDK7 及以后，`Comparator` 要满足自反性、传递性、对称性，否则 JDK8 可能抛 `IllegalArgumentException`。

**【推荐】**
- 集合初始化时，指定集合初始值大小（`HashMap` 使用 `HashMap(int initialCapacity)`）。
- 使用 `Collections.emptyList()/emptyMap()/emptySet()` 等返回空集合而非 null。
- 使用 `entrySet` 遍历 Map，而非先 keySet 再 get。
- 高度注意 Map 类集合 K/V 能不能存储 null 值：`HashMap` 可以；`ConcurrentHashMap`、`TreeMap`（value 不为 null）不可以。
- 合理利用集合的有序性（`LinkedHashMap` 保持插入顺序）和稳定性（`sorted`）。

```java
// 正例：Iterator 删除
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    if (shouldRemove(it.next())) {
        it.remove();
    }
}
// 或 JDK8：list.removeIf(this::shouldRemove);

// 正例：指定容量（预估元素数 / 0.75 + 1）
Map<String, Object> map = new HashMap<>((int) (expectedSize / 0.75f) + 1);
```

---

## 七、并发处理

**【强制】**
- 获取单例对象需要保证线程安全，其中的方法也要保证线程安全。
- 创建线程或线程池时请指定有意义的线程名称，方便出错时回溯。
- 线程资源必须通过线程池提供，不允许在应用中自行显式创建线程。
- 线程池不允许使用 `Executors` 去创建，而是通过 `ThreadPoolExecutor` 的方式创建（避免 `FixedThreadPool`/`SingleThreadPool` 允许的请求队列长度为 `Integer.MAX_VALUE`、`CachedThreadPool`/`ScheduledThreadPool` 允许的创建线程数为 `Integer.MAX_VALUE` 导致 OOM）。
- `SimpleDateFormat` 是线程不安全的类，一般不要定义为 static 变量。JDK8 请使用 `DateTimeFormatter`（线程安全）。
- 必须回收自定义的 `ThreadLocal` 变量，尤其在线程池场景下，尽量在 `finally` 中调用 `remove()`。
- 对多个资源、数据库表、对象同时加锁时，需要保持一致的加锁顺序，防止死锁。
- 在高并发场景下，同步调用应该考量锁的性能损耗。能用无锁数据结构，就不要用锁；如能锁区块，就不要锁整个方法体；能用对象锁，就不要用类锁。
- 多线程并行处理定时任务时，`Timer` 运行多个 `TimeTask` 时，只要其中之一没有捕获抛出的异常，其它任务便会自动终止。请使用 `ScheduledExecutorService`。

**【推荐】**
- 使用 `CountDownLatch` 进行异步转同步操作，每个线程退出前必须调用 `countDown`。
- 避免 `Random` 实例被多线程使用，可使用 `ThreadLocalRandom`。
- `volatile` 解决多线程内存不可见问题，但不能解决原子性（count 累加应使用 `AtomicInteger` 或加锁）。
- HashMap 在容量不够进行 resize 时由于高并发可能出现死链，导致 CPU 飙升，开发过程中注意规避；并发场景使用 `ConcurrentHashMap`。

```java
// 正例：手动创建线程池
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    corePoolSize, maxPoolSize,
    60L, TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(queueCapacity),
    new ThreadFactoryBuilder().setNameFormat("order-pool-%d").build(),
    new ThreadPoolExecutor.CallerRunsPolicy());
```

---

## 八、控制语句

**【强制】**
- 在一个 `switch` 块内，每个 `case` 要么通过 `continue`/`break`/`return` 终止，要么注释说明将继续执行到哪一个 `case`；必须包含 `default` 语句（即使为空）。
- 当 `switch` 括号内的变量类型为 `String` 并且此变量为外部参数时，必须先进行 null 判断。
- 在 `if`/`else`/`for`/`while`/`do` 语句中必须使用大括号，即使只有一行代码。
- 三目运算符注意自动拆箱导致的 NPE：`condition ? 表达式1 : 表达式2` 中，两表达式类型不一致可能触发拆箱。
- 在高并发场景中，避免使用"等于"判断作为中断或退出的条件，应使用大于或小于的区间判断。

**【推荐】**
- 表达异常的分支时，少用 if-else 方式，可使用卫语句、策略模式、状态模式等重构（超过 3 层嵌套考虑重构）。
- 除常用方法（如 `getXxx`/`isXxx`）外，不要在条件判断中执行其它复杂的语句，将复杂逻辑判断的结果赋值给一个有意义的布尔变量名。
- 不要在其它表达式（尤其是条件表达式）中，插入赋值语句。
- 避免采用取反逻辑运算符（`!` 前置），例如使用 `if (x < 628)` 代替 `if (!(x >= 628))`。
- 循环体中的语句要考量性能：定义对象、变量、获取数据库连接等操作移到循环体外。
- 接口入参保护，尤其是批量操作的接口，需要对入参数量做上限校验。

```java
// 正例：卫语句，减少嵌套
public void process(Order order) {
    if (order == null) {
        return;
    }
    if (!order.isPaid()) {
        throw new BizException("订单未支付");
    }
    doProcess(order);
}
```

---

## 九、注释规约

**【强制】**
- 类、类属性、类方法的注释必须使用 Javadoc 规范，使用 `/**内容*/` 格式，不得使用 `//xxx` 方式。
- 所有的抽象方法（包括接口中的方法）必须要用 Javadoc 注释，除了返回值、参数、异常说明外，还必须指出该方法做什么事情，实现什么功能。
- 所有的类都必须添加创建者和创建日期。
- 方法内部单行注释，在被注释语句上方另起一行，使用 `//` 注释；方法内部多行注释使用 `/* */`，注意与代码对齐。
- 所有的枚举类型字段必须要有注释，说明每个数据项的用途。
- 与其"半吊子"英文来注释，不如用中文注释把问题说清楚。专有名词与关键字保持英文原文即可。
- 代码修改的同时，注释也要进行相应的修改，尤其是参数、返回值、异常、核心逻辑等的修改。

**【推荐】**
- 谨慎注释掉代码：在上方详细说明而不是简单地注释掉；如果无用则删除（代码仓库已保存历史）。
- 对于注释的要求：能够准确反映设计思想和代码逻辑；能够描述业务含义。
- 好的命名、代码结构是自解释的，注释力求精简准确、表达到位。
- 特殊注释标记：`TODO`（待办，注明标记人时间）、`FIXME`（已知缺陷，注明标记人时间）。

```java
/**
 * 根据用户ID查询订单列表
 *
 * @param userId 用户ID，不能为 null
 * @param status 订单状态，为 null 时查询全部状态
 * @return 订单列表，无数据时返回空列表而非 null
 * @throws BizException 当 userId 非法时抛出
 * @author yourname
 * @since 2026-10-13
 */
List<OrderVO> queryOrders(Long userId, Integer status) throws BizException;
```

---

## 十、异常处理

**【强制】**
- Java 类库中定义的可以通过预检查方式规避的 RuntimeException 不要通过 catch 来处理（如 `NullPointerException`、`IndexOutOfBoundsException`）。
- catch 时请分清稳定代码和非稳定代码，对大段代码进行 try-catch 是不可取的，应对非稳定代码单独 catch，并尽量区分异常类型。
- 捕获异常是为了处理它，不要捕获了却什么都不处理而抛弃之。如果不想处理它，请将该异常抛给它的调用者。最外层的业务使用者，必须处理异常，将其转化为用户可理解的内容。
- 事务场景中，抛出异常被 catch 后，如果需要回滚，一定要注意手动回滚事务。
- `finally` 块必须对资源对象、流对象进行关闭，有异常也要做 try-catch。JDK7 及以上使用 **try-with-resources**。
- 不要在 `finally` 块中使用 `return`。
- 捕获异常与抛异常，必须是完全匹配，或者捕获异常是抛异常的父类。
- 在调用 RPC、二方包、或动态生成类的相关方法时，捕获异常必须使用 `Throwable` 类来进行拦截。

**【推荐】**
- 方法的返回值可以为 null，不强制返回空集合或空对象，但必须添加注释充分说明什么情况下会返回 null。调用方需做 null 判断。
- 防止 NPE，是程序员的基本修养：注意 NPE 产生的场景（自动拆箱、数据库查询结果可能 null、集合里的元素即使 isNotEmpty 取出的数据也可能 null、远程调用返回对象一律 NPE 检查、Session 取数据、级联调用 `obj.getA().getB()`）。
- 定义时区分 unchecked / checked 异常，避免直接抛出 `java.lang.Exception`、`java.lang.Throwable`、`java.lang.RuntimeException`，更不允许在业务代码中捕获这些笼统异常。
- 避免出现重复的代码（DRY）。

```java
// 正例：try-with-resources
try (InputStream in = new FileInputStream(file)) {
    return parse(in);
} catch (IOException e) {
    log.error("解析文件失败, fileName={}", file.getName(), e);
    throw new BizException("文件解析失败", e);
}
```

---

## 十一、日志规约

**【强制】**
- 应用中不可直接使用日志系统（Log4j、Logback）中的 API，而应依赖使用日志框架（SLF4J、JCL）中的 API，推荐使用 **SLF4J**（门面模式）。
- 所有日志文件至少保存 15 天。
- 对于当天日志，以"应用名.log"来保存；扩展日志命名方式：`应用名.log.日志保存日期`。
- 在日志输出时，字符串变量之间的拼接使用占位符的方式（`{}`），而不是字符串拼接。
- 日志打印时禁止直接用 JSON 工具将对象转换成 String（防止抛异常影响正常业务流程）。
- 谨慎地记录日志。生产环境禁止输出 debug 日志；有选择地输出 info 日志。

**【推荐】**
- 可以使用 warn 日志级别来记录用户输入参数错误的情况，避免用户投诉时，无所适从。
- 异常信息应该包括两类信息：案发现场信息和异常堆栈信息。`log.error(各类参数或者对象 toString() + "_" + e.getMessage(), e)`。
- 生产环境的日志开关建议做成动态配置（如接入配置中心）。

```java
// 使用 SLF4J 门面
private static final Logger log = LoggerFactory.getLogger(OrderService.class);
// Lombok: @Slf4j

// 正例：占位符 + 保留堆栈
log.error("下单失败, orderId={}, userId={}", orderId, userId, e);
// 反例：字符串拼接
log.error("下单失败" + orderId + e.getMessage());
```

---

## 十二、单元测试

**【强制】**
- 好的单元测试必须遵守 **AIR 原则**：Automatic（自动化）、Independent（独立性）、Repeatable（可重复）。
- 单元测试应该是全自动执行的，并且非交互式的。禁止使用 `System.out` 来进行人肉验证，必须使用 `assert` 来验证。
- 保持单元测试的独立性，单元测试用例之间决不能互相调用，也不能依赖执行的先后次序。
- 单元测试是可以重复执行的，不能受到外界环境的影响（对数据库、外部服务等依赖使用 mock）。

**【推荐】**
- 遵守 **BCDE 原则**：Border（边界值测试）、Correct（正确输入）、Design（与设计文档相结合）、Error（强制错误信息输入）。
- 测试数据尽量使用程序生成（如随机数），因为库表可能随时变化。
- 单元测试作为质量保障的最后一道防线，需要开发者投入足够精力；核心业务、核心应用、核心模块的增量代码确保单元测试通过。
- 及时对失败的单元测试代码进行修正；单元测试框架推荐使用 JUnit 5 + Mockito + AssertJ。

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock
    private OrderMapper orderMapper;
    @InjectMocks
    private OrderServiceImpl orderService;

    @Test
    @DisplayName("查询订单_存在数据_返回列表")
    void queryOrders_whenExists_returnList() {
        given(orderMapper.selectByUserId(1L)).willReturn(List.of(new OrderDO()));
        assertThat(orderService.queryOrders(1L, null)).hasSize(1);
    }

    @Test
    @DisplayName("查询订单_userId为null_抛出异常")
    void queryOrders_whenNull_throwException() {
        assertThatThrownBy(() -> orderService.queryOrders(null, null))
            .isInstanceOf(BizException.class);
    }
}
```

---

## 十三、MySQL / ORM 规约

**【强制】**
- 表达是与否概念的字段，必须使用 `is_xxx` 的方式命名，数据类型是 `unsigned tinyint`（1 表示是，0 表示否）。POJO 类中的任何布尔类型变量，都不要加 `is` 前缀（映射时通过框架处理）。
- 表名、字段名必须使用小写字母或数字，禁止出现数字开头，禁止两个下划线中间只出现数字。表名不使用复数名词。
- 表必备三字段：`id`、`create_time`（gmt_create）、`update_time`（gmt_modified）。
- 小数类型为 `decimal`，禁止使用 `float` 和 `double`。
- 如果存储的字符串长度几乎相等，使用 `char` 定长字符串类型。
- `varchar` 是可变长字符串，不预先分配存储空间，长度不要超过 5000；如果存储长度大于此值，定义字段类型为 `text`，并独立出来一张表，用主键来对应，避免影响其它字段索引效率。
- 唯一索引名为 `uk_字段名`；普通索引名则为 `idx_字段名`。
- 超过三个表禁止 join。需要 join 的字段，数据类型保持绝对一致；多表关联查询时，保证被关联的字段需要有索引。
- 在代码中写分页查询逻辑时，若 count 为 0 应直接返回，避免执行后面的分页语句。

**【推荐】**
- 单表行数超过 500 万行或者单表容量超过 2GB，才推荐进行分库分表。
- 业务上具有唯一特性的字段，即使是多个字段的组合，也必须建成唯一索引。
- 超过 3 个表禁止 join；join 的字段数据类型必须一致并建立索引。
- SQL 中避免使用 `SELECT *`，只取需要的字段。
- 使用 `ISNULL()` 来判断是否为 NULL 值（`NULL` 与任何值比较都为 NULL）。
- 代码中禁止使用存储过程、触发器；禁止使用外键与级联。
- 数据订正时，删除和修改记录前要先 select 确认，避免出现误更新。

**MyBatis / ORM：**
- **【强制】** 不要用 resultClass 当返回参数，即使所有类属性名与数据库字段一一对应，也需要定义 resultMap（利于表字段与类属性映射解耦）。
- **【强制】** `sql.xml` 配置参数使用 `#{}`、`#param#`，不要使用 `${}`（预编译，防止 SQL 注入）。
- **【推荐】** 不允许直接拿 HashMap 与 Hashtable 作为查询结果集的输出。
- **【推荐】** 更新数据表记录时，必须同时更新记录对应的 `update_time` 字段值为当前时间。

---

## 十四、工程结构与分层

**应用分层（推荐六层）：**
```
开放接口层 (Controller / API)
    ↓
终端显示层 / 门面层 (View / VO 组装)
    ↓
Web 层 (参数校验、转发、简单业务)
    ↓
Service 层 (相对具体的业务逻辑)
    ↓
Manager 层 (通用业务处理层：对第三方封装、缓存、MQ、事务、与 DAO 交互的通用逻辑)
    ↓
DAO 层 (数据访问，与数据库交互)
```

**【推荐】分层领域模型规约：**
- DO：与数据库表结构一一对应，通过 DAO 层向上传输数据源对象。
- DTO：数据传输对象，Service 或 Manager 向外传输的对象。
- BO：业务对象，Service 层输出的封装业务逻辑的对象。
- VO：显示层对象，Web 向模板渲染层传输的对象。
- Query：数据查询对象，各层接收上层的查询请求参数。禁止使用 Map 来传输查询参数。

**【强制】二方库依赖：**
- 定义 GAV（GroupId、ArtifactId、Version）遵从以下规则：GroupID 格式 `com.{公司/BU}.业务线.[子业务线]`；ArtifactId 为产品线名-模块名；Version 为主版本号.次版本号.修订号。
- 线上应用不要依赖 SNAPSHOT 版本（安全包除外）。
- 二方库的新增或升级，保持除功能需求之外的其它 jar 包版本不变。

**【推荐】依赖管理：**
- 不要在子项目的 pom 依赖中出现相同的 groupId，相同的 artifactId，但是不同的 version。
- 所有 pom 文件中的依赖声明放在 `<dependencies>` 语句块中，所有版本管理放在 `<dependencyManagement>` 中。
- 谨慎使用 `provided`、`compile`、`runtime`、`test` scope。

---

## 十五、编码落地检查清单（生成/修改代码后自检）

1. 命名是否符合规约（大驼峰类名、小驼峰方法/变量、常量全大写、无拼音混合）？
2. 是否存在魔法值？是否已抽取为常量或枚举？
3. 是否有未处理的空指针风险（自动拆箱、集合元素、远程返回、级联调用）？
4. `equals` 是否用常量或确定值调用？包装类比较是否用 `equals`？浮点是否用 `BigDecimal`？
5. 集合操作：`foreach` 中是否有 remove/add？Map 转数组/`toMap` 是否处理 null 与重复 key？
6. 线程池是否用 `ThreadPoolExecutor` 手动创建并命名？`ThreadLocal` 是否 remove？
7. `switch` 是否有 default？`if/for/while` 是否都用了大括号？
8. 异常是否被吞掉？资源是否 try-with-resources 关闭？`finally` 中是否有 return？
9. 日志是否用 SLF4J 门面 + 占位符？error 是否带堆栈？是否有 debug 泄漏到生产？
10. 类/方法/枚举是否有 Javadoc？创建者与日期是否补齐？
11. 是否遵循分层与领域模型（Controller→Service→Manager→DAO，DO/DTO/VO/Query）？
12. SQL 是否避免 `SELECT *`？是否用 `#{}` 防注入？join 是否超 3 表且字段有索引？
13. 是否有对应单元测试并遵循 AIR / BCDE 原则？
