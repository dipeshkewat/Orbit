---
version: "alpha"
name: "Synth Core - OMEGA PROTOCOL"
description: "Synth Core Dashboard Section is designed for demonstrating application workflows and interface hierarchy. Key features include clear information density, modular panels, and interface rhythm. It is suitable for product showcases, admin panels, and analytics experiences."
colors:
  primary: "#2563EB"
  secondary: "#111111"
  tertiary: "#7628F3"
  neutral: "#111111"
  background: "#111111"
  surface: "#EAEBE8"
  text-primary: "#111111"
  text-secondary: "#EAEBE8"
  border: "#111111"
  accent: "#2563EB"
typography:
  display-lg:
    fontFamily: "System Font"
    fontSize: "60px"
    fontWeight: 600
    lineHeight: "60px"
    letterSpacing: "-0.05em"
    textTransform: "uppercase"
  body-md:
    fontFamily: "SFMono-Regular"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "19.5px"
  label-md:
    fontFamily: "SFMono-Regular"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
    textTransform: "uppercase"
rounded:
  md: "2px"
spacing:
  base: "4px"
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  gap: "2px"
  card-padding: "16px"
  section-padding: "24px"
components:
  button-primary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "16px"
  card:
    rounded: "0px"
    padding: "8px"
---

## Overview

- **Composition cues:**
  - Layout: Grid
  - Content Width: Full Bleed
  - Framing: Glassy
  - Grid: Strong

## Colors

The color system uses light mode with #2563EB as the main accent and #111111 as the neutral foundation.

- **Primary (#2563EB):** Main accent and emphasis color.
- **Secondary (#111111):** Supporting accent for secondary emphasis.
- **Tertiary (#7628F3):** Reserved accent for supporting contrast moments.
- **Neutral (#111111):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Background: #111111; Surface: #EAEBE8; Text Primary: #111111; Text Secondary: #EAEBE8; Border: #111111; Accent: #2563EB

## Typography

Typography pairs System Font for display hierarchy with SFMono-Regular for supporting content and interface copy.

- **Display (`display-lg`):** System Font, 60px, weight 600, line-height 60px, letter-spacing -0.05em, uppercase.
- **Body (`body-md`):** SFMono-Regular, 12px, weight 400, line-height 19.5px.
- **Labels (`label-md`):** SFMono-Regular, 12px, weight 600, line-height 16px, uppercase.

## Layout

Layout follows a grid composition with reusable spacing tokens. Preserve the grid, full bleed structural frame before changing ornament or component styling. Use 4px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a grid / full bleed composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Grid
- **Content width:** Full Bleed
- **Base unit:** 4px
- **Scale:** 4px, 8px, 12px, 16px, 20px, 24px, 32px, 38px
- **Section padding:** 24px, 32px
- **Card padding:** 16px, 20px, 24px, 32px
- **Gaps:** 2px, 4px, 16px, 24px

## Elevation & Depth

Depth is communicated through glass, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as glass first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Glass
- **Borders:** 2px #111111; 1px #111111; 1px #D4D4D4; 1px #404040
- **Shadows:** rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.6) 0px 25px 50px -12px; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.5) 0px 25px 50px -12px; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.8) 0px 25px 50px -12px
- **Blur:** 4px

### Techniques
- **Gradient border shell:** Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 24px padding and a 0px radius. Drive the shell with none so the edge reads like premium depth instead of a flat stroke. Keep the actual stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface inside the wrapper with a slightly smaller radius so the gradient only appears as a hairline frame.

## Shapes

Shapes rely on a tight radius system anchored by 2px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 2px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Anchor interactions to the detected button styles. Reuse the existing card surface recipe for content blocks.

### Buttons
- **Primary:** background #111111, text #EAEBE8, radius 2px, padding 16px, border 2px solid rgb(17, 17, 17).

### Cards and Surfaces
- **Card surface:** radius 0px, padding 8px, shadow none.
- **Card surface:** background #EAEBE8, border 1px solid rgb(212, 212, 212), radius 2px, padding 24px, shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.6) 0px 25px 50px -12px.
- **Card surface:** background #111111, border 1px solid rgb(64, 64, 64), radius 2px, padding 24px, shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.8) 0px 25px 50px -12px.

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 4px rhythm.
- Do reuse the Glass surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 2px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected moderate motion intensity without a deliberate reason.

## Motion

Motion feels controlled and interface-led across text, layout, and section transitions. Timing clusters around 150ms and 10000ms. Easing favors ease and linear. Hover behavior focuses on color and text changes. Scroll choreography uses Parallax for section reveals and pacing.

**Motion Level:** moderate

**Durations:** 150ms, 10000ms, 15000ms

**Easings:** ease, linear, cubic-bezier(0.4, 0, 0.2, 1)

**Hover Patterns:** color, text

**Scroll Patterns:** parallax
