# DESIGN_SYSTEM.md

## Purpose

This frontend follows **OKX-inspired visual standards** for typography, color, density, spacing, and interaction patterns.

Our engineering goal is not only to make pages look like OKX, but to make that consistency **sustainable, scalable, and maintainable** as the project grows.

The core rule is:

> **OKX is the design reference.  
> Tailwind design tokens + CSS variables + UI components are the implementation system.**

We must avoid multiple parallel styling systems that drift over time.

---

## Core Principles

### 1. Single Source of Truth

All core visual decisions must come from a single design system pipeline:

- **`src/index.css`**
  - `@font-face`
  - theme CSS variables
  - minimal base/reset styles
- **`tailwind.config.js`**
  - maps CSS variables into semantic Tailwind tokens
- **`src/components/ui/*`**
  - reusable UI primitives
- **feature/page components**
  - compose UI primitives and layouts
  - do not redefine the visual system

Do **not** maintain multiple parallel naming systems for the same concept.

Bad examples:

- `--bg-primary`
- `okx.dark.bg`
- `.bg-primary-okx`
- hardcoded `bg-[#141414]`

for the same visual meaning.

There should be one canonical token path.

---

## Typography

### Font Strategy

The project follows **OKX's System Font Stack strategy**.

> **No external font CDN. Zero font loading latency. Optimal performance.**

Instead of downloading custom fonts, we leverage the operating system's native fonts. This approach:

- Eliminates font loading delays (0ms download time)
- Prevents layout shifts (FOUT/FOIT)
- Provides familiar, platform-optimized typography
- Supports all languages out of the box

### Font Stack

```css
font-family:
  /* Western System Fonts */
  -apple-system,          /* macOS/iOS: San Francisco */
  BlinkMacSystemFont,     /* Chrome on macOS */
  "Segoe UI",             /* Windows */
  Roboto,                 /* Android/Linux */
  Helvetica,
  Arial,
  /* Chinese System Fonts (CJK) */
  "PingFang SC",          /* Apple: 苹方 */
  "Hiragino Sans GB",     /* macOS: 冬青黑体 */
  "HarmonyOS Sans SC",    /* Huawei: 鸿蒙字体 */
  "Microsoft YaHei",      /* Windows: 微软雅黑 */
  "Source Han Sans SC",   /* Adobe: 思源黑体 */
  "Noto Sans SC",         /* Google: Noto (fallback) */
  /* Final Fallback */
  sans-serif;
```

### Rules

- **No external font imports** (removed CDN dependency)
- Use `font-sans` in all components
- No page-level `font-family` overrides

### Do

- Use `font-sans` everywhere
- Trust the system font stack

### Don't

- Import fonts from external CDNs
- Add `@font-face` declarations
- Override font-family in components

---

## Color System

### Design Intent

Colors must reflect the OKX-inspired product language:

- dark/light theme surfaces
- layered backgrounds
- high-contrast primary text
- muted secondary/tertiary text
- green for buy/success
- red for sell/danger

### Implementation Rule

Colors are defined in CSS variables first, then mapped into semantic Tailwind tokens.

### Canonical Token Groups

- `background`
- `foreground`
- `border`
- `success`
- `danger`

### Example Semantic Usage

Prefer:

- `bg-background`
- `bg-background-secondary`
- `bg-background-tertiary`
- `text-foreground`
- `text-foreground-secondary`
- `text-foreground-tertiary`
- `border-border`
- `text-success`
- `bg-success`
- `text-danger`
- `bg-danger`

Avoid overusing:

- `bg-[var(--bg-primary)]`
- `text-[var(--text-primary)]`
- `border-[var(--border-primary)]`

These are allowed only in exceptional cases.

---

## Theme System

### Rule

Theme values must live in CSS variables.

Typical location:

- `:root`
- `[data-theme='light']`
- optionally `[data-theme='dark']`

### Rule of Responsibility

- CSS variables define actual values
- Tailwind exposes semantic class names
- components consume semantic classes
- pages should not manually reconstruct theme behavior

### Do

- toggle themes using `data-theme`
- keep token names stable

### Don't

- redefine dark/light values inside component files
- duplicate the same theme values in multiple places

---

## Tailwind Usage Rules

### Preferred Order

1. semantic Tailwind utility classes
2. shared UI component variants
3. direct CSS variable syntax only when necessary

### Good

```tsx
<div className="bg-background-secondary text-foreground border border-border" />
```

