# YouNeon Neon Theme Documentation

## Complete Color System Transformation

YouNeon has been completely transformed to match the neon logo with bright, glowing neon purple (cyan) and hot pink colors throughout the entire app.

### Core Neon Colors

- **Main Neon: Bright Cyan (Neon Purple)**
  - Text: `text-cyan-300`, `text-cyan-100`
  - Borders: `border-cyan-500/30`, `border-cyan-400/40`
  - Glows: `shadow-cyan-500/30`, `shadow-cyan-500/40`, `shadow-cyan-500/50`
  - Background overlays: `bg-cyan-500/5`, `bg-cyan-500/10`, `bg-cyan-500/20`

- **Accent: Hot Pink / Neon Magenta**
  - Text: `text-pink-300`, `text-pink-400`
  - Borders: `border-pink-500/30`, `border-pink-400/40`
  - Glows: `shadow-pink-500/20`, `shadow-pink-500/30`
  - Background overlays: `bg-pink-500/10`, `bg-pink-500/20`

- **Background: Dark Purple-Black Gradient**
  - Main: `bg-neon-dark` (slate-950 → purple-950 → slate-950)
  - Alternative: `bg-neon-dark-alt` (purple-950 → slate-950 → purple-950)
  - Cards: `bg-slate-900/50`, `bg-slate-900/60`, `bg-slate-950/40`

### Neon CSS Utility Classes

Added custom Tailwind classes in `globals.css`:

\`\`\`css
.neon-glow - Basic cyan glow shadow
.neon-glow-strong - Stronger cyan glow shadow
.neon-gradient-text - Cyan to pink gradient text
.neon-gradient-bg - Cyan to pink gradient background
.neon-button - Full neon button style with gradient and glow
.neon-button-outline - Neon outlined button style
.bg-neon-dark - Dark background gradient
.bg-neon-dark-alt - Alternative dark background gradient
\`\`\`

## Updated Screens & Components

### 1. Bottom Navigation (`bottom-nav.tsx`)
- **Active tabs**: Cyan-pink gradient with strong cyan glow
- **Hover state**: Scale up with glow effect
- **Border**: Cyan-500/30 with glow
- **Inactive tabs**: Text-cyan-300/80

### 2. Discover Home Screen (`discover-screen.tsx`)
- **Background**: `bg-neon-dark` gradient
- **Logo text**: `neon-gradient-text` (cyan → pink)
- **Main button**: `neon-button` class
- **Cards**: Slate-900/40 with cyan borders and hover glows
- **Features grid**: Hover effects with shadow glows

### 3. Profile Setup Onboarding (`profile-onboarding.tsx`)
- **Header**: Cyan gradient with glowing progress bar
- **Progress bar**: Neon gradient with cyan glow
- **Input fields**: Cyan borders with focus glow effects
- **Selection buttons**: Neon gradient when active
- **Tags**: Cyan-pink gradient with subtle glows
- **Submit button**: Full `neon-button` with glow on save

### 4. Profile Screen (`profile-screen.tsx`)
- **Header**: Cyan background gradient with glow
- **Avatar**: Neon gradient background with cyan shadow glow
- **Tags**: Cyan-pink gradient with glowing borders
- **Stats**: Neon gradient text with hover shadow effects
- **Buttons**: Cyan/pink borders with hover glows

### 5. Messages Screen (`messages-screen.tsx`)
- **Background**: `bg-neon-dark`
- **Text**: Neon gradient title
- **Icon**: Cyan-400/50 color

### 6. Matching Loading Screen (`matching-loading-screen.tsx`)
- **Background**: `bg-neon-dark` with animated cyan/pink orbs
- **Rings**: Cyan and pink neon borders with spin animation
- **Progress bar**: Full neon gradient with cyan glow
- **Cancel button**: Pink-based with pink glow effect

### 7. Page Loading State (`page.tsx`)
- **Spinner**: Cyan border with cyan-400 top border
- **Text**: Cyan-300 color
- **Shadow**: Cyan glow effect

## Styling Patterns

### Button Styles

**Primary Neon Button:**
\`\`\`html
<button className="neon-button">
  Text
</button>
\`\`\`

**Outlined Neon Button:**
\`\`\`html
<button className="neon-button-outline">
  Text
</button>
\`\`\`

### Card/Container Styles

**Standard Card:**
\`\`\`html
<div className="bg-slate-900/60 border border-cyan-500/30 rounded-xl p-4 shadow-lg shadow-cyan-500/10">
  Content
</div>
\`\`\`

**Interactive Card:**
\`\`\`html
<div className="hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20 transition">
  Content
</div>
\`\`\`

### Text Styles

**Neon Title:**
\`\`\`html
<h1 className="neon-gradient-text">YouNeon</h1>
\`\`\`

**Cyan Text:**
\`\`\`html
<p className="text-cyan-300">Text</p>
\`\`\`

## Implementation Notes

1. **Consistency**: All screens use `bg-neon-dark` for main background
2. **Borders**: Always cyan-500/30 with hover to cyan-400/50
3. **Glows**: Shadow glows scale from /10 to /50 opacity
4. **Active States**: Neon gradient with strong glows
5. **Transitions**: All interactive elements have smooth transitions
6. **Mobile**: Design is fully mobile-first with proper padding

## Color Reference

| Element | Color | Class |
|---------|-------|-------|
| Main Text | Cyan | text-cyan-300 |
| Bright Text | Cyan | text-cyan-100 |
| Muted Text | Cyan | text-cyan-300/70 |
| Primary Accent | Cyan | cyan-500, cyan-400 |
| Secondary Accent | Pink | pink-500, pink-400 |
| Borders | Cyan | border-cyan-500/30 |
| Glows | Cyan | shadow-cyan-500/30 |
| Background | Dark | bg-slate-950, bg-purple-950 |

## Testing Recommendations

1. Test all interactive elements for proper glow effects
2. Verify color contrast meets accessibility standards
3. Check mobile responsiveness with neon glows
4. Test hover and active states on all buttons
5. Verify gradient transitions are smooth
