# Scentalka 原型全功能体验 SOP

适用版本：当前本地原型；整理日期：2026-10-26。

这份手册可以边开原型边照着操作。先完成第 1～5 节的三条主线，再按兴趣体验后面的功能。**每条英文指令单独发送；发送前先看输入框的对象。** 文中的时间是游戏时间，不是现实时间。

## 目录

- [1. 打开原型和第一次设定](#1-打开原型和第一次设定)
- [2. 先认清输入框和存档](#2-先认清输入框和存档)
- [3. 家庭：答应帮忙，实际交出钥匙](#3-家庭答应帮忙实际交出钥匙)
- [4. 医院：预约、携证、签到和接诊](#4-医院预约携证签到和接诊)
- [5. 道路：读通知、停止等待、改走步行](#5-道路读通知停止等待改走步行)
- [6. 同一个世界连续生活](#6-同一个世界连续生活)
- [7. 材料准备与实际取放](#7-材料准备与实际取放)
- [8. 六项任务与接受、推迟、拒绝](#8-六项任务与接受推迟拒绝)
- [9. 英文总结：草稿、退回、修订和历史版本](#9-英文总结草稿退回修订和历史版本)
- [10. 多步计划与时间线](#10-多步计划与时间线)
- [11. 七日预约、改约、取消和失约](#11-七日预约改约取消和失约)
- [12. 医院候补：加入、读提议、明确接受](#12-医院候补加入读提议明确接受)
- [13. 承诺延期、逾期和补救](#13-承诺延期逾期和补救)
- [14. 做早餐、生活事件和自主进展](#14-做早餐生活事件和自主进展)
- [15. 有限物品、补水、遗落和找回](#15-有限物品补水遗落和找回)
- [16. 人物资料、添加、归档和职责交接](#16-人物资料添加归档和职责交接)
- [17. 多段日程、位置和等待回复](#17-多段日程位置和等待回复)
- [18. 临时联系人与交换联系方式](#18-临时联系人与交换联系方式)
- [19. 语音录制、检查、收听和知情](#19-语音录制检查收听和知情)
- [20. 助手、表达收藏和草稿保护](#20-助手表达收藏和草稿保护)
- [21. 主角、身份、节奏、物品预设和新故事](#21-主角身份节奏物品预设和新故事)
- [22. 每日结束、跨日和离线暂停](#22-每日结束跨日和离线暂停)
- [23. 独立药房样例](#23-独立药房样例)
- [24. 故障恢复、数据和快捷键](#24-故障恢复数据和快捷键)
- [25. 完成清单与卡住时的处理](#25-完成清单与卡住时的处理)

## 1. 打开原型和第一次设定

1. 在项目根目录打开终端，运行：

   ```sh
   python3 -m http.server 8766 --bind 127.0.0.1 --directory 原型
   ```

2. 浏览器打开 [Scentalka 原型](http://localhost:8766/Scentalka%20Prototype.html)。若已有服务运行，直接打开链接。
3. 首次弹出 **FIRST-TIME SETUP**。按 **Continue** 前进；开局选 **Home**，姓名和人物先保留默认值，方便和手册对应。
4. 最后按 **Save & explore**，或 **Use current details** 跳过填写。设定关闭后，提示直接出现在真实页面的控件旁边。依次点 **World**，输入 `Look around.`，按 **Draft ready** 再按 **Do it**（也可直接按 Enter），查看真实反馈，再点联系人、**Assistant**、**Try a flow**。每一步都可以 **Next / Skip guide**，按 `Esc` 退出。
5. 顶栏叶片图标 **Page guide** 可重新开始页面引导；提示底部 **Edit story setup** 可重新打开设定。已有存档不会每次自动显示；直接打开 [页面引导](http://localhost:8766/Scentalka%20Prototype.html?tour=1) 或 [重新设定](http://localhost:8766/Scentalka%20Prototype.html?setup=1) 均无需清除存档。

**完成标志：** 地图上方显示 `Home / Living Room`，时钟为 `07:00`。后面的英文姓名均指默认人物；体验配置修改放在主线之后。

## 2. 先认清输入框和存档

### 同一个输入框，有三种对象

| 输入对象 | 怎么切换 | 用来做什么 | 示例 |
| --- | --- | --- | --- |
| **World** | 输入区的 World，或 `Alt+1` | 移动、拿取、交付、等待、打开面板 | `Go to the entrance.` |
| **人物 IM** | 点击人物联系人，或 `Alt+2` 回当前人物 | 发给这个人的原话 | `I'll bring it to you now.` |
| **Assistant** | 输入区的 Assistant，或 `Alt+3` | 私下询问英语、理解已知内容、准备表达 | `Help me politely decline.` |

点击 **Send** 或在底部输入框按 `Enter` 才提交。**点示例、选择预约时段、复用表达通常只填草稿，还要自己发送。** 地图用于看位置，点击地图不会移动。

左侧 **Tasks** 看任务，**Pocket** 看物品，**Journal** 看已发生的记录，**Desk** 打开全部管理功能，**Day end** 结束一天。关闭面板用右上角 × 或 `Esc`。

普通聊天有待结算耗时，切换人物或打开助手不立即扣时；下一次世界行动前会一起结算。想明确结束聊天，可在当前人物 IM 发 `End this conversation.`。看面板和现实中等待不会自动推进时钟。

### 本手册里的“全新 Home / Hospital / Road”怎么打开

1. 点左下 **Studio**。
2. 选对应预设：**01 / A morning at home**、**02 / A hospital visit**、**03 / A change of plans**。
3. 再打开 **Studio → New copy of current preset → Create a new copy**。
4. 若出现首次设定，保留当前开局，用 **Use current details**，再点 **Skip guide** 关闭页面提示。

第 3 步会按系统默认配置创建新副本，旧故事保留；只点预设卡片会继续那个预设已有的进度。新副本可在 **Studio → Saved stories** 找回，列表用预设类型、天数、时间区分，暂不支持自定义故事名。

**注意开局差异：** Home 为 07:00 家中；Hospital 为 08:00 家中、尚未预约；Road 为 08:00 道路、已有 09:00 预约。首次设定里只选 Hospital 场景，不等于打开 Hospital 演示预设。

**最省操作的方法：** 输入框上方点 **Try a flow**，选主线，再点 **NEXT EXAMPLE** 旁的示例，核对对象后按 `Enter`。示例会随真实进度变化。选择流程不会传送或重置世界。

## 3. 家庭：答应帮忙，实际交出钥匙

**起点：全新 Home，07:00。** 也可以在 Try a flow 选 **Family & the key**。

| 步骤 | 对象 / 入口 | 操作 | 应该看到什么 |
| --- | --- | --- | --- |
| 1 | Sarah IM | 若已有语音，先点播放听完，或 **Show transcript** | 了解 Sarah 的请求 |
| 2 | Sarah IM | `Do you need the house key this morning?` | Sarah 回应钥匙安排 |
| 3 | Sarah IM | `I'll bring it to you now.` | 接受交接承诺；钥匙还没转移 |
| 4 | World | `Go to the entrance.` | 位置变成 Entrance |
| 5 | World | `Take the house key from the tray.` | Pocket 的钥匙归你 |
| 6 | World | `Give the house key to Sarah.` | 钥匙归 Sarah，任务完成 |
| 7 | Pocket / Journal | 查看物品与交付记录 | 留下实际行动证据 |

**完成标志：** 默认配置、没有额外交流时为 `07:04`，钥匙所有者为 Sarah。重复发送交付指令不会复制钥匙，也不会再扣时。聊天说“我会带来”不会替你拿取或交付。

## 4. 医院：预约、携证、签到和接诊

**起点：全新 Hospital，08:00，人在家中，无预约。** Try a flow 选 **A hospital visit** 也能逐步提示。

| 步骤 | 对象 / 入口 | 操作 | 应该看到什么 |
| --- | --- | --- | --- |
| 1 | World | `Open the hospital directory and Emma's chat.` | 打开接待 Emma 的 IM，尚未预约 |
| 2 | Emma IM | `Do you have an appointment at nine o'clock today?` | 提议 09:00 时段 |
| 3 | Emma 消息 | 读文字；语音则听完或 **Show transcript** | 确认提议内容 |
| 4 | Emma IM | `Yes, please book that time for me.` | 09:00 预约成立，通常为 08:01 |
| 5 | World | `Take my ID card and go to the hospital.` | 实际取证件并旅行；等待分段路线结束 |
| 6 | Emma IM | `I'm here for my nine o'clock appointment. Here is my ID.` | 到 Reception 核验身份并登记 |
| 7 | World | `Wait until I'm called.` | 游戏时间推进至叫号检查点 |
| 8 | Grace IM | 打开叫号；语音听完或查看转写 | 获知医生已准备好 |
| 9 | World | `Go to the consultation room.` | 进入诊室，开始接诊 |
| 10 | Dr. Daniel Patel IM | `I have been feeling uncomfortable since yesterday.` | 医生询问持续时间与问题 |
| 11 | 医生 IM | `Thank you, that's all for now.` | 结束本地接诊演示 |

**完成标志：** 预约为 **Completed**；默认顺序约为 `08:32` 到院、`08:33` 登记、`09:00` 叫号、`09:01` 入诊室、`09:16` 完成。多聊几句可能改变中间时间，以实际状态为准。正常接诊结束没有处方。

若等待一次结束后还没叫号，再发送 `Wait until I'm called.`；单次等待受上限约束。若有暂停余程，先 `Continue the plan.` 或 `Cancel the remaining plan.`。不要在叫号后继续无目的等待，以免错过到场窗口。

## 5. 道路：读通知、停止等待、改走步行

**起点：全新 Road，08:00，已有 09:00 预约。** Try a flow 选 **A change of plans**。

1. **World** 发 `Take the bus to the hospital.`。
2. 到约 `08:05` 被公交延误打断，仍未上车。打开 **Ben IM**，读通知；语音用 **Show transcript** 或播放。
3. **World** 发 `Wait for the bus, but stop after ten minutes.`。
4. 看到约 `08:10` 的检查点时按 `Esc`，暂停剩余等待。若反应慢已等完，仍可直接继续下面两步。
5. **World** 发 `Cancel the remaining plan.`。
6. **World** 发 `Walk to the hospital instead.`，等待到院。

**完成标志：** 若在 08:10 停止，约 08:30 抵达；原 09:00 预约仍在。停止行动、取消路线和取消预约是三个独立操作。

继续体验“解释延误”任务：在 **Emma IM** 依次发送：

```text
My bus is delayed. What are my options?
```

```text
I will keep my appointment.
```

然后到 **Desk → Tasks & written work → Explain a delay → Details** 看状态。**完成标志：** 自己发送延误说明，并明确保留预约后完成；助手不会替你通知 Emma。

## 6. 同一个世界连续生活

**起点：第 3 节交完钥匙的 Home 故事。** 这一节不要切换 Studio 存档。

1. **Try a flow → A hospital visit**。
2. 点当前示例，再按 `Enter`。07:04 到 08:00 可能需要几次有界等待；每次看新的 NEXT EXAMPLE。
3. 继续照示例预约、去玄关拿 ID、出行、登记、等待叫号、读 Grace 通知、入诊室、描述症状、结束接诊。
4. 用 Pocket 确认钥匙仍在 Sarah 手里；用 Journal 确认家庭和医院记录在同一个世界。

**完成标志：** 同一故事保留家庭交付与 Completed 接诊。这里体验的是世界内连续行动，Studio 只负责切换独立故事。

## 7. 材料准备与实际取放

**起点：全新 Home，早于 09:00。**

1. **Sarah IM** 发 `Please prepare the appointment documents.`。
2. **World** 发 `Wait for Sarah's documents.`，等到任务完成通知。
3. 读 Sarah 最新回复；可用 **World** `Read Sarah's latest message.`。未读时不会提前展示完整结果。
4. **World** 依次发 `Go to the entrance.`、`Take the document folder.`。
5. 看 Pocket 和材料任务；再发 `Put the document folder on the tray.`，观察归属变化。

**完成标志：** 准备需要游戏时间，实际领取才完成材料收集；文件夹从原有物品移动而来。取放后位置在 Pocket 中更新。

## 8. 六项任务与接受、推迟、拒绝

**入口：Desk → Tasks & written work**。每项点 **Details** 看目标、来源、截止、完成证据。以下不是六个相互独立的“一键完成”按钮：

| 任务 | 体验位置 | 完成证据 |
| --- | --- | --- |
| Hand over the house key | 第 3 节 | 实际交出钥匙 |
| Prepare the appointment documents | 第 7 节 | 准备完成并领取原文件夹 |
| Arrange a hospital visit | 第 4 节 | 预约、签到、完成接诊 |
| Find the right route | 第 5 节或 World `Walk to the hospital.` | 实际抵达医院 |
| Explain a delay | 第 5 节后半段 | 已知延误、发送解释、明确预约决定 |
| Summarize the next steps | 第 9 节；接诊后解锁 | 经过审阅的总结版本 |

**用独立 Home 副本体验任务选项：**

1. 钥匙任务 **Details → Edit request preset**；改英文标题或目标，截止可试 `11:00`。
2. **Review request wording → Save request preset**，回任务列表确认文案变化。
3. **Not now** 表示推迟，**Decline request** 表示拒绝；拒绝后有游戏时间冷却，别在这个副本马上测试重新接受。
4. 在另一个新副本用 **Accept request**。已接受的普通任务可能有 **Cancel commitment**；医院和材料服务需按服务流程协商。
5. **Prepare next step** 只把建议填进相应草稿，核对后自己发送。

**完成标志：** 状态随选择改变，接受任务不等于完成行动。活跃任务满额时，新的可选邀请会显示等待容量；完成已有任务或到下一游戏日后再检查。已接受任务的历史和规则不能通过改预设重写。

## 9. 英文总结：草稿、退回、修订和历史版本

**起点：第 4 或第 6 节已完成接诊的故事。**

1. **Desk → Tasks & written work → Summarize the next steps → Details → Accept request**。已接受时点 **Open writing desk**。
2. 输入 `Thank you.`，按 **Save draft**，确认草稿保存。
3. **Review submission → Submit to doctor**。
4. 应出现 **Version 1 · Needs revision**，提示缺少下一步、时间等信息。
5. 将草稿改为：

   ```text
   My next step is to ask my remaining questions tomorrow. No prescription was issued.
   ```

6. 再按 **Review submission → Submit to doctor**。

**完成标志：** **Version 2 · Accepted**，Version 1 的 `Thank you.` 仍保留。旧提交不可修改，Accepted 版本为只读。这里使用本地信息要素检查，不是真实医生或 AI 的自由审稿。

## 10. 多步计划与时间线

### 10.1 逐项执行，IM 只准备草稿

**起点：全新 Home。**

1. **Desk → Your itinerary → Create itinerary**。
2. 编辑框填入，每行一项：

   ```text
   Go to the entrance.
   Take the house key.
   Message Sarah: I have the key with me.
   Give the key to Sarah.
   ```

3. **Preview steps → Save itinerary**。保存时位置和时间不改变。
4. 点 **Run next step**，只执行去玄关；再次打开 Your itinerary 再点，才取钥匙。
5. 第三次执行会切 Sarah IM，输入框出现 `I have the key with me.`。先看聊天记录，确认尚未发送，再自己 **Send**。
6. 返回计划执行交付。

**完成标志：** 各项依次 Completed，消息仅在自己发送后送达。最多八项；不支持的步骤会阻止整份保存，例如 `Go to the entrance then invent a car`。

### 10.2 修改余程、连续执行和取消

1. 在新 Home 副本的 **World** 输入：

   ```text
   Go to the entrance then take the ID card then wait for 5 minutes
   ```

2. 预览后 **Save itinerary**，执行前两项。
3. **Your itinerary → Edit remaining steps**，改为 `Wait for 10 minutes.`，**Preview steps → Save itinerary**。
4. 查看已完成项和版本记录，再点 **Cancel remaining itinerary**。
5. Pocket 中证件仍归你，取消不会撤销已发生的行动。
6. 另建简单计划，选择 **Run remaining steps** 可连续执行；遇事件、已知检查点或需要发 IM 的步骤会暂停。

### 10.3 长行动与时间线

1. 在全新 Hospital 的 **World** 发 `Walk to the hospital then go to the waiting area`，保存并执行第一项。
2. 旅行中按 `Esc`，或 `Ctrl+.`；刷新后仍停在已提交检查点。
3. **World** 发 `Continue the plan.`，仅走完余程。后面的去候诊区仍可通过计划逐项执行。
4. **Desk → World timeline** 查看当前时刻、已知回复或预约节点、计划剩余与暂停原因。

**完成标志：** 暂停后保留余程，刷新不重演已完成路段。打开面板、求助或录音可能暂停计划，关面板后需要自己继续。时间线不会透露未读消息正文或未知的私人安排。

## 11. 七日预约、改约、取消和失约

### 11.1 用日历选择时段

**起点：全新 Hospital。**

1. **Desk → Today’s arrangements → View appointment slots**。
2. 在 **Appointment day** 选择今天至之后六天中的一天；点可用时段。
3. 回 Emma IM 检查自动准备的日期、时间；此时还没预约，自己 **Send** 才成立。
4. 重复请求同一预约不会重复扣费式扣时；灰色 **Unavailable** 槽不能预约。

### 11.2 改约与取消

在全新 Hospital 的 **Emma IM** 依次发送：

```text
Please book an appointment at 09:30 today.
```

```text
Please reschedule my appointment to 11:00 today.
```

查看安排与旧预约记录，再发送：

```text
Please cancel my appointment.
```

**完成标志：** 预约先改到 11:00，再变为 Cancelled；旧安排保留历史。错过或取消的预约不能用签到话术恢复。

### 11.3 明日预约与营业规则

1. 在全新 Hospital 的 **Emma IM** 发 `Please book an appointment at 09:00 tomorrow.`。
2. 看日期为 Day 2；结束今天后仍保留未来预约。
3. **Today’s arrangements → Service hours** 查看营业与班次。可把闭院改为 `10:00` 后点 **Preview hours**，观察校验拒绝；关闭，不保存这个无效修改。
4. 如要体验失约，在另一个副本预约今天的时段，再用有上限的等待推进到到场宽限之后，查看 **Missed**。可能在必要节点暂停，先处理余程再继续。

**完成标志：** 未来预约按游戏日期判断；医院默认 08:00～18:00，同一医生槽有容量限制，到场宽限为 5 分钟。

## 12. 医院候补：加入、读提议、明确接受

**起点：全新 Hospital，无预约。**

1. **World** 发 `Take my ID card and go to the hospital.`，等到 Reception，Pocket 确认 ID 随身。
2. **Desk → Hospital standby → Ask to join standby**。
3. 检查 Emma IM 中的加入草稿，自己 **Send**。返回 Hospital standby 查看 **Waiting**。
4. **World** 发 `Wait for 5 minutes.`，看到新通知或计划暂停后检查候补状态，应为 **Offered**。若有余程，先 `Cancel the remaining plan.`。
5. **Hospital standby → Read reception offer**；如果打开的是语音消息，听完或 **Show transcript**。
6. 再打开 **Hospital standby**，点 **Accept offer draft**，核对 Emma 草稿，自己 **Send**。

**完成标志：** 候补变 **Booked**，产生实际预约。收到 Offered 还没预约；未读提议不能直接接受。按本节出行时间，实际提议不一定是 08:30，以消息里的可用时段为准。

**额外分支，用另一个副本：**

- 收到提议后不接受，再等 5 游戏分钟，检查 **Offer expired**；既有原预约不会因此取消。
- 只想退队：**Hospital standby → Ask to leave standby → Send**。
- 只停止等待：`Esc` 或 `Cancel the remaining plan.`，候补资格仍在。

候补最多三人，已有两位本地样例；最长 30 游戏分钟且不跨闭院，提议接受窗口为 5 分钟。非现场或未携证时加入会被拒绝。

## 13. 承诺延期、逾期和补救

**起点：全新 Home，暂时不要交钥匙。**

1. **Sarah IM** 发 `I'll bring it to you now.`，接受晨间交接。
2. 再发 `Please change the key handover to 14:00 today.`。
3. **Desk → Promises & follow-ups**，确认截止改为今天 14:00，原变更记录保留。
4. 点 **Day end → Review next checkpoint**，审阅必要截止节点。若还有其他必要节点，继续审阅，直到原尝试显示 **failed**。
5. 关闭弹窗，在 **Sarah IM** 发 `Please arrange a new key handover at 09:00 tomorrow.`。
6. 查看出现独立的新后续约定；**Day end → Begin tomorrow**。
7. 次日 **World** 依次发 `Go to the entrance.`、`Take the house key.`、`Give the house key to Sarah.`。

**完成标志：** 新后续 Completed，原失败仍为 failed。原任务可能仍显示 overdue，这是保留失约事实，不是补交没生效。改约和新后续通过明确沟通建立，不能修改旧记录消除失败。

## 14. 做早餐、生活事件和自主进展

**起点：全新 Home。**

1. **World** 发 `Go to the kitchen.`，再发 `Prepare breakfast.`。
2. 预览后点 **Start activity**；等待分段活动结束。若中途停止，按计划的继续/取消处理。
3. **World** 发 `Wait for five minutes.`。
4. **Desk → Things that changed**，应出现早餐后 Mia 的笔记本事件。
5. 可先 **Decide later**，再回来决定；**Leave it** 表示不主动帮忙，也可选择界面中的帮忙或整理选项。
6. 如果帮忙先产生 Mia 草稿，自己发送；若原等待被事件暂停，先在 World 发 `Cancel the remaining plan.`。再尝试 `Tidy the room.`，确认 **Start activity** 后进行。
7. **Mia IM** 发 `How is your progress?`，看目标进展；再检查事件和 Journal 的来源记录。
8. 另外可在 **World** 发 `Rest.`，查看活动预览、开始与停止。

**完成标志：** 活动真实耗时，事件由生活状态触发；你的决定与 Mia 自主整理留下各自记录。推迟不等于解决。不同选择可能让笔记本由 Mia 自己整理，按实际事件状态判断。

## 15. 有限物品、补水、遗落和找回

**起点：全新 Home；入口 Desk → Everyday objects 可随时核对。**

### 15.1 水瓶和零食

在 **World** 逐条发送：

```text
Go to the kitchen.
Take the water bottle.
Drink some water.
Drink some water.
Drink some water.
```

喝完后再发一次 `Drink some water.`，应提示空瓶且不扣时。然后：

```text
Go to the living room.
Refill the water bottle.
Take the snack.
Eat the snack.
Eat the snack.
Go to the kitchen.
Refill the water bottle.
Put the water bottle on the kitchen shelf.
```

**完成标志：** 异地补水失败；零食仅能吃一次；回厨房才补满三份，放回架子后所有权改变。代码块里每一行仍要单独提交。

### 15.2 遗落证件

在 **World** 依次发：

```text
Go to the entrance.
Take my ID card.
Drop my ID card.
Go to the kitchen.
Take my ID card.
```

厨房取回失败。刷新后再看 Everyday objects，证件仍在玄关地面。返回：

```text
Go to the entrance.
Take my ID card.
```

**完成标志：** 只能在原区域找回。去医院时若没实际携带 ID，即使 IM 说“Here is my ID”也不能登记。

## 16. 人物资料、添加、归档和职责交接

**起点：独立 Home 副本；入口 Desk → People in your world。** 人物管理视图不等于获得私人联系人。

1. 点 Mia，修改 **Current goal** 为 `Organize my notebook every morning`；其他资料、关系、性格、偏好、压力、初始信息、声音和精灵形象也可查看。
2. **Preview person → Save changes**，刷新后重新查看；人物页下方 **Experiences, kept as they happened** 可查看目标进展、关系与来源事件。
3. 回人物列表 **Add a person**，输入 `Alex`，保留其余默认字段，**Preview person → Save changes**。
4. 检查新人物出现在世界人物列表，但没有凭空成为私人朋友。
5. 点 Emma → **Archive / replace → Preview handover**。没有有效继任人时应拒绝。
6. 回列表 **Add a person**，姓名 `Robin`，Scene 选 **Hospital**，Area 选 **Reception**，保留默认有效班次并保存。
7. 回 Emma → **Archive / replace**，在继任人里选 Robin，**Preview handover → Save changes**。
8. 看 Emma 归档、Robin 承担接待职责；查看 Robin 的 IM，旧 Emma 的对话不会复制过去。

**完成标志：** 配置保存、依赖检查有效；一般新人物可以归档，必要服务岗位需有符合场景、班次和职责条件的继任者。此节会改变服务联系人，后续主线请换默认副本。

## 17. 多段日程、位置和等待回复

**起点：独立 Home 副本。**

1. **Desk → People in your world → Sarah → Daily routine**。
2. 第一段结束改为 `08:00`；点 **Add time block**。
3. 第二段 From `08:10`、Until `09:00`，Scene **Home**、Area **Kitchen**，Activity 填 `Preparing breakfast`，勾选 **Available to reply**。
4. **Preview routine → Save routine**，刷新确认保存。
5. 再编辑，把第二段开始试改为 `07:50` 后预览，应拒绝重叠；改为 `08:00` 后预览，应提示地点移动间隔不足。关闭无效编辑，保留已保存日程。
6. **World** 发 `Wait until 08:00.`。若单次等待受限，重复到 08:00；再 `Wait for 5 minutes.` 到 08:05。
7. **Sarah IM** 发 `Where are you?`，应是已送达、待回复。
8. **World** 发 `Wait for 30 minutes.`，在 08:10 的回复检查点暂停；读 Sarah 消息，位置应为 Kitchen。
9. **Desk → World timeline** 看检查点和剩余等待；关闭后可 **World** `Cancel the remaining plan.`。

**完成标志：** 08:00～08:10 的空档影响回复，回复节点打断等待且保留余程。日程最多八段，每日重复；医院必要服务还需覆盖营业窗口。也可用 `Wait for Sarah's reply.` 做有上限的定向等待。

## 18. 临时联系人与交换联系方式

**起点：全新 Road，08:00。**

1. **World** 发 `Go to the sidewalk.`。
2. **World** 发 `Open the public directory.`，在附近人物里找 Nora，点 **Greet in IM**。
3. **Nora IM** 发 `Can we exchange contact details?`。
4. **World** 发 `Go to the bus stop.`，离开她所在区域。
5. 回 Nora IM 发 `Hello.`，仍能远程交流。

**对照分支：** 在另一个全新 Road 副本，不交换方式就离开现场，再尝试联系 Nora，应被临时联系人权限拦住。Nora 的实际可遇见时段来自日程。

**完成标志：** 现场认识、明确交换方式、远程联系是不同状态；修改人物资料或称呼不能授予联系权限。

## 19. 语音录制、检查、收听和知情

### 19.1 录自己的语音

**起点：任意独立 Home 副本，选 Sarah IM。**

1. 底部先打 `Hello. `，暂不发送。
2. 点麦克风开始录音，允许浏览器权限，清楚说一句英文，再点一次停止；也可 `Alt+M` 开始/停止。
3. 打开 **Review voice draft**。若底部没看到入口，到 **Desk → Voice & listening → Review current voice draft**。
4. **Listen to my recording / Pause preview** 试听；检查 **English transcript / existing text draft**，必要时自己补英文。浏览器支持识别时可看候选和其实际提供的置信度。
5. 改转写后关闭再打开，确认文字保留；这时消息仍未发送。
6. 点 **Keep voice draft**，回输入框自己 **Send**，聊天中出现你的语音消息。

**分支选项：** **Record again** 新录一段；**Discard recording** 丢掉音频但保留文字；**Use text only** 改成纯文字发送。按住录音快捷键前先让焦点离开输入框，按住 Space 录、松开停止。权限等待或录音中按 `Esc` 可取消。

**完成标志：** 原草稿和识别文字不被无故覆盖；确认前不发送。没有自动转写时手动补英文仍可继续。权限被拒绝会保留文字且不走游戏时间；真实麦克风、识别服务和音质取决于设备与浏览器。

### 19.2 收听 NPC 语音与知情边界

1. **Desk → Voice & listening** 查看未播放列表；**Play / pause** 只播放，**Open IM** 才打开该聊天。
2. 选一条没听过的语音开始播放，中途暂停；不要先打开转写。
3. 切 Assistant，问 `What did Sarah say?`；若播放的是 Ben，就问 `What did Ben say?`。
4. 再完整听完或打开 IM 的 **Show transcript**，重新问助手。

**完成标志：** 开始播放不等于听完整条；未读正文不提前展示。浏览器合成语音的词边界支持有限的部分听取；没有词级对齐的真实音频只保存秒数。播放队列不改变输入对象，录音中不能并行播放另一条。

NPC 消息可能是文字，找不到语音时可先在 **World pace** 提高新消息语音比例，再触发几条新回复；该比例不改已有消息，也不保证每条都是语音。

## 20. 助手、表达收藏和草稿保护

**起点：任意故事。**

1. 切 **Assistant**，发送 `Help me politely decline.`，查看英语建议。
2. 刷新再看助手，历史保留；检查 Sarah IM，没有自动代发。
3. **Desk → Words to keep**，Expression 填 `Could we agree on another time?`，When I would use it 填 `When I need to renegotiate a commitment.`，点 **Save expression**。
4. 关闭面板，选 Sarah IM，输入 `Keep my unfinished thought.`，暂不发送。
5. 回 Words to keep，对收藏点 **Prepare a draft**；先选择保留现有草稿，确认原文字还在。
6. 再次复用并确认替换，回输入框看到收藏内容；自己决定是否发送。
7. 消息旁的收藏入口也可直接保存表达与上下文，收藏内的 **Remove bookmark** 只移除收藏。

**完成标志：** 助手历史、表达和上下文保存；复用有草稿保护，不自动发送。助手只能引用你已读或已听的消息内容。

## 21. 主角、身份、节奏、物品预设和新故事

**起点：独立 Home 副本，以免影响主线默认设置。**

| 功能 | 操作 | 完成标志 |
| --- | --- | --- |
| 主角资料 | **Desk → You & your roles**，改姓名、职业、背景、家庭、生活安排或目标，**Preview profile → Save changes** | 预览差异后才保存，刷新保留 |
| 本次身份 | 地图上方 **Visiting as → This visit** 选 Parent，**Confirm visit role** | 当前到访身份改变，仍是同一个人 |
| 默认身份 | You & your roles 改场景默认角色并保存；下次到访核对 | 默认值与当前到访可分开设置 |
| 完整节奏 | **Desk → World pace**，改一个值，如 Active optional tasks 为 4，**Preview pace → Save changes** | 新设置生效；既有行动与事实保留 |
| 校验节奏 | 路线耗时可试 33；16 不符合步进。预览观察错误后关闭 | 无效参数不能保存 |
| 物品显示预设 | **Desk → Item presets** 改英文名称/描述，**Review descriptions → Save item descriptions** | 显示变化，数量和实际归属保持 |
| 视觉微调 | **Studio → Paper / Sage / Linen** | 配色变化，故事仍在 |

再体验 **Desk → Begin a new story**：填写英文资料；在物品初始位置中把 ID 选 **With you**，按 **Start with these details**。

**完成标志：** 独立新故事从默认 Home 开始，ID 按新设定随身；旧故事在 Studio 的预设卡片或 Saved stories 中继续。新故事和预设新副本都不会自动复制当前已完成的生活历史。顶栏头像也提供原有预设编辑入口，修改需先预览确认。

## 22. 每日结束、跨日和离线暂停

**起点：任意有进度的独立故事。**

1. 记下当前时间、物品、未来预约；刷新，确认没有凭现实时间走时。
2. 点 **Day end**，看仍开放的承诺和下一个必要检查点。
3. 若显示 **Review next checkpoint**，先点它处理截止/结果，再选择下一步；准备进入次日时点 **Begin tomorrow**。
4. 次日检查物品、关系、旧消息、未来预约仍在；未完成承诺不会凭空完成。
5. **Desk → Words to keep → Daily reflections** 查看前一天复盘。

**完成标志：** 到 Day 2 的设定早晨，保留世界事实和反思。普通等待跨过午夜也会进入次日；单次默认最多等待 30 分钟，可在独立副本的 World pace 调高上限后分段推进。关闭页面再回来仍暂停。

## 23. 独立药房样例

**入口：Desk → A pharmacy sample → Open sample story**。这会创建单独故事，已有明确记录的虚构处方和随身 ID，正常就诊故事保持原状。

1. 在打开的 **Leo IM** 发 `Please collect my prescription.`。
2. 看已有处方核验后变 **Collected**，Pocket 出现 **Fictional practice pack**。
3. 再发一次同样请求，应拒绝重复领取、不再扣时。
4. 用 Studio 返回原来故事。

**完成标志：** 只有样例中的既有处方可领取。正常医院故事里问 Leo 不会凭空生成处方或药品。

## 24. 故障恢复、数据和快捷键

### 24.1 行动前失败与仅重试回复

**起点：全新 Home。入口 Desk → When something fails。**

1. Next world command 选 **Fail before action**，点 **Use this simulation**。
2. **World** 发 `Go to the entrance.`，位置和时间不变。
3. 重开 When something fails，点对应请求的 **Retry action**，这次移动一次。
4. 再选 **Action committed · reply unavailable → Use this simulation**。
5. **World** 发 `Take my ID card.`，实际物品已取到。
6. 重开恢复面板，点 **Retry reply only**；Pocket 与时间不重复变化。

**完成标志：** 同请求可恢复，已提交行动不重做。这是本地故障阶段模拟。

若要体验“纠正误解”，在 World 发 `Report misunderstanding.`，在 **What should be corrected?** 填入英文说明，例如 `I meant to wait here, not leave the area.`，按 **Record correction & pause**。Journal 会追加纠正记录，已有历史保留；关联行动需后续检查，不会自动倒带。

也可在独立 Home 副本发 `Don't go to the hospital.`，确认否定句不执行出行。当前解析仍有限，出现误解时按上面的纠正入口记录。

### 24.2 导出、隐藏与删除

**先在要隐藏的联系人 IM 停留，再打开 Desk → Your data。删除功能用单独练习副本。**

1. Export scope 选 **Complete world, including available audio → Export JSON**，下载 `scentalka-world-day-…json`。
2. 还可分别导出对话与转写、世界记录、可用原音频。当前界面提供快照导出，没有配套导入入口。
3. **Hide this conversation** 隐藏当前人物聊天；重开数据面板 **Show hidden conversations** 恢复显示。
4. 有录音的练习副本中，**Remove saved audio → Remove audio**。文字转写和记忆保留，原录音及录音草稿删除。
5. 仅在不需要的练习副本体验 **Delete this story…**，输入 `DELETE`，点 **Permanently delete**。

**完成标志：** 隐藏可恢复、删音频不删转写、永久删除只移除当前故事并切到另一故事。存档属于当前浏览器的当前站点，换浏览器、清理站点数据或改 localhost/127.0.0.1 来源可能看不到同一份进度。

### 24.3 键盘与小屏操作

1. 顶栏 **⌘ → Customize keys**，把 World desk 的键改为 `x`，**Save key bindings**。
2. 关闭面板，点击地图让焦点离开输入控件，再按 `x`，应打开 Desk。
3. 需要恢复时进 Customize keys → **Restore defaults → Save key bindings**。
4. 缩窄窗口后，弹窗和任务可滚动，语音四个处理按钮可能在下方；用 Tab 移动、Enter 激活。

| 按键 | 功能 |
| --- | --- |
| `Alt+1 / 2 / 3` | World / 当前人物 IM / Assistant |
| `Alt+F` | Try a flow |
| `/` | 聚焦输入框 |
| `Alt+T / I / J` | Tasks / Pocket / Journal |
| `Alt+D / S` | 公开目录 / 预设 |
| `Alt+M / P / R` | 录音开始停止 / 最新语音播放暂停 / 转写 |
| `H / J / I / C / E / G` | 焦点在输入控件外时：助手 / 记录 / 物品 / 联系人 / 事件 / Desk |
| 按住 `Space` | 输入控件外按住录音，松开检查 |
| `Esc` | 关闭面板、取消录音或停止当前计划，取决于当前状态 |
| `Ctrl+.` | 始终停止世界计划，即使正在打字 |

人物 IM 里发 `Stop` 只是把这个词发给人物。停止世界计划请用 Esc 或 Ctrl+.。

## 25. 完成清单与卡住时的处理

### 一轮完整体验的勾选清单

- [ ] 首次设定、七步页面内引导、Home / Hospital / Road 三场景。
- [ ] World / IM / Assistant 区分、草稿隔离、片段结算。
- [ ] 家庭交接、材料准备、路线出行、医院接诊、延误说明、总结提交六项任务。
- [ ] 停止、继续、取消、路线改变和预约保持。
- [ ] 多步计划预览、逐项/连续执行、IM 草稿、余程编辑与历史。
- [ ] 时间线、跨日预约、改约、取消、失约、候补接受/退队/过期。
- [ ] 钥匙承诺延期、失败、新后续、补交后保留旧失败。
- [ ] 早餐、生活事件、人物自主进展、休息与整理。
- [ ] 水瓶消耗补满、一次性零食、遗落物品原地找回。
- [ ] 人物资料、声音/外观、添加、归档、必要职责继任、日程与回复节点。
- [ ] Nora 现场认识、交换方式、远程联系。
- [ ] 录音、转写编辑、试听、重录、丢弃/纯文字、收听队列与未读边界。
- [ ] 助手历史、表达收藏/复用/移除、已有草稿保护。
- [ ] 主角资料、默认/本次身份、完整节奏、物品预设、视觉主题、新故事。
- [ ] 日终检查点、次日延续、反思、刷新与离线暂停。
- [ ] 独立药房核验和重复领取保护。
- [ ] 两阶段故障恢复、误解纠正、四种导出、隐藏恢复、删除音频、删除练习副本。
- [ ] 快捷键修改/恢复、Tab/Enter、小屏面板操作。

### 卡住先查这张表

| 现象 | 下一步 |
| --- | --- |
| 发送行动却像在聊天 | 看输入对象，切 World 后重新输入行动 |
| 点示例后没发生事 | 示例只填草稿，核对后自己 Send |
| 点击地图走不动 | 用 World 英文移动指令 |
| 改了 Try a flow，开局没变 | 流程选择不重置；新开局用 Studio 新副本 |
| 再进演示档不是初始时间 | 卡片继续旧进度；用 New copy of current preset |
| 计划不往下走 | 查暂停原因，World Continue the plan，或取消余程后另行动 |
| 说“我有证件”却不能签到 | Pocket 检查实际 ID、Reception 位置、日期与有效预约 |
| 收到叫号却不能入诊室 | 打开 Grace 通知；语音听完或 Show transcript |
| NPC 不立即回复 | 查看日程；用有界等待，现实等待无效 |
| 承诺已说出口但任务没完成 | 查看实际物品、位置与完成证据；承诺不自动执行 |
| 候补 Offered 却无预约 | 先读提议，再准备接受草稿并发送，留意 5 分钟窗口 |
| 语音识别没有文字 | 在 Review voice draft 手动补英文，或 Use text only |
| 手册时间和界面有差异 | 检查额外交流、节奏修改、是否真是新副本；以状态证据为准 |
| 中文输入没有动作 | 当前游戏只接受英文；使用手册中的英文示例 |
| 自由措辞不识别 | 先用本节精确示例跑通；当前为有限规则原型 |

本手册覆盖当前已做出的可操作入口。真实 AI、多 NPC 通用多日自治、完整自由语义、生产后台等尚未实现；详细范围见 [功能覆盖核查](功能覆盖核查.md)。