### Acceptable Only When Necessary

```tsx
<Line stroke="var(--color-buy)" />
```

### Avoid

```tsx
<div className="bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-primary)]" />
```

when equivalent semantic token classes already exist.

### Why

Semantic classes:

- improve readability
- reduce drift
- make global refactors easier
- keep implementation consistent across the codebase

---

## UI Component Standards

### Button Standards

> **单一来源规矩（boss/K3 2026-09-19）**：按钮样式只准有一份定义，移动端复用桌面的同一组实测值，禁止分叉。改值 = 本节 + 下面全清单每一处同步，漏一处即分叉 bug（2026-09-19 已实测漏过两次：底部常驻条、桌面永续表单）。
> **用色规矩（boss 2026-09-19 11:32）**：红绿只准用于买/卖、多/空语义（含开/平）。**其余一切按钮/开关/控件一律主题黑白**：`bg-[var(--text-primary)] text-[var(--bg-primary)]`（亮=黑底白字，暗=白底黑字），hover `opacity-90`。Margin 开关、杠杆选择、Connect Wallet 都属此类。
> **引用组件全清单（枚举，别数错）**：
> 1. 桌面表单：`src/components/spot/SpotTradingForm.tsx`
> 2. 移动现货表单：`src/components/spot/MobileTradingForm.tsx`
> 3. 移动永续表单：`src/components/spot/MobilePerpTradingForm.tsx`
> 4. 现货页移动底部常驻条：`src/components/SpotTradingPage.tsx`（fixed bottom Buy/Sell）
> 5. 永续页移动底部常驻条：`src/components/PerpsTradingPage.tsx`（fixed bottom Open/Close）
> 6. 桌面永续表单：`src/components/spot/PerpsTradingForm.tsx`（2026-09-19 11:35 补漏登记——它被 PerpsTradingPage:157 真实渲染但第一批漏改，同日已对齐；教训再次验证：登记前先 grep 渲染链，不只 grep 已改文件）
> （`src/components/trade/TradingFormPanel.tsx` 为死代码不在清单内；新增任何带交易按钮的组件时必须同步登记到本清单。）

#### 交易胶囊（买/卖、开/平 tab）— 28px / 12px / 500 / 4px

```tsx
<button className="h-7 px-3 text-xs font-medium rounded transition-colors bg-[#25A750] text-white">Buy</button>
<button className="h-7 px-3 text-xs font-medium rounded transition-colors bg-[#CA3F64] text-white">Sell</button>
```

**Properties:** 高 `h-7`(28px)；字 `text-xs`(12px) `font-medium`(500)；圆角 `rounded`(4px)；激活绿 `#25A750` / 激活红 `#CA3F64`（OKX 桌面红，**不是**币安红 #F6465D）；非激活 = `text-[var(--text-secondary)]`。

#### 主 CTA（买入/做多/平仓）— 40px / 14px / 400 / 全胶囊

Connect Wallet 不在此列：属非买卖语义，用黑白 CTA（见下方"黑白 CTA"）。

```tsx
<button className="w-full h-10 rounded-full text-sm font-normal bg-[#25A750] text-white hover:bg-[#25A750]/90 transition-colors">
  Buy
</button>
<button className="w-full h-10 rounded-full text-sm font-normal bg-[#CA3F64] text-white hover:bg-[#CA3F64]/90 transition-colors">
  Sell
</button>
```

**Properties:** 高 `h-10`(40px)；字 `text-sm`(14px) `font-normal`(400)；`rounded-full`；hover = 90% 不透明度。

#### 黑白 CTA（Connect Wallet 及一切非买卖语义按钮）— 40px / 14px / 400 / 全胶囊

```tsx
<button className="w-full h-10 rounded-full text-sm font-normal bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity">
  Connect Wallet
</button>
```

**Properties:** 形状同主 CTA；颜色 = 主题反转（boss 2026-09-19 11:32 用色规矩）；hover `opacity-90 transition-opacity`。引用处：SpotTradingForm / MobileTradingForm / MobilePerpTradingForm / PerpsTradingForm 的 Connect Wallet；Header 顶栏同款语义。

#### 订单类型 tab（限价/市价/TP-SL）— 35px / 12px / 500 / 透明底

```tsx
<button className="h-[35px] text-xs font-medium text-[var(--text-primary)]">Limit</button>
```

