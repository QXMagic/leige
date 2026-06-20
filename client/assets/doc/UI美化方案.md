# UI 美化方案（皮肤 + 字体 + 重构）

> 现状诊断：UIManager 里 33 处 `Graphics`（代码画矩形）+ 61 个 `Label`、用系统默认字体、宠物也是代码画；项目里已有的 60 张 `Animal Pack` 贴图完全没用上。所以「丑」= 扁平矢量 + 默认字体 + 现成美术没用。
>
> 本方案已在代码侧搭好「主题/皮肤」骨架（`Theme` + `UISkin` + 皮肤化按钮 + 一键刷字体），你在编辑器里导入资源、绑定即可让整套 UI「点亮」。

---

## 一、代码侧已就绪（无需你改代码）

| 文件 | 作用 |
|---|---|
| `assets/scripts/UI/Theme.ts` | 设计系统：配色板 / 圆角 / 字号 / 间距 / 皮肤引用，全 UI 从这里取值 |
| `assets/scripts/UI/UISkin.ts` | **编辑器组件**：把字体和九宫格贴图拖进去 → 自动注入 Theme |
| `UIManager.makeButton` | 已改为「有皮肤用九宫格贴图(按语义色 tint) + 按下态，无皮肤回退原绘制」 |
| `UIManager.createUI` 结尾 | 调 `Theme.applyFontToTree()`，一次性把字体刷到所有 Label |

> 不绑定任何资源时，行为和现在**完全一样**（安全回退）；绑定后立即升级。

---

## 二、需要你准备的资源（推荐免费可商用）

### 1. 字体（提升最明显，优先做）
- **得意黑 Smiley Sans**（免费可商用，圆润活泼，很适合游戏）：github.com/atelier-anchor/smiley-sans
- 备选：站酷快乐体、阿里巴巴普惠体（均免费可商用）
- 用法：直接把 `.ttf` 拖进项目即可被 Cocos 当字体用（Label 支持 TTF）。追求描边/阴影更可控可转 BMFont，但 TTF 起步最快。

### 2. UI 皮肤（九宫格按钮 / 面板 / 进度条）
- **Kenney UI Pack**（CC0 完全免费）：kenney.nl/assets/ui-pack、ui-pack-rpg-expansion
  - 取其中：按钮(normal/pressed)、面板/卡片底板、进度条 track+fill。
- 备选：itch.io 上搜 "free UI kit"（注意 License）。

### 3. 宠物美术
- **已有** `assets/images/Animal Pack`（60 张，penguin/bear/frog…）——直接拿来替代代码画宠物（见 Phase 3）。

---

## 三、编辑器操作步骤（Phase 1：字体 + 按钮皮肤，30 分钟见效）

1. **导字体**：把 `SmileySans.ttf` 拖进 `assets/fonts/`。
2. **导皮肤图**：把按钮/面板/进度条 PNG 拖进 `assets/ui/skin/`。
   - 选中每张「需要拉伸的底图」（按钮、面板、track、fill），在 **Inspector → Sprite 的 Border（九宫格内边距）** 设上下左右留白（比如圆角 16px 的按钮，四边 Border 设 ~16-20），避免拉伸变形。
3. **挂 UISkin**：场景里选 `Canvas`（或挂 `Main` 脚本的那个节点）→ Add Component → 搜 `UISkin`。
4. **绑定**：把资源拖到 UISkin 的字段：
   - `Ui Font` ← SmileySans 字体
   - `Button Bg` ← 按钮底图的 **SpriteFrame**、`Button Pressed Bg` ← 按下态
   - `Panel Bg` ← 面板底图、`Bar Track` / `Bar Fill` ← 进度条两张
5. **运行**：所有按钮换皮 + 全 UI 换字体。✅

> 注意：拖的是 **SpriteFrame**（贴图展开后的子资源），不是贴图本身。

---

## 四、Phase 2/3/4（按需进阶，部分我可代写代码）

### Phase 2 · 面板换九宫格底图
当前各面板是 `Graphics` 画的圆角矩形。两种做法：
- **省事**：我提供一个 `makePanelBg(node, w, h)` 工具——若 `Theme.skin().panel` 存在就用九宫格 Sprite，否则回退 Graphics；我把各面板的底板创建替换成它。**这步我可以代写**（约 10 处面板），你只需绑好 `Panel Bg`。
- **彻底**：把面板做成 `.prefab`，编辑器里摆好（Phase 4）。

### Phase 3 · 宠物用 Animal Pack 贴图（视觉飞跃）
把 `PetRenderer`（代码画）换成贴图渲染：
- 做法 A（推荐，要编辑器）：把 `Animal Pack` 移到 `assets/resources/animals/`，我写一个 `SpritePetRenderer`，按 `petType` 用 `resources.load('animals/penguin/spriteFrame')` 加载。**代码我写，你只需把文件夹移到 resources 下并重新导入一次。**
- 做法 B：编辑器里把各动物 SpriteFrame 拖进一个 `PetSpriteAtlas` 组件的数组，我按下标取。
- 进化各阶段图：用你在后台「进化路线」给每个阶段配的 `image`（游戏端已支持远程加载），或用 Animal Pack 不同动物表示不同阶段。

### Phase 4 · 面板 prefab 化（工作量大，效果最好）
把高频面板（养成主页、商店、图鉴、对战）逐个做成 prefab，在编辑器里用九宫格皮肤摆位，代码只负责数据填充。建议**先 Phase 1+2+3 拿到 80% 效果**，prefab 化作为长期优化。

---

## 五、配色参考（已写进 Theme，可改）

| 名 | 值 | 用途 |
|---|---|---|
| primary | #5B8CFF | 主按钮/强调 |
| success | #2ECC71 | 喂食/确认 |
| warning | #FFB020 | 钻石/提醒 |
| danger | #FF6B6B | 删除/警告 |
| accent | #A55EEA | 进化/图鉴 |
| bg | #F4F6FB | 背景 |
| card | #FFFFFF | 卡片 |
| textPrimary | #2D3142 | 主文字 |

改色只改 `Theme.ts` 的 `PALETTE` 一处即可全局生效。

---

## 六、建议执行顺序

1. **Phase 1（字体 + 按钮皮肤）** —— 投入最小、提升最直观，先做。
2. 告诉我做 **Phase 2（面板换皮）/ Phase 3（宠物贴图）**，这两步代码我来写，你配合在编辑器绑定资源/移动 resources。
3. Phase 4 prefab 化作为长期。
