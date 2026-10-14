---
name: Antigravity Mission Control
colors:
  surface: '#031427'
  surface-dim: '#031427'
  surface-bright: '#2a3a4f'
  surface-container-lowest: '#000f21'
  surface-container-low: '#0b1c30'
  surface-container: '#102034'
  surface-container-high: '#1b2b3f'
  surface-container-highest: '#26364a'
  on-surface: '#d3e4fe'
  on-surface-variant: '#bbc9cd'
  inverse-surface: '#d3e4fe'
  inverse-on-surface: '#213145'
  outline: '#859397'
  outline-variant: '#3c494c'
  surface-tint: '#2fd9f4'
  primary: '#8aebff'
  on-primary: '#00363e'
  primary-container: '#22d3ee'
  on-primary-container: '#005763'
  inverse-primary: '#006877'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#ffd6a7'
  on-tertiary: '#472a00'
  tertiary-container: '#ffb147'
  on-tertiary-container: '#704500'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#a2eeff'
  primary-fixed-dim: '#2fd9f4'
  on-primary-fixed: '#001f25'
  on-primary-fixed-variant: '#004e5a'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#031427'
  on-background: '#d3e4fe'
  surface-variant: '#26364a'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-code-lg:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
  label-code-md:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
  label-code-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  label-status:
    fontFamily: JetBrains Mono
    fontSize: 9px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-desktop: 1rem
  margin: 1rem
  margin-desktop: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system drives an orbital-grade operational cockpit designed for high-throughput autonomous agent orchestration. The visual language balances severe technical utility with sensory precision: deep void surfaces, hard-edged instrument lines, and phosphorescent telemetry indicators. 

Engineered specifically to solve high-stress cognitive overload and ADHD executive fragmentation, the aesthetic avoids ambient noise in favor of instantaneous optical triage. The system achieves a **2-second glance threshold**—every critical operational state (agent health, blockades, execution streams, model routing) resolves immediately through structured contrast hierarchy, spatial rhythm, and photonic status accents. 

The aesthetic merges aerospace mission-critical interfaces with modern developer ergonomics: ultra-dark baseline surfaces, laser-thin structural dividers, muted synthetic purples signifying synthetic intelligence, and piercing electric cyan for active operator interventions.

## Colors

The palette establishes an absolute luminance floor to reduce retinal exhaustion while maximizing the dynamic punch of vital telemetry markers.

### Core Architecture
- **Deep Space Base (`#0B0F17`)**: The primary viewport void. Zero glare, pure absorbency.
- **Surface Elevation 1 (`#121826`)**: Operational panels, sidebars, and structural modules.
- **Surface Elevation 2 (`#1A2234`)**: Hover states, interactive cards, and active cell groupings.
- **Structural Lineage (`#1F2A3D`)**: 1px structural hairpins and divider rules defining spatial sectors.

### Chromatic Telemetry
- **Primary / Operator Cyan (`#22D3EE`)**: Manual overrides, active targets, interactive links, primary action triggers. Glow vector: `rgba(34, 211, 238, 0.25)`.
- **Secondary / Agent Violet (`#8B5CF6`)**: Synthetic cognition traces, autonomous execution pipelines, LLM inference badges, neural memory buffers. Glow vector: `rgba(139, 92, 246, 0.25)`.
- **Warning Amber (`#F59E0B`)**: Rate limits, degraded throughput, attention pending operator confirmation.
- **Critical Red (`#EF4444`)**: Breached thresholds, killed threads, agent blocked, subsystem failure. Glow vector: `rgba(239, 68, 68, 0.3)`.
- **Nominal Green (`#22C55E`)**: Stable runtime, continuous loop, zero drift. Glow vector: `rgba(34, 197, 94, 0.25)`.
- **Off/Inactive Slate (`#64748B`)**: Deprecated runs, severed connections, structural metadata, unselected controls.

## Typography

Typography establishes an absolute separation of cognitive concerns:
- **Inter** commands structural UI, interface hierarchy, system operations, and natural language communication.
- **JetBrains Mono** locks down raw telemetry: memory addresses, microsecond timestamps, ports, agent run hashes, system states, and stdout/stderr execution feeds.

### Typographic Rules
- Always render status flags, tokens, run IDs, and hardware telemetry in uppercase JetBrains Mono with elevated letter spacing (`label-status` or `label-code-sm`).
- Tabular figures (`font-variant-numeric: tabular-nums`) must be activated for all real-time counters, metrics, and terminal latency monitors to prevent layout jitter during data streaming.
- Body text remains dense (12px–14px) with controlled line-heights to support simultaneous multi-pane agent supervision without vertical scrolling fatigue.

## Layout & Spacing

The layout model is an anchored multi-panel dashboard architecture engineered for dense, real-time command surfaces. 

### Grid & Layout Strategy
- **Command Layout**: Fixed or collapsible operator docks (240px–300px), a variable-width agent canvas or node graph, and a persistent right-rail diagnostic monitor (320px–400px).
- **Sub-Grid Rhythm**: 12-column sub-grids inside module views using tight `0.75rem` (12px) gutters to preserve maximal visual information density per square inch.
- **Compact Scannability**: Element gaps favor `space-xs` (4px) and `space-sm` (8px) within functional clusters to keep dependent indicators visually grouped into singular cognitive units.
- **Viewport Constraints**: High-density desktop viewport first. Mobile views collapse side rails into off-canvas sliding sheets, transforming node canvases into chronological list streams while preserving tabular monospace telemetry.