#### 其他工具按钮（Calculate 等次级）

```tsx
<button className="px-4 py-3 rounded-full text-sm font-semibold bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity">
  Calculate
</button>
```

#### Secondary Button (Outline)

```tsx
<button className="px-4 py-2 rounded-md border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
  Cancel
</button>
```

**Properties:**
- Border: `border border-[var(--border-primary)]`
- Text: `text-[var(--text-primary)]`
- Background: transparent (default)
- Border radius: `rounded-md`
- Hover: `hover:bg-[var(--bg-tertiary)] transition-colors`

#### Tab/Toggle Button

```tsx
<button className="py-2 text-sm font-semibold rounded-md transition-colors bg-[var(--text-primary)] text-[var(--bg-primary)]">
  Active
</button>
<button className="py-2 text-sm font-semibold rounded-md transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
  Inactive
</button>
```

**Properties:**
- Active: `bg-[var(--text-primary)] text-[var(--bg-primary)]`
- Inactive: `text-[var(--text-secondary)] hover:text-[var(--text-primary)]`
- Border radius: `rounded-md`
- Always include `transition-colors`

### Input Standards

#### Number Input (Price, Amount)

```tsx
<div className="relative">
  <input
    type="number"
    className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-all pr-16"
    placeholder="0.00"
  />
  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">
    USDT
  </span>
</div>
```

**Properties:**
- Background: `bg-[var(--bg-tertiary)]`
- Border: `border border-[var(--border-primary)]` (always visible)
- Text: `text-[var(--text-primary)]`
- Border radius: `rounded-md` (6px)
- Padding: `px-3 py-2.5`
- Font size: `text-sm`
- Focus: `focus:border-[var(--text-primary)]`
- Transition: `transition-all`

#### Select/Dropdown Button

```tsx
<button className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] flex items-center justify-between hover:bg-[var(--bg-quaternary)] transition-colors">
  <span>Isolated</span>
  <svg className="w-4 h-4 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
</button>
```

---

## Interaction Standards

### Hover Effects

All interactive elements must have consistent hover states:

| Element | Hover Effect | Implementation |
|---------|--------------|----------------|
| Primary Button | Opacity dim | `hover:opacity-90 transition-opacity` |
| Secondary Button | Background change | `hover:bg-[var(--bg-tertiary)] transition-colors` |
| Tab/Nav Item | Text color change | `hover:text-[var(--text-primary)] transition-colors` |
| Input Field | Border highlight | `focus:border-[var(--text-primary)] transition-all` |
| Icon Button | Background fill | `hover:bg-[var(--bg-tertiary)] rounded-md` |
| Link/Anchor | Text color + underline | `hover:underline hover:text-[var(--text-primary)]` |

### Transition Standards

Always include transition for interactive elements:

```tsx
// For opacity changes
transition-opacity

// For color changes
transition-colors

// For all properties
transition-all

// Duration (default 150ms)
duration-200  // for subtle effects
duration-300  // for more noticeable effects
```

### Focus States

All inputs and buttons must have visible focus states:

```tsx
// Input focus
focus:outline-none focus:border-[var(--text-primary)]

// Button focus (optional ring)
focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)] focus:ring-offset-2
```

---

## UI Component Layer

### Required Shared Primitives

All common UI patterns should be implemented in `src/components/ui/*`.

Expected primitives include:

- Button
- Input
- Card
- Modal
- Tabs

Additional primitives may include:

- Badge
- DropdownMenu
- Tooltip
- Select
- Table
- Skeleton

### Rules

- feature pages should use shared primitives by default
- visual variants belong in the primitive, not duplicated in pages
- if a new repeated pattern appears twice or more, consider promoting it into `ui/`

### Good

- add a `buy` variant to Button
- add a `compact` variant to Card

### Bad

- manually rebuild the same button styles in 4 pages
- manually rebuild card shell styles in every feature module

---

## Page and Feature Responsibilities

### Pages/Features Should Do

- compose layouts
- connect data/state
- wire interactions
- assemble feature-specific sections

### Pages/Features Should Not Do

- redefine typography scale
- redefine base spacing rules
- redefine button/input/card styling
- hardcode repeated colors or radii
- introduce new token naming systems

### Allowed Exceptions

Direct CSS variables are acceptable in these cases:

#### 1. Third-Party Library Configuration

Examples:

- recharts
- canvas/chart config
- inline SVG styles
- dynamic runtime styles

