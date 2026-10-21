# Scentalka 设计原型

已采用 A「Everyday Story / 温暖生活绘本」方向。Scentalka 仅为临时文字标识，品牌尚未确定。

当前已扩展到世界管理、全部 NPC 配置、生活事件、成果写作、学习记录、数据管理、多步计划、跨日预约、候补和承诺补救，**仍未覆盖完整产品功能**。逐项范围与剩余缺口见 [功能覆盖核查.md](功能覆盖核查.md)。

## 打开

在项目根目录执行：

```sh
python3 -m http.server 8766 --bind 127.0.0.1 --directory 原型
```

浏览器访问：<http://localhost:8766/Scentalka%20Prototype.html>

无需安装前端依赖、模型密钥或数据库。请通过 HTTP 打开，以保持录音权限和本地存档行为一致。字体与地图美术均已保存在本地。

## 如何体验

默认从 Home / Living Room / 07:00 开始。所有游戏界面、控制和帮助使用英语。地图不可点击移动，通过底部输入行动。

### 本轮新增：计划、日期与后续约定

左侧 **Desk** 已增加三个可直接试玩的入口：

- **Your itinerary**：已有三步示例，编辑 → 预览 → 保存 → 每次 Run next step 执行一项。支持明确移动、拿取/放置/钥匙交付、限定分钟等待、家务和 `Message Sarah: your exact words`。发信步骤只准备草稿，自己按 Send。未知步骤阻止整份保存；已完成步骤和修改前计划留存，刷新不重演。
- **Hospital standby**：在 Reception 携 ID 后，准备并发送加入候补请求。三人上限、最长 30 游戏分钟、不跨闭院。等待 5 游戏分钟后按真实可用样例槽发送时段提议；先读时段提议，再明确接受。时段提议 5 分钟内不接受即失效。停止等待与退队是两件事，原预约不会被默默取消。
- **Promises & follow-ups**：钥匙晨间请求默认截止 12:00，可在未接受任务中编辑。接受后 IM `Please change the key handover to 14:00 today.` 明确协商延期。失约后 `Please arrange a new key handover at 09:00 tomorrow.` 建立独立后续，实际补交也不会抹去原失败。旧存档缺失的接受日期不编造补齐。

**Appointment slots** 可切换今天、明天及之后五天。选择时段只填 Emma 草稿，自己发送才预约；也可写 `Please book an appointment at 09:00 tomorrow.`。游戏时钟跨午夜会进入次日，结束今天保留未来预约；错过或取消的预约不能重新签到。世界时间依旧只在游戏行动中推进。

### 新增可试玩：日程、物品与语音检查

- **Daily routine**：Desk → People in your world → 选择人物 → Daily routine。最多八段，每段有地点、活动和回复开关；检查重叠、交通间隔、医院服务覆盖及已接受工作。地图、目录、联系人现场权限和 NPC 位置回复使用同一日程。等待期间遇到已安排的回复会暂停，余程保留；`Wait for Sarah's reply.` 是有上限的等待。日程按天重复，尚无日期特例或临时调度。
- **Everyday objects**：厨房拿水瓶，`Drink some water.` 消耗一份，三份后喝空；带回厨房 `Refill the water bottle.` 才补满。Living Room 柜里的零食可以取出吃一次。`Drop my ID card.` 把实际证件留在当前区域，只有回原地才能拿回；未携带时不能登记。
- **Voice review**：录音后 Review voice draft，试听/暂停、修改英文转写、查看浏览器识别候选和实际提供的置信度；可重录、丢弃录音、保留录音或改纯文字。关闭面板保留编辑，确认发送前不发消息。权限等待也可 Escape 取消；迟到流被关闭，迟到结果不覆盖取消/发送后的草稿。浏览器不能重新识别旧音频，Record again 会新录。
- **Voice & listening**：Desk 或 `Open voice queue.` 统一选择未播放 NPC 语音。未读正文不展示，播放不改变发送对象；录音期间不能开始另一条播放。

### World desk

左侧 **Desk** 或 World `Open world desk.` 打开统一入口：

- **You & your roles / Begin a new story**：资料、背景、目标、各场景身份；独立新世界可修改初始物品位置，旧世界保留。
- **People in your world**：全部 NPC 资料、音色、精灵形象、地点与班次；添加、归档与必要职责交接。私人记忆和旧 IM 不复制给继任人。
- **Tasks & written work**：六项任务详情、接受/拒绝/推迟、未接受任务文案编辑；就诊后英文总结的草稿、预览、提交、退回修订与不可编辑版本。
- **Today’s arrangements / World pace**：可用时段、预约/改约草稿、营业与班次冲突检查；完整节奏参数预览。
- **Things that changed**：公交服务事件、早餐后的笔记本事件；延后、忽略或自主决定处理。
- **Words to keep**：消息表达收藏、上下文、复用前草稿保护和每日反思；助手历史刷新保留。
- **Your data**：JSON 导出、仅隐藏显示、删除原音频但保留转写、永久删除当前世界。
- **When something fails**：本地阶段故障模拟，行动前重试或仅恢复回复，不重复已处理行动。
- **A pharmacy sample**：独立的虚构处方样例，核验已有处方和证件，单次领取；不修改当前正常世界。

