# v1.2接入stripe 支付需求描述

### 一、支付规则

- 所有区域详情（报告）（按邮编）需要购买，购买后获取固定时间的访问权限（如 3 个月）
- 有效更新时间段内可随时查看最新的数据区域详情（报告）和分析，所有邮编访问的区域详情（报告）都是最新版数据；
- 超过有效期则不能继续查看区域详情（报告）内容，也不可以可以查看历史版本区域详情（报告）
- 有效期规则：按照解锁当日+指定时间自然日 23:59:59过期
  - 如 1.28 解锁，有效期 90 天， 90 天后的 23:59:59，不包括解锁当天
  - 这里的自然日是 localtime

#### 2.1 功能清单

[RR v1.2支付流程功能清单](https://doc.weixin.qq.com/sheet/e3_ASsAbAY8AJMCNYHWwhp8cTuyV0ZLQ?scode=AGcAFQfWAA0kgH30SoASsAbAY8AJM&tab=BB08J2)

### 二、 Snapshot快照页

- 界面交互

![图片1](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_699788_nfFBuJvETxjgsjzn_1769596827?w=5760&h=6222&type=image/png)

- 功能点描述
- 用户搜索后展示快照页，需要根据用户是否登录/是否购买区域详情（报告）的情况来展示对应的情况，已下是用户对应的情况说明：
  - 未登录：用户为非登录态：需要先登录
  - 已登录，未购买，无次数：用户已登录&当前所查看的区域详情（报告）（以邮编作为区分）未购买，也没有可用的次数
  - 已登录，未购买，有次数：用户已登录&当前所查看的区域详情（报告）（以邮编作为区分）未购买，还有之前购买的次数可以直接兑换一份区域详情（报告）
  - 已登录，已购买且在有效期内：用户登录&用户已经购买当前邮编所属区域详情（报告）（包括使用免费额度兑换&支付购买）
  - 已登录，已购买，但未在有效更新期内：用户登录&用户购买过当前邮编所属区域详情（报告）（包括使用免费额度兑换&支付购买），但当前时间已不在有效更新期内——需要重新购买
- 快照页根据用户的情况模块和交互处理

| 模块 | 未登录 | 已登录，未解锁，还有解锁次数 | 已登录，未解锁，无解锁次数 | 已登录，已经购买且在有效期 | 已登录，已购买，但未在有效更新期内 |
| --- | --- | --- | --- | --- | --- |
| 快照标题右侧按钮 | 按钮文字：Sign up to view full insights交互：点击后前往登录/注册 | Unlock full insights (1 unlock)备用：Get Full Access Use 1 Unlock | 按钮文字：Get Full Area Insights备用：Buy full access /Get full Access交互：点击后打开购买弹窗 | View Full Area Insights | Renew accessGet Full Access |
| viewdetail（模块后） | 交互：点击后前往登录/注册 | 交互：点击后打开解锁二次确认弹窗 | 交互：点击后打开购买弹窗 | 交互：点击后区域详情（报告）页 | 根据是否有剩余次数判断 |
| CAT 按钮（下方中间主按钮） | 按钮文字：Sign up to view full insights交互：点击后前往登录/注册 | Get Full Access Use 1 Unlock | 按钮文字：Get Full Access交互：点击后打开购买弹窗 | 按钮文字：View Full Area Insights交互：点击后打开区域详情（报告）页 | Get Full Access |

- 以上所有跳转按钮将首先检查用户是否已登录（同已有的 snapshot 一致）
  - 如果未登录，它们将触发登录流程。登录后继续完成上一个操作，不需要用户重复操作（如点击购买，如未登录先登录，登录成功后已经进入支付流程，不需要再次点击支付按钮）
  - 如果已登录，则 参考以上交互说明进入后续的支付/解锁流程，具体可见第三部分。
  - 完成支付/解锁后，点击进入区域详情（报告）页时，同步检查该邮编是否已有完整区域详情（报告），以及该区域详情（报告）内所有维度的数据是否符合时效性要求，触发相关区域详情（报告）生成流程。
  - 在有效期内，通过 snapshot 页以及支付流程中前往区域详情（报告）页都是最新的数据内容版本；若不在有效期内，通过 snapshot 页需要再次购买才能进入邮编详情页
- 增加 Sample 入口，点击后打开对应的样本区域详情页
  - 样本页固定展示提示内容：Sample insights are current as of 1 January 2026. To access the latest insights and real-time updates, please unlock your access.

![图片2](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_532220_53HZntLyvm6cNeY__1769581855?w=5760&h=3075&type=image/png)

- 移除限时免费标签

![图片3](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_810685_QxD6xS98oepzInnS_1769659195?w=1142&h=322&type=image/png)

- 收藏功能 Save
  - 用户进入快照页，需要展示出当前邮编区域的收藏状态
    - 点击 Saveforlater，若当前用户未登录，则先进入登录流程，登录成功后完成收藏
    - 已经登录，点击Saveforlater,收藏成功后弹出 toast 提示：

![图片4](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_306043_tViA8z7-ackzUsYO_1770015270?w=760&h=243&type=image/png)

    - 点击 MyAreas可以打开对应页面
    - 收藏成功后，变成已收藏状态
    - 需要进入快照时展示区分已收藏/未收藏状态

### 获取/购买区域详情（报告）流程

- 有剩余次数，优先用剩余次数解锁
- 无有效的剩余次数，再进入购买流程
- 首次不再免费，提供了 sample area insights 可供查看
- 解锁区域详情过期后，同样按照以上逻辑进行校验判断

##### 购买区域详情（报告）流程：

- 用户未登录，先走登录流程
- 用户登录后，检测用户是否购买，未购买，点击操作按钮，打开定价页 Pricing👇

###### 定价页 Pricing

**1\. 用户故事 (User Story)**

- 作为一个正在看房的购房者，我想要选择最符合我搜索范围的付费套餐，以便于获取特定区域（邮编）的深度分析区域详情（报告），并享受多购优惠。

**2\. 业务流程/逻辑 (Business Process / Logic)**

Code snippet

```plain text
graph TD
    A[输入邮编并点击搜索] --> B{系统检测邮编状态}
    B -- 未解锁 --> C[进入套餐选择页]
    C --> D[选择套餐: Single/3-Pack/5-Pack]
    D --> E[跳转第三方支付网关 Stripe/Apple Pay]
    E -- 支付成功 --> F[自动解锁当前搜索邮编]
    F --> G[剩余点数记入账户/跳转区域详情（报告）页]
    E -- 支付失败 --> H[停留支付页并报错提示]

```

- 详细规格：页面、交互与规则 (Detailed Specs: UI, Interactions & Rules)

![图片5](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_241714_VX52pztaC_1H0mjk_1769598487?w=3840&h=2630&type=image/png)

- 从快照页进入：
  - [当前解锁提示]： 页面顶部显著位置需加粗显示当前即将解锁的邮编（如：NW1 6XE），增强用户的购买目标感。
    - 仅在用户通过快照页进入定价页后购买展示邮编，若通过top up unlocks 充值余额和价格菜单进入，则不展示邮编，并且不在购买成功后自动解锁对应邮编的 Area Insights
  - [套餐卡片交互]： * 高亮逻辑： 默认高亮“3-Postcode Pack”（Most Popular）。鼠标悬停或点击其他卡片时，边框颜色及按钮颜色需产生视觉反馈。
    - 价值锚点： 每个套餐需计算“单价（Per area）”并展示，同时计算并展示相比单买的省钱百分比（如 Save 33%）。
  - [支付按钮]： 点击后应进入加载状态（Loading），防止用户重复点击。
- 从菜单或 transactions 页充值次数入口进入：
  - 检查用户是否登录，若未登录，先进入登录流程，登录成功后返回并继续支付流程
  - 用户完成登录，则按照用户所选的套餐进入支付页
- 规则与异常：
  - 规则： 套餐为一次性支付（One-time payment），无自动续费。
  - 异常： 若第三方支付网关回调超时，页面应展示“支付确认中，请勿关闭窗口Verifying Payment...”，并每 3 秒轮询一次支付状态，最多 5 次。
  - 需要注意不要出现重复支付的情况
- 选择一个定价模式后进入托管支付页面checkout👇

![图片6](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_513920__Zil7fE6WaKCUUS-_1763104644?w=4188&h=2772&type=image/png)

  - 页面信息相关配置信息待确认
- 支付完成后：
  - 用户通过快照页进入，支付成功后，自动解锁用户关联的邮编，并在支付成功后跳转到对应的邮编详情页，在页面顶部展示 banner 提示；后续再次进入或者点击关闭都不再展示。
    - 支付回调地址都要加上解锁状态确认中的 loading 状态（文案待补充）

![图片7](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_589208_uhbeTNO2NInJ4XX2_1769071297?w=5760&h=3075&type=image/png)

    - 如果是直接购买单位区域详情（报告），提示内容：
> **提示****内容****：**
>
> Purchase Successful!
>
> Your full area insights arenow unlocked.

    - 如果是购买的套餐包，提示内容如下，点击My Areas可进入对应的页面
      - x 为当次购买剩余可用于解锁的次数
> **提示内容：**
>
> Purchase Successful!
>
> Your full area insights are now unlocked. You have {x} remaining unlocks to use on any other postcode areas. Go to My Areas

- 如果是重复购买套餐包，第二次支付因为同一份 Area Insights 重复解锁失败，所以会获得所购买的次数，提示内容如下👇
> **提示内容：**
>
> Purchase Successful!
>
> **It looks like this** **area** **insight****s** **are** **already unlocked.** Don't worry, we didn't use an unlock for this area. The full {**3****}** **unlocks** from this pack have been saved to your balance for future use.Go to My Areas

  - 点击My Areas 可进入对应的页面
  - x 为当次购买剩余可用于解锁的次数
  - 若 AI 还在生成中，已有的 AI 生成中提示优先级低于购买成功提示
- 用户通过定价页/订单页充值进入，支付成功后进入 transactions 页面，并刷新新充值的次数
  - 支付回调地址都要加上解锁状态确认中的 loading 状态（文案待补充）
- 异常情况：若中断支付，或者返回上一页面，需要检测支付状态，展示最新的支付状态
  - 未拿到支付结果前：所有跳转按钮置灰不可点击
  - 拿到支付成功的结果：快照页变成可以前往区域详情（报告）的状态（已登录&已购买），并在页面中展示相关 toast提示
  - 拿到支付取消的状态：用户在支付托管页面，主动点击了“取消”或“返回”链接（未完成支付），或者直接按了浏览器的“返回”按钮。
    - toast 提示：Purchase Cancelled. You can try again anytime.
    - 3s 后toast 提示消失
    - 用户在此情况下，可以重新点击按钮，重新进入支付流程
  - 获取到支付异常/失败的状态：用户进行了支付，但是因为卡被拒绝（例如：余额不足、CVC 错误、银行风控）等原因，支付托管页面显示了错误，然后将用户重定向回我们的快照页
    - toast 提示：Your payment didn't go through. Please try again or use a different card."
    - 3s 后toast 提示消失
    - 用户在此情况下，可以重新点击按钮，重新进入支付流程

##### 直接用剩余次数解锁流程：

- 用户未登录，先走登录流程
- 用户登录后，检测用户是否购买，未购买，点击右上角按钮，打开二次确认弹窗👇

![图片8](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_896681_x3yWU1MHgZXzKsmx_1769073014?w=5760&h=3072&type=image/png)

  - 点击弹窗中的“❌”或”cancel“关闭弹窗，不可
  - 点击“Get Full Access”打开定价页面
  - 选择一个定价模式后进入 checkout
- 点击弹窗中的“❌”和“Cancel”都是关闭弹窗，不扣额度
- 点击弹窗中的"Confirm & Unlock”使用该用户 1 次 unlock，扣减成功后，前往区域详情（报告）页，相关区域详情（报告）数据更新逻辑不变。
  - 扣减次数需要按照次数有效期进行判断，先过期的先使用
  - 过期时间一致的，按照🆔固定顺序解锁
- 用户首次通过扣减额度前往区域详情（报告）页，在页面toast提示；后续再次进入或者点击关闭都不再展示。
  - 点击My Areas 可进入对应的页面
    - x 为账户剩余可用于解锁的次数
> Successfully unlocked!
>
> Your full area insights are now unlocked. You have 2 remaining unlocks to use on any other postcode areas. Go to My Areas

- 若 AI 还在生成中，已有的 AI 生成成功提示toast 成功优先级低于购买成功/解锁成功

### MyAreas

#### 1.Unlocked

- 界面交互

![图片9](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_72245_hprOtBXUh19XVvDy_1769599614?w=3840&h=1808&type=image/png)

- 用户故事 (User Story)
- 作为一个已付费用户，我想要查看并管理所有已解锁的区域区域详情（报告），以便快速获取最新的房产市场见解并在区域详情（报告）过期前及时处理。
- 功能点描述
- 右上角 recent 移除，换成新增页面”MyAreas“
- 点击右上角菜单“MyAreas"，点击进入 MyAreas页
- 页面数据：所有 解锁过的区域详情（报告）和收藏过的区域详情（报告），不包括进入支付但是未支付购买的区域详情（报告）
  - 若区域详情（报告）先进行了购买，后续产生了退款，则区域详情（报告）在列表中展示，但不再展示查看按钮，仅做记录，此情况会在卡片字段说明中进行补充说明
  - 同一个邮编区域详情（报告），因为购买/退款或购买有更新的，在同一个数据上更新状态/信息
- 排序：可访问状态优先不可访问状态，同一状态根据购买/解锁时间倒序展示，即最新解锁的在前面
  - 若解锁后过期后再解锁，依然为同一条数据，但是同步更新解锁时间排签名
- 区域详情（报告）状态说明：
  - Active正常状态：区域详情（报告）还在有效期内，页面上不展示该状态标签

---

  - AI 分析生成中：区域详情（报告）里的 AI 分析内容还未生成
  - AI 生成失败
  - 区域详情（报告）被撤回：因为用户退款后，对区域详情（报告）进行了撤回，用户不可继续查看该区域详情（报告）
- 列表字段说明

| 字段名称 | 描述 | 图示 |
| --- | --- | --- |
| 邮编postcode | 展示区域详情（报告）所对应的邮编邮编位置信息：street、town |  |
| 区域详情（报告）状态 | ●正常状态，区域详情（报告）还在有效期内，可正常访问区域详情（报告），页面上不展示该状态标签●区域详情（报告）已过更新有效期：状态展示为：Archived●AI 分析生成中：状态展示为：AI Analyzing...● AI 生成失败：状态展示为：AI Failed ❗●区域详情（报告） 因为退款被撤回：状态展示为：Refunded |  |
| 操作按钮-Unlock New Updates | 区域详情（报告）解锁过，但是已经不可再访问时，展示该按钮；点击后，进入购买区域详情（报告）流程，需要根据实际的状态来判定走哪个流程 |
| 卡片操作- ViewAreaInsights | ●点击标题或空白区域等同于点击“View Area Insights”●Active正常状态、区域详情（报告）已过更新有效期：当前时间晚于所购买区域详情（报告）的有效更新时间、 AI 分析生成 中状态下：点击区域详情（报告）邮编标题以及卡片空白区域可以查看区域详情（报告）页●因退款被撤回状态：点击标题或空白区域，点击后弹窗：○点击”Got it“和"x”关闭弹窗○弹窗内容：Access to this AreaInsightwas revoked on {28 Oct 2024} following your refund request.○时间为退款成功的时间，格式采用平台统一格式英国标准格式 DDMMMYYYY■日 (Day)格式：DD (双位数字)■月份 (Month)：MMM (英文缩写），全大写■年份 (Year)：YYYY (四位全称)■时间还是 localtime |

- 异常&分支流程
- 因为退款而退回的区域详情（报告），查看按钮置灰（最终以 UI稿为准）
- 若因为退款而退回的区域详情（报告），后续又进行了购买，则同一个邮编更新状态为最新状态
- 数据加载状态：页面初始化或翻页加载数据时，不使用全屏 Loading，而是在列表区域展示 10 个卡片的骨架屏动画
- 空数据（无区域详情（报告））状态：

![图片13](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_367533_A-0CPMciJkxrya68_1763375203?w=3852&h=2518&type=image/png)

  - 下面的搜索框，点击搜索以及搜索逻辑同首页一致

#### 2.Saved

- 1. 用户故事 (User Story)
  - 作为一个潜在买家或投资者，我想要将感兴趣的区域收藏起来，以便在对比研究后决定消耗点数解锁哪些区域。
- 2. 业务流程/逻辑 (Business Process / Logic)
  - 用户搜索区域 -> 点击心型图标 -> 进入 Saved 列表 -> 选择 Unlock full area insights -> 校验 Credit -> 解锁成功 -> 移动至 Unlocked 列表。
- 3. 详细规格：页面、交互与规则

![图片14](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_14093_gZCC2LvoQID_4kYL_1769600339?w=3840&h=1808&type=image/png)

  - 页面与交互：
    - 心型收藏图标：点击可取消保存，卡片从列表中移除。
      - 点击后出现提示，提示 5s 后消失

![图片15](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_374932_gQOKGbrAnPtBhC-l_1769600515?w=760&h=196&type=image/png)

        - 点击提示中的 Undo 可以撤销“取消收藏”
    - 点击标题或空白区域卡片
      - 已解锁的等同于点击“view Area Insights”
      - 未解锁的点击后前往快照页
    - 列表字段参考 Unlocked
    - 操作按钮：
      - 已解锁：同 unlocked一致
      - 未解锁：点击后进入对应的解锁/购买流程，判断逻辑跟快照页一致
  - 空数据状态

![图片16](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_104772_cJR_aPRxpv9MQVUv_1769600352?w=3840&h=2518&type=image/png)

#### 统一规则与逻辑 (Global Rules & Logic)

- 搜索说明：
  - 实时搜索：监听输入框的 input 或 keyup 事件
  - 搜索规则：当输入框为空时：显示所有卡片（根据分页规则）。当输入框有值时，根据邮编 postcode进行实时查询，设置 300ms 的防抖时间
  - 匹配逻辑： 不区分大小写 ，模糊匹配 (Partial Match) 邮编字段。
  - 根据搜索结果重新计算页数，对搜索词进行高亮展示
  - 清除搜索：当输入框有内容时，右侧出现 "X" 图标，点击可一键清空并恢复完整列表。
  - 搜索无结果提示：

![图片17](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_960082_D_YMmFWGlS7rU0Jw_1769077700?w=340&h=278&type=image/png)

- 2. 全局交互约定：
  - 标签切换： Unlocked 和 Saved 标签右侧应显示数字（如 Unlocked 3, Saved 2）
  - 响应式设计： 考虑到房地产经纪人可能在户外使用，卡片布局在移动端应自动切换为单行堆叠显示。
  - 加载状态： 切换标签页或执行解锁操作时，卡片应显示骨架屏（Skeleton Screen）以减少焦虑。

### OrderHistory

##### 5.1订单列表页

- 界面交互

![图片18](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_427088_jjyQFgI_DolirxPr_1769134469?w=3840&h=3198&type=image/png)

![图片19](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_691908_db_HvcAZMo2-GAmW_1769134482?w=3840&h=2700&type=image/png)

- 功能点描述
- 点击用户头像，出现的下拉弹窗中，增加“Transactions”菜单，点击进入订单页
- 次数余额说明

![图片20](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_865462_x3x_MK2HF5YZOy9x_1769765962?w=960&h=357&type=image/png)

  - 展示当前账户剩余的解锁次数
  - next expiry 当然展示为固定文案：
  - 点击“Top up unlocks”进入如 pricing 产品价格页
- 页面数据：所有完成支付的订单/解锁 unlock
  - 分为支付订单 Payments only和解锁订单Unlocks only
    - Payments：有支付金额的订单，也就是通过 stripe 支付的订单类、
      - 不包括未支付成功的订单，包括支付成功后申请退款的订单
    - Unlocks：通过次数解锁的订单，无实际支付金额
      - Unlocks 包括因为过期扣除的次数
- 排序：根据购买/解锁时间倒序展示
- 数据加载：默认 10 条/次分页加载
- 订单状态说明：
  - Paid：已支付，正常状态
  - Refunded：用户申请了退款，并且处理退款完成
  - Processing Refund：用户申请了退款，退款正在处理中
  - Refund Declined：用户申请了退款，但是退款申请被拒绝
- 列表字段说明

| 字段名称 | 描述 | 图示 |
| --- | --- | --- |
| 支付年月日 | ●日期为用户支付完成的时间，显示为 localtime○日 (Day)格式：DD (双位数字)○月份 (Month)：MMM (英文缩写），全大写○年份 (Year)：YYYY (四位全称) |  |
| icon | ●icon 根据订单类型固定，目前包括 unlock（用 unlock 直接解锁）、购买套餐包、购买单份报告 |  |
| 订单内容/标题 | ●展示 订单内容，当前为分析区域详情（报告）+区域详情（报告）所对应的邮编○对应的应该是 stripe 创建产品的产品名称和补充备注信息○用unlocks 解锁：Unlocked Area Insights: {Postcode}■例：Unlocked Area Insights: SW1A 1AA○例：Analysis Area Insights: SW1A 1AA●点击标题可以打开订单详情页侧边弹窗●点击整个卡片非操作区也可以打开订单详情页弹窗 |  |
| 支付时间 | ●用户支付完成的具体时间，格式hh:mm○需要显示 local time |  |
| 订单编号 | ●显示当前订单对应的订单编号○仅实际产生了支付的订单展示 |  |
| 订单状态 | 展示实际的订单状态●Paid：已支付，正常状态●Refunded：用户申请了退款，并且处理退款完成 |  |
| 订单金额 | ●统一以货币单位：英镑进行展示，符号为 £●展示用户实际支付的金额●用千分位分隔符规则展示金额： 使用逗号 作为千分位，点 (Dot) 作为小数点。●显示到小数点后两位●如果发生退款，订单金额展示不变● 仅实际支付的订单展示订单金额，通过 unlock 解锁不展示金额 |  |
| Unlocks | ●展示当次交易所获得/消耗的解锁报告次数○若购买套餐包，展示获得次数：+xunlocks○若解锁套餐包，则消耗次数：-1unlock●注意 x=1时不加 s |  |
| 操作- Receipt | ●订单状态为：Refunded，暂不展示Receipt功能入口，其他状态均展示●点击后，系统重新发送一次发票到邮箱，发送成功后 toast 提示： |  |
| 申请退款 RequestRefound | ●仅在订单状态为 Paid /Refund Declined且 交易时间 < X天（例如14天）时支持申请退款 Request Refound●点击后打开用户的邮箱，自动带上当前订单号，用户账号●邮件内容：收件人 (To): support@resiradar.com主题 (Subject):Refund Request: Order #84923正文 (Body):Hi ResiRadar Team,I would like to request a refund for the following order:Order Details:●Order ID: #84923●Account Email: user@example.com●Date: 2025-11-18Reason for Refund: [Please type your reason here. e.g., Accidental purchase, Data issue, etc.]Please do not delete the information above to ensure faster processing.异常情况： 有些用户（尤其是在网吧或通过 Web 访问的用户）电脑上没有安装 Outlook 或 Mail 客户端，点击按钮没反应。对策： 在按钮旁边或者 Tooltip 里，加一行小字：●"Nothing happening? Email us at support@resiradar.com with your Order ID." |  |
| 卡片操作 | ●点击标题或空白区域 等均打开订单详情弹窗 |

- 异常&分支流程
- 数据加载状态：页面初始化或翻页加载数据时，不使用全屏 Loading，而是在列表区域展示 10 个订单的骨架屏动画
- 空数据（无区域详情（报告））状态：

![图片31](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_343632_sNlMvjrq_DwhZdD__1763541274?w=3840&h=2570&type=image/png)

##### 5.1订单详情弹窗

全局规则与逻辑 (Global Rules & Logic)

**1\. 格式化规范：**

  - 货币显示： 英镑符号前置 (£1.99)，保留两位小数。若金额为0，显示 £0.00 或 £0（视具体场景）。
  - 次数显示： 使用特定单位词（如 1 unlock），不加货币符号。
  - 日期时间： 统一采用截图中的英式格式 DD Mon YYYY at HH:mm (例如：20 Sept 2024 at 09:15)。

**2\. 数据加载与空状态：**

  - 点击列表项时，详情侧边栏/弹窗应从右侧滑入或在当前层级浮现。
  - 加载过程中，详情区域显示骨架屏（Skeleton Screen），保持布局稳定性。

**3\. 状态定义 (Order Status)：****同****列表****一致**

- 可以用于展示订单相关的信息
- 模态抽屉 (Modal Drawer)， 按 ESC 键、或（右上角的 × 关闭按钮可关闭弹窗

**4****.****字段说明👇**

<table style="border-collapse:collapse;border:none;table-layout:fixed;mso-table-layout-alt:fixed;"><tbody><tr><td colspan="1" rowspan="1"><p><span>字段名称</span></p></td><td colspan="1" rowspan="1"><p><span>描述</span></p></td><td colspan="1" rowspan="1"><p><span>图示</span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>图标</span></p></td><td colspan="1" rowspan="1"><p><span>icon</span><span>类型</span><span>同</span><span>列表</span></p></td><td colspan="1" rowspan="4"><p><span><img></span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>订单号 (Order ID)</span></p></td><td colspan="1" rowspan="1"><p><span><span>●</span></span><span>显示当前订单对应的订单编号</span></p><p><span><span>●</span></span><span>规则</span><span>与</span><span>列表</span><span>一致</span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>订单</span><span>状态</span></p></td><td colspan="1" rowspan="1"><p><span><span>●</span></span><span>显示当前订单对应的订单</span><span>状态</span></p><p><span><span>●</span></span><span>规则与列表一致</span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>支付</span><span>时间 (Timestamp)</span></p></td><td colspan="1" rowspan="1"><p><span><span>●</span></span><span>显示</span><span>当前订单对应的支付时间</span><span>，</span><span> 精确到分钟</span></p><p><span><span>●</span></span><span>格式：Placed on: DD MMM YYYY at HH:mm (e.g., 20 Sept 2024 at 09:15)。</span></p><p><span><span>●</span></span><span>需要显示 local time</span></p></td></tr><tr><td colspan="3" rowspan="1"><p><span>Property Information </span><span>产品信息</span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>订单内容/标题</span></p></td><td colspan="1" rowspan="1"><p><span><span>●</span></span><span>icon</span><span> 根据</span><span>购买</span><span>类型</span><span>固定</span></p><p><span><span>●</span></span><span>展示订单内容</span><span>：</span></p><p><span><span>○</span></span><span>Payments：对应产品名称+描述</span></p><p><span><span>○</span></span><span>U</span><span>n</span><span>locks</span><span>：</span><span>当前为分析</span><span>区域详情（报告）</span><span>+</span><span>区域详情（报告）</span><span>所对应的邮编</span></p><p><span><span>●</span></span><span>内容文案待定</span></p><p><span><span>○</span></span><span>例：</span><span>Analysis </span><span>Area Insights</span><span>: SW1A 1AA</span></p><p><span><span>■</span></span><span>如果是通过多次套餐，那么这里的内容需要显示多个（打包套餐+次数解锁）</span></p><p><span><span>●</span></span><span>支付</span><span>金额</span><span>信息</span><span>：</span><span>展示</span><span>实际</span><span>的</span><span>金额</span></p><p><span><span>●</span></span><span>消耗</span><span>/</span><span>获得</span><span>次数</span><span>信息</span><span>：</span><span>展示</span><span>实际</span><span>消耗</span><span>/</span><span>获得</span><span>的</span><span>次数</span><span>信息</span><span>，</span><span>同</span><span>列表</span><span>一致</span></p></td><td colspan="1" rowspan="1"><p><span><img></span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>V</span><span>iew</span><span> Area Insights</span></p></td><td colspan="1" rowspan="1"><p><span><span>●</span></span><span>若当前的商品是解锁 Area Insights，需要展示</span><span>View Area Insights</span><span>按钮</span></p><p><span><span>●</span></span><span>点击</span><span>按钮默认查看最新版本的</span><span>区域详情（报告）</span></p><p><span><span>●</span></span><span>因为退款而退回的</span><span>区域详情（报告）</span><span>，查看按钮置灰，点击后弹窗：</span></p><p><span><img></span></p><p><span><span>○</span></span><span>点击”Got it“和"x”关闭弹窗</span></p></td></tr><tr><td colspan="3" rowspan="1"><p><span>Payment Information</span><span>支付</span><span>信息</span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>支付</span><span>方式</span></p></td><td colspan="1" rowspan="1"><p><span><span>●</span></span><span>通过 stripe 支付</span></p><p><span><span>○</span></span><span>包括</span><span>支付</span><span>卡</span><span>品牌</span><span>+</span><span>ending</span><span>id</span><span>{</span><span>卡号</span><span> 4</span><span> 位</span><span>尾号</span><span>}</span></p><p><span><span>■</span></span><span>品牌</span><span>如</span><span>：</span><span>"visa" / "mastercard"</span></p><p><span><span>■</span></span><span>e</span><span>.</span><span>g</span><span>.</span><span>,</span><span>Visa ending in 4242</span></p><p><span><span>○</span></span><span>如</span><span>无</span><span>品牌</span><span>替换</span><span>为</span><span> C</span><span>ard</span></p><p><span><span>●</span></span><span>通</span><span>过 unlocks 次数解锁</span></p><p><span><span>○</span></span><span>展示</span><span> paid</span><span>w</span><span>i</span><span>t</span><span>h</span><span>u</span><span>n</span><span>l</span><span>o</span><span>c</span><span>k</span><span>s</span></p><p><span><img></span></p></td><td colspan="1" rowspan="3"><p><span><img></span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>支付</span><span>金额</span></p></td><td colspan="1" rowspan="1"><p><span><span>●</span></span><span>通过 stripe 支付</span></p><p><span><span>○</span></span><span>包括</span><span>产品</span><span>金额</span><span>、</span><span>税额</span><span>、</span><span>及</span><span>总计</span></p><p><span><span>■</span></span><span>Subtotal</span></p><p><span><span>■</span></span><span> V</span><span>A</span><span>T</span><span>(</span><span>2</span><span>0</span><span>%</span><span>)</span></p><p><span><span>■</span></span><span>优惠金额</span><span>，</span><span>需要</span><span>前面</span><span>用</span><span>-</span><span>展示</span></p><p><span><span>○</span></span><span> T</span><span>o</span><span>t</span><span>a</span><span>l</span><span>总金额</span><span>为</span><span>用户</span><span>实际</span><span>支付</span><span>的</span><span>金额</span></p><p><span><span>○</span></span><span>统一以货币单位：英镑进行展示，</span><span>符号为 </span><span>£</span></p><p><span><span>○</span></span><span>统一</span><span>展示</span><span>规则</span><span>:</span></p><p><span><span>■</span></span><span>用千分位分隔符规则展示金额： 使用逗号 作为千分位，点 (Dot) 作为小数点。</span></p><p><span><span>■</span></span><span>显示到小数点后两位</span></p><p><span><span>■</span></span><span>如果发生退款，订单金额展示不变</span></p><p><span><span>●</span></span><span>通过 unlocks 次数解锁</span></p><p><span><span>○</span></span><span>包括</span><span>消耗</span><span>次数</span><span>、税额、及总计</span></p><p><span><span>■</span></span><span>Subtotal</span><span>：</span><span>1</span><span>unlock</span></p><p><span><span>■</span></span><span> VAT(20%)</span><span>：</span><span>0</span></p><p><span><span>○</span></span><span> Total总金额为用户实际支付的金额</span></p><p><span><span>■</span></span><span>如果发生退款，</span><span>消耗</span><span> unlock</span><span>展示不变</span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>交易</span><span>单号</span></p></td><td colspan="1" rowspan="1"><p><span><span>●</span></span><span>支付订单展示</span><span>从 Strip 获取的交易单号</span></p><p><span><span>○</span></span><span>通过</span><span> unlocks</span><span> 次数</span><span>解锁</span><span>的</span><span>不展示</span></p></td></tr><tr><td colspan="3" rowspan="1"><p><span>Billing Address账单地址</span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>姓名</span></p></td><td colspan="1" rowspan="1"><p><span>用户</span><span>支付</span><span>时</span><span>填写</span><span>的</span><span>姓名</span></p></td><td colspan="1" rowspan="2"><p><span><img></span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>地址</span></p></td><td colspan="1" rowspan="1"><p><span>用户支付时填写的</span><span>账单</span><span>地址</span><span></span></p><p><span>如用户使用</span><span>次数</span><span>解锁</span><span>，则隐藏此模块</span></p></td></tr><tr><td colspan="3" rowspan="1"><p><span>Refund Information退款信息</span><span>（</span><span>通过 stripe 支付）</span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>退款</span><span>说明</span></p></td><td colspan="1" rowspan="1"><p><span>根据</span><span>不同</span><span>的</span><span>退款</span><span>状态</span><span>展示</span><span>不同</span><span>的</span><span>退款</span><span>说明</span><span>文案</span></p><p><span><span>●</span></span><span>Refunded：</span><span>A refund of </span><span>{</span><span>£19.99</span><span>}</span><span> was issued on </span><span>{</span><span>18 Nov 2025</span><span>}</span><span> to your </span><span>{</span><span>Visa ending in 4242</span><span>}</span><span>. Please allow 5–10 business days for the funds to appear on your statement, depending on your bank.</span></p><p><span><span>○</span></span><span> {£19.99} </span><span>:</span><span>退款</span><span>金额</span></p><p><span><span>○</span></span><span> {18 Nov 2025}</span><span>：</span><span>退款</span><span>成功</span><span>时间</span></p><p><span><span>○</span></span><span> {Visa ending in 4242}</span><span>：</span><span>退款</span><span>退后</span><span>的</span><span>银行卡</span><span>信息</span></p><p><span><span>●</span></span><span>Processing Refund：</span><span>Refund is being processed. It may take 5-10 business days to appear in your account.</span></p><p><span><span>●</span></span><span>Refund Declined：</span><span>Request declined as the </span><span>Area Insights</span><span> was accessed. Per policy, downloaded content is non-refundable.</span></p></td><td colspan="1" rowspan="6"><p><span><img></span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>Refund Date</span><span>退款</span><span>日期</span></p></td><td colspan="1" rowspan="1"><p><span><span>●</span></span><span>提交退款申请的时间</span></p><p><span><span>●</span></span><span>格式采用平台统一格式</span><span>英国标准格式 DD MMM YYYY</span></p><p><span><span>○</span></span><span>日 (Day)格式：DD (双位数字)</span></p><p><span><span>○</span></span><span>月份 (Month)：MMM (英文缩写），全大写</span></p><p><span><span>○</span></span><span>年份 (Year)：YYYY (四位全称)</span></p><p><span><span>○</span></span><span>需要显示 local time</span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>Refunded to</span></p><p><span>退款到</span></p></td><td colspan="1" rowspan="1"><p><span><span>●</span></span><span> {Visa ending in 4242}：退款退后的银行卡信息</span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>Refund Amount</span><span>退款</span><span>金额</span></p></td><td colspan="1" rowspan="1"><p><span><span>●</span></span><span>提交退款申请的金额</span></p><p><span><span>●</span></span><span>统一以货币单位：英镑进行展示，</span><span>符号为 </span><span>£</span></p><p><span><span>●</span></span><span>统一展示规则:</span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>Unlocks Deducted</span></p><p><span>退回次数</span></p></td><td colspan="1" rowspan="1"><p><span><span>●</span></span><span>因为退款扣除的次数</span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>Reason</span><span>退款</span><span>原因</span></p></td><td colspan="1" rowspan="1"><p><span><span>●</span></span><span>提交退款申请</span><span>时</span><span>选</span><span>选择</span><span>的</span><span>原因</span><span></span></p></td></tr><tr><td colspan="3" rowspan="1"><p><span>Refund Information退款信息</span><span>（</span><span>通过 unlocks 次数解锁）</span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>退款说明</span></p></td><td colspan="1" rowspan="1"><p><span>根据不同的退款状态展示不同的退款说明文案</span></p><p><span><span>●</span></span><span>Refunded：A refund of </span><span>{x}</span><span> unlock was issued on 18 Nov 2025 to your unlocks balance. Access to {SW1A 1AA} Area has been revoked and the report is now locked.</span></p><p><span><span>○</span></span><span> {</span><span>x</span><span>} :</span><span>退回的次数，一般为 1 次 1 unlock</span></p><p><span><span>○</span></span><span> {18 Nov 2025}：退款成功时间</span></p><p><span><span>○</span></span><span>{SW1A 1AA} </span><span>：当前的邮编</span></p></td><td colspan="1" rowspan="4"><p><span><img></span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>Refund Date退款日期</span></p></td><td colspan="1" rowspan="1"><p><span><span>●</span></span><span>提交退款申请的时间</span></p><p><span><span>●</span></span><span>格式采用平台统一格式</span><span>英国标准格式 DD MMM YYYY</span></p><p><span><span>○</span></span><span>日 (Day)格式：DD (双位数字)</span></p><p><span><span>○</span></span><span>月份 (Month)：MMM (英文缩写），全大写</span></p><p><span><span>○</span></span><span>年份 (Year)：YYYY (四位全称)</span></p><p><span>需要显示 local time</span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>Unlocks Returned</span></p></td><td colspan="1" rowspan="1"><p><span>因为退款返回的次数，一般就是 1 次 1 unlock</span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>Reason退款原因</span></p></td><td colspan="1" rowspan="1"><p><span>提交退款申请时选选择的原因</span></p></td></tr><tr><td colspan="3" rowspan="1"><p><span>Footer Actions底部操作区</span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>客服</span><span>入口</span></p></td><td colspan="1" rowspan="1"><p><span><span>●</span></span><span>Questions about this order? [Email us at hello@Arealyst.com]"</span></p><p><span><span>●</span></span><span>交互：点击链接唤起邮件客户端。</span></p><p><span><span>○</span></span><span>自动填写主题行"Issue with Order #84923"。 订单编号</span></p></td><td colspan="1" rowspan="1"><p><span><img></span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>操作-Invoice</span></p></td><td colspan="1" rowspan="1"><p><span><span>●</span></span><span>订单状态为：</span><span>Refunded，暂不展示发票功能入口，其他状态均展示</span></p><p><span><span>●</span></span><span>点击后，系统重新发送一次发票到邮箱，发送成功后 toast 提示：</span></p><p><span><span>●</span></span><span>交互</span><span>同</span><span>列表</span><span>一致</span></p></td><td colspan="1" rowspan="1"><p><span><img></span></p></td></tr><tr><td colspan="1" rowspan="1"><p><span>申请退款 Request Refound</span></p></td><td colspan="1" rowspan="1"><p><span><span>●</span></span><span>仅在订单状态为 Paid /Refund Declined且 交易时间 &lt; </span><span>X天（例如14天</span><span>）时支持</span><span>申请退款 </span><span>，</span><span>否则不展示入口</span><span>Request Refound</span></p><p><span><span>●</span></span><span>点击后打开</span><span>用户的邮箱，自动带上当前订单号，用户账号</span></p><p><span><span>●</span></span><span>邮件内容：</span></p><p><span>收件人 (To):</span><span> support@resiradar.com</span></p><p><span>主题 (Subject):</span></p><p><span>Refund Request: Order #84923</span></p><p><span>正文 (Body):</span></p><p><span>Hi ResiRadar Team,</span></p><p><span>I would like to request a refund for the following order:</span></p><p><span>Order Details:</span></p><p><span><span>●</span></span><span>Order ID: #84923</span></p><p><span><span>●</span></span><span>Account Email: user@example.com</span></p><p><span><span>●</span></span><span>Date: 2025-11-18</span></p><p><span>Reason for Refund:</span><span> [Please type your reason here. e.g., Accidental purchase, Data issue, etc.]</span></p><p><span>Please do not delete the information above to ensure faster processing.</span></p><p><span>异常情况：</span><span> 有些用户（尤其是在网吧或通过 Web 访问的用户）电脑上没有安装 Outlook 或 Mail 客户端，点击按钮没反应。</span></p><p><span>对策：</span><span> 在按钮旁边或者 Tooltip 里，加一行小字：</span></p><p><span><span>●</span></span><span>"Nothing happening? Email us at support@resiradar.com with your Order ID."</span></p></td><td colspan="1" rowspan="1"><p><span><img></span></p></td></tr></tbody></table>

##### 5.3退款

- 退款流程

![图片43](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_383024_38bIvxRfFLokzjus_1763629671?w=1216&h=1521&type=image/png)

- 功能点描述
- 当前版本退款通过人工手动在 stripe后台发起，退次数通过 RR 手动操作
- 需要在退款成功后在订单中同步已退款状态到订单状态，并且对退款的订单撤回区域详情（报告）访问权，包括购买的次数
- 同样，若用户为通过 unlock 解锁，需要我们操作退款，并在页面展示退款状态
- 手动操作需要能：

1、把 stripe 的退款信息同步到订单中并把扣除的次数同步出来

默认扣除订单剩余未使用次数即可

2、把 unlock取消的状态同步到订单中

![图片44](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_871874_g81LxF2FdiY3sscW_1763629767?w=3840&h=2700&type=image/png)

### AreaInsightsPage区域详情页

![图片45](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_851780_TGiOsMwY83kbe5aW_1769154929?w=1567&h=857&type=image/png)

- 移除页面右上角AnalysisDate，替换为最后更新时间Last update: 15/01/2024
- 时间展示为最近一次更新时间，展示格式跟报告时间一致

**报告异常情况处理：**

邮编详情页的URL调整后，若用户进入区域详情链接，需要校验用户是否具有访问权（包括过期的情况），若不具有，则**自动触发并打开当前邮编的快照展示**，并 toast 提示原因

首次访问平台：

> Welcome to Arealyst. You’re exploring a free snapshot of \[Postcode\].

访问过平台，但未购买当前区域访问权：

> You haven't unlocked full access for \[Postcode\] yet.

购买当前区域的访问权限已过期：

> Your 90-day access for \[Postcode\] ended on \[DD/MM/YYYY\].

将现有的“快照页”内容作为该报告页的“默认展示层”，仅通过快照页或者 My areas 指定页面进入详情页

### Search

### 搜索历史管理 (Search History Management) - 新增核心]

**1\. 用户故事 (User Story)**

  - 作为一个频繁对比不同区域的用户，我想要快速访问之前搜索过的位置，以便于节省重复输入的时间并追踪我的研究进度。

**2\. 业务流程/逻辑 (Business Process / Logic)**

  - 记录产生： 用户点击建议列表中的某一项并成功跳转快照页后，该位置被计入“搜索历史”。
  - 展示逻辑： 当用户点击（Focus）空的输入框时，在下方以时间倒序展示最近的搜索项。
  - 删除逻辑： 用户点击单条历史后的删除图标 -> 实时移除该记录。

**3\. 详细规格：页面、交互与规则 (Detailed Specs: UI, Interactions & Rules)**

  - 页面与交互：
    - [历史项图标]： 每条历史记录左侧配有“时钟/逆时针箭头”图标（如图中所示），以区分实时建议。
    - [删除触发]： 历史项最右侧设有 (X) 按钮。悬停（Hover）时高亮，点击即删除。
    - [区分显示]： 如果有输入的话，则改为展示搜索结果，若有与搜索记录匹配的邮编，则置顶展示。
    - 文案修改：Get your first full area area insights — Free，去掉后面的“— Free”

![图片46](https://wdcdn.qpic.cn/MTY4ODg1NjYyNTQ0MTgzNQ_471207_sJY5-iQcaHyOYNpz_1769587540?w=1045&h=112&type=image/png)

  - 规则与异常：
    - 规则 1（存储量）： [假设] 前端 LocalStorage 或后端数据库仅保留最近 10 条搜索历史。
    - 规则 2（去重）： 重复搜索同一地点时，该地点在历史列表中移动至最顶部，不产生重复条目。
    - 规则 3（登录同步）： [假设] 未登录状态下记录保存在浏览器缓存；登录后应同步至账号维度，实现多端一致。

---

**占位符说明：**

- 优先从现有内容中进行理解
- 如果确实需要补充占位符对应内容来补充理解，请提示用户提供 `xxx占位符：序号` 的内容