Example:

```tsx
<Line stroke="var(--color-buy)" />
```

#### 2. Global Browser Styling

Examples:

- scrollbar
- selection
- focus ring defaults
- base body/html rules

#### 3. Truly Dynamic Runtime Values

When Tailwind static class generation is not appropriate.

These should remain exceptions, not the default style authoring pattern.

---

## Spacing, Radius, Density

### Rule

Spacing, border radius, font size, and transition timing should come from Tailwind theme tokens, not arbitrary one-off values.

### Prefer

- `rounded-lg`
- `rounded-xl`
- `text-sm`
- `text-base`
- `gap-2`
- `gap-4`
- `p-4`
- `duration-200`

### Avoid

repeated arbitrary values unless genuinely necessary:

- `rounded-[11px]`
- `p-[13px]`
- `text-[15px]`

Use arbitrary values only when there is a strong design reason and no token should exist.

---

## Accessibility Requirements

Because OKX-style UI tends to be dense and interaction-heavy, accessibility must be enforced at the design-system level.

### Required

- visible keyboard focus
- correct semantic roles
- `aria-*` where appropriate
- accessible modal behavior
- accessible dropdown behavior
- accessible tabs behavior
- contrast-safe text/surface combinations

### Rule

Accessibility must be built into shared components, not repeatedly patched in pages.

---

## Migration Policy

### For Existing Legacy Code

Legacy styles may exist temporarily, but must be treated as transitional.

### Migration Priorities

- replace duplicated old classes with semantic Tailwind classes
- replace repeated shells with shared UI primitives
- remove deprecated legacy utilities after migration is complete

### Deprecated Patterns

Examples of patterns we should phase out:

- `*-okx` utility naming
- duplicated `.btn-*` systems outside shared components
- page-local formatting helpers duplicated across files
- repeated `bg-[var(--...)]` `text-[var(--...)]` bundles

---

## PR Review Checklist

Before merging, reviewers should check:

- Does this add a new visual pattern that should be a shared component?
- Does this duplicate an existing token or variant?
- Does this use semantic Tailwind classes where possible?
- Does this bypass the design system without a good reason?
- Does this introduce hardcoded colors, fonts, or spacing?
- Does it preserve OKX-aligned visual consistency?
- Does it keep theme behavior centralized?
- Does it maintain keyboard and screen-reader accessibility?

---

## Decision Rules

When choosing between options, follow this order:

1. Match OKX visual intent
2. Keep one implementation path
3. Prefer semantic tokens over raw values
4. Prefer shared primitives over page-local styling
5. Prefer maintainability over short-term convenience

---

## Form Input Standards

### Number Input Validation

All numeric input fields (price, amount, leverage, etc.) **must** implement the following validation to prevent invalid user input:

#### Rule 1: No Negative Numbers

Numeric inputs for financial values should never allow negative numbers.

**Implementation Pattern:**

```tsx
const handleAmountChange = (value: string) => {
  // 禁止输入负数
  if (value.startsWith('-')) return;
  setAmount(value);
  // ... rest of the logic
};
```

**Applies to:**
- Price inputs (entry price, exit price)
- Amount inputs (position size, filled amount)
- Leverage inputs
- Margin inputs
- PnL target inputs

#### Rule 2: Consistent Input Styling

All number inputs must use consistent styling:

```tsx
<input
  type="number"
  className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-all"
/>
```

**Key Properties:**
- Background: `bg-[var(--bg-tertiary)]`
- Border: `border border-[var(--border-primary)]` (always visible)
- Focus state: `focus:border-[var(--text-primary)]`
- Border radius: `rounded-md` (6px)
- Padding: `px-3 py-2.5`
- Font size: `text-sm`

#### Rule 3: Reusable Handler Function

For components with multiple numeric inputs, create a reusable handler:

```tsx
const handleNumberInput = (value: string, setter: (val: string) => void) => {
  if (value.startsWith('-')) return;
  setter(value);
};

// Usage
<input
  onChange={(e) => handleNumberInput(e.target.value, setPrice)}
/>
```

### Why This Matters

- **Data Integrity**: Negative values don't make sense for prices, amounts, or leverage
- **UX Consistency**: Users get the same input behavior across all forms
- **Bug Prevention**: Prevents calculation errors from invalid negative inputs
- **Design Cohesion**: Maintains visual consistency across modals and forms

---

## Slider Standards

