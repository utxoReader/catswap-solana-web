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

#### Primary Button (CTA)

```tsx
<button className="px-4 py-3 rounded-full text-sm font-semibold bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity">
  Calculate
</button>
```

**Properties:**
- Background: `bg-[var(--text-primary)]` (inverted for high contrast)
- Text: `text-[var(--bg-primary)]`
- Border radius: `rounded-full` (pill shape for primary actions)
- Font weight: `font-semibold`
- Hover: `hover:opacity-90 transition-opacity`

#### Action Buttons (Long/Short)

```tsx
// Long/Buy - Green
<button className="py-3 rounded-full text-sm font-semibold bg-[#0ECB81] text-white hover:opacity-90 transition-opacity">
  Long
</button>

// Short/Sell - Red  
<button className="py-3 rounded-full text-sm font-semibold bg-[#F6465D] text-white hover:opacity-90 transition-opacity">
  Short
</button>
```

**Properties:**
- Long/Buy: `bg-[#0ECB81] text-white`
- Short/Sell: `bg-[#F6465D] text-white`
- Border radius: `rounded-full`
- Hover: `hover:opacity-90 transition-opacity`

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

### OKX-Style Slider

The slider component follows OKX's design with hollow circle marks and a dynamic thumb.

#### Visual Design

```tsx
<div className="py-1">
  {/* mx-1.5 adds horizontal margin to contain the thumb */}
  <div className="relative h-1 bg-[var(--bg-quaternary)] rounded-full mx-1.5">
    {/* Progress bar - scaled to stay within bounds */}
    <div
      className="absolute h-full rounded-full bg-[var(--text-primary)]"
      style={{ 
        width: `calc(${sliderValue}% * 0.97 + 1.5%)`,
        left: '0%'
      }}
    />
    
    {/* Custom Thumb - Smaller size (w-2 default, w-3 on hover) */}
    <div
      className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-[var(--bg-secondary)] border-2 border-[var(--text-primary)] pointer-events-none transition-all duration-100 ${
        showSliderTooltip ? 'w-3 h-3' : 'w-2 h-2'
      }`}
      style={{ 
        left: `calc(${sliderValue}% * 0.97 + 1.5% - ${showSliderTooltip ? 6 : 4}px)` 
      }}
    />
    
    {/* Input - expanded touch area, positioned to match visual */}
    <input
      type="range"
      min="0"
      max="100"
      value={sliderValue}
      onChange={(e) => handleSliderChange(parseInt(e.target.value))}
      onMouseDown={() => setShowSliderTooltip(true)}
      onMouseUp={() => setShowSliderTooltip(false)}
      onMouseEnter={() => setShowSliderTooltip(true)}
      onMouseLeave={() => setShowSliderTooltip(false)}
      onTouchStart={() => setShowSliderTooltip(true)}
      onTouchEnd={() => setShowSliderTooltip(false)}
      className="absolute -inset-x-1.5 -inset-y-2 w-[calc(100%+12px)] h-5 opacity-0 cursor-pointer"
    />
    
    {/* Percentage Tooltip */}
    {showSliderTooltip && (
      <div
        className="absolute -top-9 px-2 py-1 bg-[var(--bg-tooltip)] text-white text-xs font-medium rounded pointer-events-none"
        style={{ left: `calc(${sliderValue}% * 0.97 + 1.5% - 16px)` }}
      >
        {Math.round(sliderValue)}%
      </div>
    )}
    
    {/* Slider marks - Smaller size (w-1.5) */}
    <div className="absolute inset-x-0 flex justify-between items-center pointer-events-none">
      {[0, 25, 50, 75, 100].map((pct) => (
        <div
          key={pct}
          className={`w-1.5 h-1.5 rounded-full border transition-colors ${
            sliderValue >= pct 
              ? 'bg-[var(--text-primary)] border-[var(--text-primary)]' 
              : 'bg-[var(--bg-secondary)] border-[var(--bg-quaternary)]'
          }`}
        />
      ))}
    </div>
  </div>
  
  {/* Labels */}
  <div className="flex justify-between mt-2">
    {['0%', '25%', '50%', '75%', '100%'].map((label, idx) => (
      <button
        key={label}
        onClick={() => handleSliderChange(idx * 25)}
        className={`text-[10px] transition-colors ${
          sliderValue >= idx * 25 ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
        }`}
      >
        {label}
      </button>
    ))}
  </div>
</div>
```

#### Key Design Elements

| Element | Default State | Active/Drag State |
|---------|---------------|-------------------|
| **Track Background** | `bg-[var(--bg-quaternary)]` | - |
| **Progress Bar** | `bg-[var(--text-primary)]` | - |
| **Thumb** | `w-2 h-2` white circle, black border | `w-3 h-3` slightly larger |
| **Mark (unfilled)** | Hollow circle: white bg, gray border | - |
| **Mark (filled)** | Solid black circle | - |
| **Tooltip** | Hidden | Shows percentage above thumb |

#### Boundary Handling

To prevent the thumb from overflowing the track:

1. **Add horizontal margin**: `mx-1.5` on the track container
2. **Scale the progress bar**: Use `width: calc(${sliderValue}% * 0.97 + 1.5%)` instead of raw percentage
3. **Adjust thumb position**: Position formula accounts for the scaling
4. **Expand input touch area**: Use negative inset to make input wider than visual track

#### Behavior

1. **Thumb is always visible** - Unlike native sliders, the thumb is always shown
2. **Thumb grows on interaction** - Mouse down/hover increases thumb size (w-2 → w-3)
3. **Smaller thumb size** - Default `w-2 h-2` (8px) for cleaner look
4. **Marks are hollow circles** - Unfilled marks have white center + gray border
5. **Filled marks turn solid** - When slider passes a mark, it becomes solid black
6. **Percentage tooltip** - Shows current value above thumb during interaction
7. **Clickable labels** - 0%, 25%, 50%, 75%, 100% labels jump to those positions
8. **No overflow** - Thumb stays within track bounds at 0% and 100%

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