生活动作可试 `Go to the kitchen.` → `Prepare breakfast.` → 确认 Start activity → `Wait for five minutes.`，再查看 Events。`Tidy the room.` / `Rest.` 也有可停止的分段活动；`Put the house key on the tray.` / `Take the folder from the cabinet.` 验证实际地点与归属。

顶栏快捷键说明里 **Customize keys** 可改键。输入框外 H/J/I/C/E/G 分别为助手、记录、物品、联系人、事件、Desk；按住 Space 录音，松开停止并检查草稿，Escape 取消，Ctrl+. 始终停止计划。原 Alt 快捷键保留。自动识别只追加到已有文字草稿，发送仍需用户确认。

语音开始播放不再等于听完整条；完整结束或查看转写才获取全文信息。播放中断保存进度；TTS 断点依赖浏览器边界回调，续播可能重复当前词。地图人物读取当前配置与每日多段日程，忙碌状态有标记。

### 直接试流程

刷新页面后，输入框上方有 **Try a flow**（`Alt + F`），可选择 Family & the key / A hospital visit / A change of plans。旁边的 **NEXT EXAMPLE** 根据实际进度给出下一条示例。

使用 Tab 选中示例并按 Enter，会将它填入正确的 World 或 NPC 草稿；再按 Enter 才执行或发送。可以修改措辞，不会替用户自动发送、承诺或清空原有草稿；存在未发送内容时会先询问是否替换。选择流程不重置、不传送，也不创建预约。

在同一个默认世界完成钥匙交接后，可改选 A hospital visit，依次等待到营业、联系 Emma、预约、取证件、出行、登记、查看叫号并就诊。无须换存档。想直接体验道路事件时，仍可通过 Studio 打开独立道路存档。

新增支持 `Go outside.` / `Go to the road.` / `Go to the bus stop.`、`Read Sarah's latest message.` / `Play Ben's latest message.` 以及 `Wait for ten minutes.`。返回家会经过道路。可与 NPC 简单问候、询问位置和要求重复上一条回复。

- `Alt + 1`：World，输入世界指令。
- `Alt + 2`：当前联系人的 IM，原文发送。
- `Alt + 3`：Assistant，仅自己可见的英语帮助。
- `Alt + F`：选择流程示例；
- `/`：聚焦输入；`Enter`：提交；`Esc`：停止当前计划或关闭面板。
- `Alt + T / I / J`：任务、物品、只读事件记录。
- `Alt + D`：公共服务目录；`Alt + S`：预设编辑。
- `Alt + M`：开始 / 停止录音；`Alt + P`：播放 / 暂停最近语音；`Alt + R`：转写。
- 所有按钮支持 Tab / Enter。顶栏 `⌘` 可查看快捷键。

左下角 **Studio** 提供三个独立演示存档与 Paper / Sage / Linen 视觉微调。切换存档保留各自进度；新建副本保留旧故事，新增故事可在 Saved stories 中继续。不要把切换演示存档当成世界内传送。

### 01 / 家庭钥匙交接

Sarah IM：

```text
Do you need the house key this morning?
I'll bring it to you now.
```

切换 World：

```text
Go to the entrance.
Take the house key from the tray.
Give the house key to Sarah.
```

结果为 07:04，钥匙实际归 Sarah 所有。再次交付不会复制钥匙或再次扣时间。

也可以在 Sarah IM 中输入 `Please prepare the appointment documents.`，再用 World `Wait for Sarah's documents.` 体验 NPC 在游戏时间内完成工作及保留任务结果。

### 02 / 医院预约与到场

Studio → A hospital visit（独立的 08:00 存档）。World：

```text
Open the hospital directory and Emma's chat.
```

Emma IM：

```text
Do you have an appointment at nine o'clock today?
Yes, please book that time for me.
```

World：

```text
Take my ID card and go to the hospital.
```

到达后 Emma IM：

```text
I'm here for my nine o'clock appointment. Here is my ID.
```

World：`Wait until I'm called.`。09:00 后打开 Grace 的消息；语音需播放或查看转写才能获知内容。World：`Go to the consultation room.`。在 Dr. Patel IM 自行描述症状，最后发送 `Thank you, that's all for now.` 结束本地演示中的接诊交流。接诊预算只结算一次，默认到 09:16；不会凭空生成处方。