### OKX-Style Slider（2026-09-19 全量重做版，实测规格）

> 单一来源规矩同样适用于滑动条：四个表单（SpotTradingForm / MobileTradingForm / MobilePerpTradingForm / PerpsTradingForm）共用同一实现；改值四处同步并登记。

#### 实测规格（OKX 现网，K3 无头直读 2026-09-19）

- **轨道**：2px 高（`h-[2px]`）、圆角 3px；亮色 `rgba(0,0,0,0.1)` 级浅灰、暗色 `rgba(255,255,255,0.13)`
- **已填充段**：主题主色（亮=黑/暗=白，即 `var(--text-primary)`）——**黑白**，符合用色规矩
- **节点圆点**：8×8（`w-2 h-2`）空心圆：白底 + 灰描边（`bg-white border-[var(--border-active)]`）；被越过的节点变实心主色；**可点击 = 精确跳到该档**
- **拖拽手柄**：空心圆：`w-[9px] h-[9px]`（OKX 实测 9×9）、白底 + 1px 细主色描边；拖拽时最多放大到 11px；**禁止 transition 动画**——位置必须跟手零延迟（boss 11:46：滞后=transition 所致，已移除）
- **Tooltip**：拖拽时手柄上方深色气泡实时显示百分比，`translateX(-50%)` 居中
- **交互**：点轨道任意位置直接跳到该值；标签行 0%/25%/50%/75%/100% 可点击
- **布局**：轨道容器 `mx-2`（给手柄溢出留位）；input range 用负 inset 扩大触摸区（`-inset-x-2 -inset-y-2.5 h-6 opacity-0`）盖在轨道上；节点层在 input 之上（DOM 后置）实现精确跳档

#### Why（boss 11:27 投诉的根因）

旧版手柄（8px 实心）与节点（6px）视觉上几乎相同，用户分不清哪个可拖；轨道 4px 过厚不符合 OKX。新版手柄约为节点 3 倍大且空心，拖拽点一眼可辨。

#### Boundary Handling

1. 轨道容器 `mx-2` 留出手柄溢出空间
2. 位置公式 `calc(${sliderValue}% * 0.96 + 2%)` 让 0%/100% 时手柄中心对齐首尾节点
3. 手柄用 `-translate-x-1/2 -translate-y-1/2` 自动居中（不手写像素偏移）
4. input 触摸区负 inset 扩大，比视觉轨道更宽

---

## Short Version

- Follow OKX visually
- **Use system font stack (no external fonts)**
- Keep colors/tokens centralized
- Use Tailwind semantic tokens
- Build shared UI primitives
- Avoid dual-track styling systems
- **Form inputs: no negatives, consistent styling**
- Optimize for long-term consistency

---

## Project Standard

We do not want a codebase that merely "looks like OKX today".

We want a **design system** that can continue to look like OKX correctly as the product grows.

---

## 组件规范增补（2026-10-08，boss UI 一致性专项）

### 双色族（刻意设计，勿"统一"）
- **K线/涨跌语义**：`var(--color-buy)` #0ECB81 / `var(--color-sell)` #F6465D —— 蜡烛、涨跌百分比、多空标识；
- **CTA 按钮激活态**：#25A750（Buy/Open）/ #CA3F64（Sell/Close）—— 与币安红绿**刻意不同**，两者不可互换。

### 下拉面板（TradingPairDropdown 定型）
- 圆角 `rounded-md`(6px)；阴影 ≤ `0 8px 20px -6px rgba(0,0,0,0.22)`；锚点**紧贴**触发器（零缝隙）；
- hover 展开（asterdex 式），点击兜底；DOM 必须为触发器子节点（mouseleave 不误关）。

### 页签（全站唯一风格）
- 下划线式：`relative py-2`，选中 `font-medium` + 底部 `h-0.5` 横线（**文字宽度**，按钮无水平内边距），非选中 `text-tertiary` hover 提亮；
- 禁用 pill 背景块页签（2026-10-06 起废止）。

### 列表行
- **无常驻选中底色**（含当前行）；hover 高亮 `bg-[var(--bg-primary)]`（此色为 hover 专用，禁作常驻底）；
- 行内未知数据一律 "—" 占位，禁编造。

### 数据面板圆角
- 高密度数据面板（表格/图表/下拉）= `rounded-md`(6px) 上限；`rounded-xl`(12px) 仅营销/hero 卡片。