## Elevation & Depth

Depth is established strictly through planar luminance offsets and razor-sharp borders rather than heavy ambient blur shadows.

### Elevation Levels
- **Floor Zero (`#0B0F17`)**: The root application backdrop.
- **Tier 1 Instrument Panels (`#121826`)**: Encapsulated by a crisp `1px solid #1F2A3D` boundary. Zero drop-shadow. Provides structural boundaries for charts, execution lists, and logs.
- **Tier 2 Active Modules & Hover Overlays (`#1A2234`)**: Applied to hovered rows, draggable nodes, or active card states. Outlined with `1px solid #2B3A54`.
- **Tier 3 Overlays & Modals (`#121826` with 80% opacity)**: Paired with `backdrop-filter: blur(12px)` and bordered by `1px solid rgba(34, 211, 238, 0.2)` to convey elevated focus over live agent graphs.

### Optical Photonic Signatures (Glows)
Shadows are reserved for active status signals to enable immediate peripheral recognition:
- **Active Agent**: `0 0 12px -2px rgba(139, 92, 246, 0.4)`
- **Nominal Loop**: `0 0 10px -2px rgba(34, 197, 94, 0.4)`
- **System Breach / Block**: `0 0 14px -1px rgba(239, 68, 68, 0.5)`
- **Operator Selection**: `0 0 12px -2px rgba(34, 211, 238, 0.4)`

## Shapes

The design system standardizes on a structural 12px (`0.75rem`) border radius for all primary panels, metric cards, dialog surfaces, and overlay windows. 

### Geometric Hierarchy
- **Panels & Modules**: `12px` radius creates a unified console feel without looking childish or overly bulbous.
- **Interactive Controls (Inputs, Selectors, Action Buttons)**: Scaled down to `6px`–`8px` to maintain surgical instrument precision.
- **Telemetry Pills & Status Tokens**: Full pill radius (`9999px`) to immediately distinguish ephemeral runtime metrics from static structural containers.
- **Live Status Dots**: Perfect circles (`50%` radius), 6px or 8px diameter, seated adjacent to monospace text keys.

## Components

### Buttons
- **Primary Action (Operator Directive)**: Solid `#22D3EE` background, `#0B0F17` ultra-bold Inter text, 6px border-radius, hover brightness increase with an active electric cyan peripheral glow (`0 0 12px rgba(34, 211, 238, 0.4)`).
- **Secondary Action (Agent / Neural Trigger)**: Background `#8B5CF6` at 15% opacity, `1px solid #8B5CF6`, text `#8B5CF6`. On hover: solid `#8B5CF6` with white text and violet aura.
- **Tertiary / Utility**: Ghost appearance with background `transparent`, `1px solid #1F2A3D`, text `#64748B`. On hover: border `#64748B`, text `#F8FAFC`.
- **Destructive (Kill / Terminate)**: Background `rgba(239, 68, 68, 0.1)`, `1px solid #EF4444`, text `#EF4444`. On hover: solid `#EF4444`, text `#FFFFFF`, glow `0 0 12px rgba(239, 68, 68, 0.5)`.

### Status Dots & Telemetry Pills
- **Pulsing Status Dots**: 6px diameter with a pseudo-element animation ring for dynamic states. Solid green (`#22C55E`) for idle/nominal loops; solid violet (`#8B5CF6`) with a radiating ping for active LLM generation; solid red (`#EF4444`) with high-frequency strobe for blocked execution.
- **Telemetry Pills**: Fully rounded pill shapes (`9999px`), padding `2px 8px`, using `label-status` typography. Built with a translucent dark base (15% tint of state color), matching `1px` border, and high-saturation text (e.g., `#22D3EE` text over `rgba(34, 211, 238, 0.1)`).

### Input Fields & Terminal Consoles
- **Inputs**: Height 36px, background `#0B0F17`, border `1px solid #1F2A3D`, radius 6px, text `#F8FAFC`. Focus state: border `#22D3EE` accompanied by a micro inner shadow and cyan glow ring.
- **Terminal Execution Feed**: Background `#0B0F17`, `1px solid #1F2A3D`, 12px radius. Content formatted in JetBrains Mono (`label-code-md`) with muted gray metadata timestamps (`#64748B`) and syntax-highlighted agent payloads (Agent IDs in `#8B5CF6`, payload keys in `#22D3EE`).

### Cards & Panels
- Background `#121826`, border `1px solid #1F2A3D`, corner radius `12px`.
- Panel headers feature a fixed 40px height, inner border-bottom `1px solid #1F2A3D`, uppercase status indicator on the far right, and compact `headline-sm` labeling on the left.

### Data Grids & Agent Lists
- Row height: 38px for ultra-dense data scanning.
- Borderless cell edges internally; subtle bottom separator `1px solid #1F2A3D`.
- Hover row state shifts to `#1A2234` with an active 2px left border accent in `#22D3EE` (manual select) or `#8B5CF6` (agent trace).
- Agent IDs, memory addresses, and ping rates always format strictly in `label-code-md`.

### Checkboxes & Switches
- **Checkboxes**: 16x16px square, radius 4px, border `1px solid #1F2A3D`, background `#0B0F17`. Checked: solid `#22D3EE` fill with a `#0B0F17` checkmark.
- **Toggle Switches**: Compact track 28x16px, background `#1F2A3D`. Active state: `#8B5CF6` track with a glowing white toggle nub.