### 03 / 道路中断与停止

Studio → A change of plans（独立的 08:00 存档，已有 09:00 预约）。World：

```text
Take the bus to the hospital.
```

08:05 在候车点被有来源的服务延误中断，尚未上车。打开 Ben 的通知；语音需播放或转写。World：

```text
Wait for the bus, but stop after ten minutes.
```

计划会以几秒钟的短演示呈现检查点；08:10 时按 `Esc` 停止。然后：

```text
Cancel the remaining plan.
Walk to the hospital instead.
```

08:30 抵达医院，原 09:00 预约仍保留。停止、改路不会代替用户通知 Emma。

## 已实现的设计交互

- 三张用 CC0 素材组合的单层 2D 地图、人物和当前位置。
- NPC 私人 IM、公开目录及来源、文本 / 语音、手动播放与转写、联系人草稿。
- World / NPC / Assistant 三种明确入口；助手与 IM 具有不同身份。
- 行动预览耗时、片段待结算、承诺与实体交付分离。
- 六项预设任务、NPC 材料准备、库存归属、预约、到场核验、叫号、接诊预算。
- 有界快进、真实状态关联的中断、主动停止、继续与取消；后台 / 退出 / 录音 / 求助时暂停。
- 任务、只读事件记录、每日复盘、次日记忆、本地存档、独立演示档与故事副本。
- 当前到访身份；主角默认身份、全部 NPC 属性与完整节奏参数的编辑、差异预览、校验和保存。
- A 方向内三种色调微调；桌面与小屏排版。

## 真实能力边界

这是可交互的设计原型，NPC 回复使用有限的本地解析规则，**没有接入真实 AI、后端或付费语音服务**。不认识的指令会说明可演示范围。完整自由对话、通用多日自主成长、复杂任务配置、连续自动执行的通用计划、真实多患者资源调度与生产级故障恢复仍需继续实现。当前多步计划按步骤明确确认，候补前两位是本地样例，截止/新后续以钥匙任务验证。全部 NPC 的资料编辑和受约束的归档交接已有本地可操作流程；不代表完整依赖图已经实现。

NPC 语音由浏览器可用的英语声音合成；每条消息独立决定语音或文字，保存后不再随机变化。人物声音在当前设备的可用列表中固定分配；不同浏览器不保证相同音色。

用户录音使用真实麦克风，可生成语音 IM；浏览器支持并能连通其识别服务时，会生成英语草稿。没有自动转写时，本地规则演示需要用户补充英文转写再发送。录音和识别失败不扣游戏时间，始终能用文字继续。语音识别可能依赖浏览器提供商的在线服务；本原型不会主动上传录音到自建服务。

世界仅存于当前浏览器的 localStorage；浏览器清理数据会清除存档。保留原始语音可能触及存储容量，正式产品应改用持久化服务。不要将本地原型当作正式数据存储。

## 文件与验证

- `Scentalka Prototype.html`：入口；`styles.css`：视觉系统；`world.js`：地图；`app.js`：本地状态与原有交互；`flows.js`：示例；`desk.js`：世界/NPC；`records.js`：学习/隐私；`life.js`：任务/服务/事件；`actions.js`：生活行为/每日循环/助手；`presets.js`：新建/物品/独立样例；`controls.js`：键位/恢复；`plans.js`：可保存计划与检查点；`calendar.js`：按日预约/候补；`commitments.js`：截止/重新协商/独立后续；`schedules.js`：多段日程/回复检查点；`objects.js`：有限物品/遗落；`voice.js`：可取消录音/检查/收听队列。
- `design-brief.md`、`brand-spec.md`、`product-facts.md`：设计依据、素材与范围说明。
- `verification/`：Playwright 交互脚本及验证截图。
- 素材：Kenney Roguelike Indoors / Modern City / Characters，CC0；字体 DM Sans / Instrument Serif，OFL。许可保留在 `assets/`。

验证命令（先启动上述服务器；支持本机 Codex 自带 Playwright，或自行安装 Playwright）：

```sh
node 原型/verification/verify.cjs
node 原型/verification/verify-flows.cjs
node 原型/verification/verify-desk.cjs
node 原型/verification/verify-branches.cjs
node 原型/verification/verify-plans.cjs
node 原型/verification/verify-routines.cjs
node 原型/verification/verify-voice.cjs
```

已验证家庭、医院、道路三个完整流程，以及重复交付保护、非英语输入不扣时、刷新保留、未读知识边界、设置预览与范围校验、角色切换和 1440 / 1280 / 390 像素视口。录音使用受控浏览器回调验证权限取消/拒绝、识别与草稿、检查/发送及迟到回调，不代表真实麦克风/音质/识别效果已验证。真实设备仍需体验。
