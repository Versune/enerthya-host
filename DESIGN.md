---
name: Enerthya Host Panel
description: The machine's own front door — paper, ink, hairline rules, and a ledger of what the install does and does not ask for.
colors:
  paper: "#ffffff"
  paper-2: "#f5f6f4"
  paper-3: "#eceee9"
  ink: "#0b0c0b"
  ink-80: "#2b2e2b"
  ink-60: "#5f6360"
  rule: "#dcdfd9"
  rule-strong: "#b7bbb4"
  mint-700: "#06704d"
  inverse-text: "#f4f5f2"
  inverse-muted: "#a8aca6"
  inverse-rule: "#2a2d2a"
  dark-paper: "#0e100f"
  dark-paper-2: "#141715"
  dark-paper-3: "#1b1f1c"
  dark-ink: "#f1f2ef"
  dark-ink-80: "#d3d7d0"
  dark-ink-60: "#a2a7a1"
  dark-rule: "#242824"
  dark-rule-strong: "#3b403b"
  verified-text-dark: "#7fe7c0"
typography:
  display:
    fontFamily: "Archivo, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "clamp(2.5rem, 1.6rem + 3.2vw, 4.25rem)"
    fontWeight: 500
    lineHeight: 1.03
    letterSpacing: "-0.032em"
  lead:
    fontFamily: "Archivo, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  body:
    fontFamily: "Archivo, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.62
    letterSpacing: "0em"
  body-small:
    fontFamily: "Archivo, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.62
    letterSpacing: "0em"
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.62
    letterSpacing: "0.12em"
  receipt:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0em"
rounded:
  sm: "2px"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "20px"
  s-6: "24px"
  s-8: "32px"
  s-10: "40px"
  s-12: "48px"
  s-16: "64px"
  s-20: "80px"
  s-24: "96px"
  s-32: "128px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "0.65rem 1.25rem"
    height: "2.875rem"
    typography: "Archivo 500 0.9375rem/1"
  button-primary-hover:
    backgroundColor: "{colors.ink-80}"
    textColor: "{colors.paper}"
  link-inline:
    textColor: "{colors.ink}"
    padding: "0 0 2px 0"
    typography: "Archivo 400 0.875rem/1.62"
  field-underline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "0"
    padding: "0.55rem 0 0.6rem"
    typography: "Archivo 400 1.0625rem/1.4"
  field-label:
    textColor: "{colors.ink-60}"
    typography: "IBM Plex Mono 500 0.75rem/1.62, 0.12em tracking, uppercase"
  ledger-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-80}"
    padding: "16px 0"
  status-receipt:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-80}"
    padding: "16px 0"
    typography: "IBM Plex Mono 400 0.8125rem/1.7"
---

# Design System: Enerthya Host Panel

## Overview

**Creative North Star: "The Machine's Front Door"**

The panel behaves like the front door of the machine it runs on, not a SaaS onboarding funnel. It
is a sheet of paper with ink, hairline rules and a ledger: what this install is, what it asks for,
what it will never ask for. The sheet is near-black by default — a server is usually opened at
night — and white when the operator chooses light. The form is one column of underline fields with a
single ink button; the facts sit beside it on desktop and below it on a phone. Nothing floats,
nothing glows, and no card frames the form, because a card would imply a product boundary that is
not there.

The voice is declarative and procedural. Labels are mono and uppercase; body copy is plain Archivo;
a status line is a receipt with rules at top and bottom, not a toast or a callout. The world
deliberately withholds mint, its only semantic accent, because on these surfaces nothing has been
verified. The result should feel installed, local and accountable, with the machine's own record
on the page.

This system records the shipped surfaces: `/sign-in`, `/sign-up` and the signed-in workspace in
`(app)` — a 16rem sidebar, a 4rem topbar and a 56rem content column. The overview's H1 is the
active organization, the lede names the signed-in identity, and the ledger lists organizations.
Servers, projects and deployments each ship an honest empty state; none of them lists a row yet.
The command palette, the theme toggle and the dark default are part of the shell. The honest state is part of the visual contract: the receipt reports the server's literal
answer, and the panel never claims more than the process did.

**Key Characteristics:**
- Dark by default: the near-black canvas (#0e100f) with near-white ink (#f1f2ef); light is the
  same world with the pair inverted. No brand accent on the auth surfaces.
- Archivo at editorial scale for headings and body; IBM Plex Mono for labels, hints, ledger terms,
  receipts and footer.
- 1px hairlines for structure; fields are underlines, not boxes; no shadows, gradients or glass.
- Asymmetric 12-column split at 1024px: form in columns 1–6, ledger in 8–12, separated by a
  vertical hairline.
- Honest state: the receipt reports the server's literal answer; nothing is claimed beyond what
  the process did.

## Colors

A paper-and-ink palette with one semantic accent that is deliberately absent until something has
actually been verified.

### Primary
- **Machine Ink** (#0b0c0b): all primary text, the H1, structural rules (header underline, ledger
  top, status top), the primary button fill, the focus ring and the selection background. Measured
  at 19.60:1 on paper.

### Tertiary
- **Verified Mint** (#06704d): the declared semantic accent for a verified equality (`A = A`), a
  passing checksum or a confirmed verification row. It is absent from the shipped screens because
  nothing there has been verified. When it returns, this is the text step at 6.12:1 on paper. The
  declared ramp also contains mint-500 (#34d399, 1.92:1 on paper), which is fill or mark only,
  never text.

### Neutral
- **Paper** (#ffffff): page canvas, form background, button text and the receipt background. It is
  the only surface fill used on the shipped screens.
- **Paper 2** (#f5f6f4): declared passive surface tint. Not used on the shipped screens.
- **Paper 3** (#eceee9): declared deeper passive tint. Not used on the shipped screens.
- **Ink 80** (#2b2e2b): lede, ledger detail, receipt body and other secondary copy. Measured at
  13.74:1 on paper.
- **Ink 60** (#5f6360): mono labels, field hints, ledger terms, ledger foot, environment label and
  footer. Measured at 6.10:1 on paper.
- **Hairline** (#dcdfd9): row dividers and the footer rule. At 1.35:1 it is decorative structure,
  never text or the only signal of a control.
- **Strong Hairline** (#b7bbb4): inline-link underline and secondary dividers. At 1.95:1 it is
  decorative, never the boundary of a control. The field underline uses Ink 60 (#5f6360, 6.10:1)
  for exactly that reason.
- **Inverse Text** (#f4f5f2): text on an ink inverse surface, measured at 17.91:1 on ink. Declared,
  not used on the shipped screens.
- **Inverse Muted** (#a8aca6): muted text on an ink inverse surface, measured at 8.51:1. Declared,
  not used on the shipped screens.
- **Inverse Rule** (#2a2d2a): hairline on an ink inverse surface. Declared, not used on the
  shipped screens.

The declared `--ink-45` (#858984, 3.55:1 on paper) is not used by the shipped surfaces and is not
promoted into the system as a body-text token.

### Dark Scheme (default)

The world does not change in dark mode; only which end of the paper-and-ink pair is the surface.
The layout ships `data-theme="dark"`, and a stored choice is applied before first paint so the
document never flashes the other scheme. The same token names carry the values, so every rule in
this file holds in both schemes.

- **Dark Canvas** (#0e100f): the page, form and receipt background in dark mode.
- **Dark Surface 2** (#141715) and **Dark Surface 3** (#1b1f1c): declared passive tints, unused on
  the shipped screens.
- **Dark Ink** (#f1f2ef): primary text, the H1, structural rules, the button fill (which becomes a
  light button with dark text) and the focus ring.
- **Dark Ink 80** (#d3d7d0) and **Dark Ink 60** (#a2a7a1): secondary copy and mono metadata. Ink 60
  clears 7:1 on the dark canvas.
- **Dark Hairline** (#242824) and **Dark Strong Hairline** (#3b403b): decorative structure and the
  inline-link underline, as in light mode.
- **Verified Text Dark** (#7fe7c0): the readable mint step on the dark canvas; mint-700 (#07986a)
  is too dark to clear 4.5:1 there.

### Named Rules
**The Mint Is Evidence Rule.** Mint may mark only a verified equality (`A = A`), a passing checksum
or a confirmed verification row. It is never a button fill, heading, background block or brand
wash. On an unverified screen it is absent; when it returns, text uses mint-700 (#06704d, 6.12:1),
never mint-500 (#34d399, 1.92:1).

**The Ink Is the Accent Rule.** Until verification exists, the darkest ink is the interactive
accent: button, focus ring, selection. No second brand hue carries interaction; the accent is the
ink itself.

**The Two Ends of the Paper Rule.** Dark and light are one system: the same token names, the same
contrast relationships, with `--paper` and `--ink` swapped. A component never special-cases a
scheme; if it only works on one end, it is wrong.

## Typography

**Display Font:** Archivo (variable 100–900, self-hosted; fallback Helvetica Neue, Helvetica,
Arial, sans-serif)
**Body Font:** Archivo (same family and fallback)
**Label/Mono Font:** IBM Plex Mono (400 and 500, self-hosted; fallback ui-monospace, SFMono-Regular,
Menlo, Consolas, monospace)

**Character:** One grotesque does the speaking; the mono only annotates. Archivo carries the
editorial scale and the form's voice, while IBM Plex Mono is reserved for machine-facing metadata,
so a mono line always signals a label, a term, a hint or a receipt.

### Hierarchy
- **Display** (500, clamp(2.5rem, 1.6rem + 3.2vw, 4.25rem) — 40px at 375, 68px at 1440,
  line-height 1.03, tracking -0.032em): the H1 only, capped at 15ch with balanced wrapping.
- **Lead** (400, 1.1875rem / 19px, line-height 1.55): the lede under the H1, max 46ch, in ink-80.
- **Body** (400, 1.0625rem / 17px, line-height 1.62): base copy and field text. Ledger detail is
  0.9375rem / 15px at 1.65, max 42ch.
- **Body Small** (400, 0.875rem / 14px, line-height 1.62): inline links and the skip link.
- **Label** (500 mono, 0.75rem / 12px, line-height 1.62, tracking 0.12em, uppercase): field labels,
  ledger terms, the ledger title and the environment label, in ink-60.
- **Receipt** (400 mono, 0.8125rem / 13px, line-height 1.7): the status receipt, body in ink-80. The
  footer and ledger foot are 0.75rem mono, with 0.05em tracking on the footer.

### Named Rules
**The Mono Is Metadata Rule.** IBM Plex Mono appears only on labels, hints, ledger terms, the
receipt/status, the environment label and the footer. Headings, ledes, body copy, button labels and
links stay Archivo.

## Layout

The frame is a full-height flex column: a top bar with the brand at the left and `SELF-HOSTED PANEL`
at the right, a main screen, and a footer. The top bar is at least 4rem tall, padded by
`clamp(1.25rem, 4vw, 3rem)` at the inline edges, and closed by a 1px ink rule. The footer is closed
by a 1px rule and uses the same gutter.

The screen is a single column below 1024px: top padding `clamp(2.5rem, 5vw, 4.5rem)`, bottom padding
3rem, gutter at the sides, and a 2.5rem gap between the content column and the ledger. At 1024px and
up it becomes a 12-column grid, max-width 78rem, centered, with a column gap of
`clamp(1.5rem, 3vw, 3rem)`. The content column spans columns 1–6; the ledger starts at column 8 and
spans 5 columns, with a 1px left rule and `clamp(1.5rem, 3vw, 2.75rem)` of left padding. At 375 the
ledger follows the content and the H1 drops to a single-column measure.

The form itself is max 27rem wide. Fields are stacked 1.5rem apart. Actions wrap with 0.75rem row
and 1.25rem column gaps. The receipt is max 46ch. Interior rhythm is fixed on a 4px base; section
rhythm is fluid. The shipped screen uses a 78rem max width while the declared `--shell` token is
76rem and unused; 78rem is the recorded value.

The signed-in stub keeps the same frame and split; only the ledger content changes, from setup facts
to the list of organizations. A dashboard with its own navigation does not exist yet and must not be
implied by a placeholder sidebar.

The signed-in workspace is a two-column grid: a 16rem sidebar and the remaining width. The sidebar
is sticky, full height, closed by a 1px hairline on its right edge, with the brand over a 1px ink
rule and the nav as text links (no icons). The topbar is sticky at 4rem, closed by a 1px ink rule;
organization name on the left, ⌘K, theme toggle and sign-out on the right. The content column is
max 56rem with the same fluid gutter, and page headers are smaller than the auth H1
(`clamp(1.75rem, 1.35rem + 1.6vw, 2.75rem)`).

Below 860px the grid collapses to one column: the sidebar becomes a horizontal bar under the
brand, the nav turns into a row, and the foot note and ⌘K hint are hidden.

The only other layout breakpoints are the auth split at 1024px and `prefers-reduced-motion`.

### Named Rules
**The Asymmetric Split Rule.** At 1024px and up the form never centers: it holds columns 1–6 and the
ledger holds 8–12, separated by a vertical hairline. Below 1024px the ledger follows the form, in
that order.

**The Ledger Argument Rule.** The facts panel is a ledger, not a sidebar of tips: a 1px ink top
rule, one fact per ruled row, and a mono foot note. Three facts at most on the auth screens, each a
mono term over a sentence. The signed-in stub lists organizations in the same rows, term = name,
detail = slug.

## Elevation & Depth

There are no shadows. Depth is structural: 1px rules, the ledger's vertical hairline, generous
negative space and paper. No gradients, glass, blur or tonal stacking are used. The declared
paper-2, paper-3 and inverse tokens are the only permitted tonal layers for a future surface, and
they are not exercised here. Focus is a 2px ink outline, not a glow.

### Shadow Vocabulary
- **None.** The build declares no shadow token and uses no `box-shadow`, gradient, blur or backdrop
  filter on any shipped element.

### Named Rules
**The Flat-by-Structure Rule.** No `box-shadow`, gradient, blur or card. Hierarchy comes from scale,
hairline rules and space; a raised surface is a future surface's decision, not a default.

**The Rule Carries the Edge Rule.** When a boundary is needed, draw a 1px rule; when a control is
focused, draw a 2px ink outline with a 3–4px offset. Never simulate depth.

## Shapes

The form language is rectilinear and open. The button and the skip link take a 2px radius (`--r-1`);
fields take no radius and are defined by a single bottom rule; the ledger and receipt are open
blocks, not bordered containers. A 3px radius (`--r-2`) is declared but unused. Hairlines are 1px;
2px appears only on the invalid field underline and on focus outlines. The only circle is the brand
mark's glyph.

### Named Rules
**The Underline Field Rule.** A field is a label over a single 1px bottom rule, never a box. Rest is
Ink 60 (#5f6360, 6.10:1) — the rule is the control's only boundary, so it must clear 3:1; hover is
ink; focus is an ink underline plus a 2px ink outline offset 4px; invalid is an ink underline at
2px. A decorative hairline never stands in for a control boundary.

**The 2px Corner Rule.** Corners are 2px or square. No pill radii, no 8px card, no circle except the
brand mark.

## Components

### Buttons
- **Shape:** 2px radius, 2.875rem (46px) minimum height, 0.65rem by 1.25rem padding, 1px ink border.
- **Primary:** ink fill, paper text, Archivo 500 at 0.9375rem with a 1 line-height.
- **Hover:** ink-80 fill and border, 140ms with `cubic-bezier(0.2, 0.65, 0.25, 1)`.
- **Focus:** 2px solid ink outline, offset 3px.
- **Submitting:** the label changes to the gerund (`Signing in…`, `Creating…`, `Signing out…`) and
  the control is disabled; there is no spinner and no fill change.
- **Other variants:** none ship on these surfaces. Do not invent a secondary, ghost, destructive or
  disabled palette from the token set.

### Links (inline)
- **Style:** Archivo at 0.875rem, ink text, no text decoration; a 1px strong-hairline bottom border
  with 2px of bottom padding forms the underline.
- **Hover:** the bottom border shifts to ink. **Focus:** 2px ink outline, offset 3px.
- **Shipped copy:** `First run? Create an account` on sign-in, `Already have an account` on sign-up,
  `Create another account` on the signed-in stub.

### Inputs / Fields
- **Shape:** no box; transparent background; a single 1px strong-hairline bottom rule; zero radius;
  0.55rem top and 0.6rem bottom padding; Archivo 400 at 1.0625rem / 1.4.
- **Label:** mono 0.75rem, 500, 0.12em tracking, uppercase, ink-60, 0.35rem above the rule.
- **Fields shipped:** sign-in has Email and Password; sign-up adds Name above them and Organization
  below them. The organization field's hint reads `Servers, projects and members belong to this
  team.`
- **Hover:** the bottom rule shifts to ink-60.
- **Focus:** 2px ink outline offset 4px plus an ink bottom rule.
- **Invalid:** the bottom rule becomes ink at 2px; the error is mono 0.75rem ink text prefixed
  `— `; the field carries `aria-invalid`; the failure is also announced through the layout's polite
  live region, and focus moves to the first failing field.
- **Hint:** mono 0.75rem, line-height 1.65, ink-60. When the sign-up password reaches 12 characters
  the hint darkens to ink-80; there is no mint or checkmark.
- **Empty / valid:** an empty field is the strong-hairline underline. A valid submission navigates:
  sign-up writes the user and its organization, sign-in issues a session, and both land on the
  signed-in stub.

### Receipt / Status
- **Shape:** an open block with a 1px ink top rule and a 1px hairline bottom rule, 1rem of padding
  above and below, no fill, no side stripe and no radius.
- **Type:** mono 0.8125rem / 1.7 in ink-80. The strong first line is ink at weight 500 with 0.02em
  tracking; inline `<code>` is ink with a 1px strong-hairline bottom border.
- **Motion:** a 220ms `settle` (opacity 0 to 1, 4px rise) with the standard easing; reduced motion
  collapses it to 0.01ms.
- **Content:** the interface reports what the server actually answered. A refused request is shown
  as a receipt-style block led by `The panel refused the request.` plus the engine's own message.
  Invalid credentials read `Invalid email or password` with no hint about which half was wrong.
  Sign-up success redirects to the signed-in stub; there is no success toast.

### Ledger
- **Shape:** an open `<dl>` with a 1px ink top rule; each row has 1rem vertical padding and a 1px
  hairline bottom rule.
- **Term:** mono 0.75rem, 500, 0.12em tracking, uppercase, ink-60.
- **Detail:** Archivo 0.9375rem / 1.65, ink-80, max 42ch.
- **Foot:** mono 0.75rem / 1.7, ink-60.
- **Desktop:** a 1px left hairline and fluid left padding; on mobile the ledger follows the content
  without the left border.
- **Signed-in stub:** title `ORGANIZATIONS`, one row per organization (name over slug), foot
  `N teams · roles are owner, admin and member`.

### Header, Footer and Brand
- **Header:** brand at the left; at the right, the environment label (mono 0.75rem, 500, 0.12em,
  uppercase, ink-60) and the theme toggle, 1rem apart, closed by a 1px ink bottom rule.
- **Theme toggle:** a 2.25rem square, 1px strong-hairline border, 2px radius, transparent fill and
  an ink icon (16px Sun in dark, Moon in light). Hover raises the border to ink; focus is the
  standard 2px ink outline at 3px. It shows the scheme it switches to, carries
  `aria-label="Switch to light theme"` / `"Switch to dark theme"`, and stores the choice in
  `localStorage` under `theme`.
- **Brand:** a 1.5rem circular SVG mark in currentColor, the word `Enerthya` at Archivo 600 /
  1.125rem / -0.025em, and the mono suffix `HOST` at 0.75rem / 0.18em / uppercase in ink-60. The
  lockup is a link with a 2px ink focus outline offset 4px.
- **Footer:** flex-wrapped mono 0.75rem with 0.05em tracking in ink-60, 1.25rem vertical padding,
  1px hairline top rule.

### Signed-in Stub
- **Label:** `DASHBOARD` in mono ink-60 above the H1, the only place the label class leads a page.
- **H1:** the active organization's name; falls back to the first organization, then to
  `No organization yet.`
- **Lede:** `Signed in as {name} ({email})` followed by the honest statement that servers, projects
  and deployments are the next stage.
- **Actions:** the primary sign-out button and the `Create another account` link, in the standard
  wrapping action row.

### Dashboard Shell
- **Sidebar:** 16rem, sticky, 1px hairline on the right. Brand over a 1px ink rule; nav links at
  0.9375rem in ink-80 with a 2px radius; hover fills paper-2, the current page fills paper-3 and
  keeps ink text. No icons, no collapsible groups, no counts.
- **Topbar:** 4rem, sticky, 1px ink bottom rule, paper background. The organization is mono,
  uppercase, ink-60, truncated with an ellipsis; right side carries the ⌘K trigger, theme toggle
  and the sign-out button.
- **Page header:** a mono label, an H1 at
  `clamp(1.75rem, 1.35rem + 1.6vw, 2.75rem)`, and one lede at 52ch max. The empty state beneath is
  an ink top rule and a mono label — the same receipt grammar, not a dashed box.
- **Command palette:** a native `<dialog>` at `min(34rem, 92vw)`, 12vh from the top, 1px ink border,
  2px radius, paper fill. Input row closed by a hairline; items use the nav's hover and focus fill.
  Esc closes, Enter opens the first match; ⌘K/Ctrl+K opens it anywhere in the shell.

### Server List
- **Rows:** hairline-divided, name in Archivo over `user@host:port` in mono ink-60; state and
  runtime on the right in mono, with a 0.5rem status dot. The dot is mint only when a probe
  verified the runtime; unreachable is ink, untested is ink-45 — never red.
- **Actions:** quiet buttons (transparent fill, strong-hairline border) for Test and Remove; the
  local row says "Check runtime". Errors appear as mono text beside the row, not as a toast.
- **Add form:** inside a disclosure below the list, not a modal. Name/Host/Port/SSH user on one
  row at ≥860px; the key is a mono textarea with a hint that it is encrypted at rest.

### Selection and Focus
- **Selection:** ink background, paper text (`::selection`).
- **Focus:** every control uses a 2px solid outline from the palette. The button and inline link use
  `--focus` (ink) at offset 3px; the brand and field use ink at offset 4px; the skip link uses paper
  at offset -4px on its ink fill. Nothing relies on a glow or a colour shift alone.

### Named Rules
**The Receipt, Not a Callout Rule.** Status is an open, ruled receipt in mono, sharing the ledger's
grammar: no fill, no side stripe, no icon, no radius. It states the literal result, including when
the literal result is that nothing happened.

## Do's and Don'ts

### Do:
- **Do** use Machine Ink (#0b0c0b) for primary text, the primary button, focus rings, selection and
  the structural top rules; use Paper (#ffffff) for the canvas.
- **Do** keep the 12-column split at 1024px: content in columns 1–6, ledger in 8–12; stack the
  ledger after the content below 1024px.
- **Do** keep IBM Plex Mono on labels, hints, ledger terms, receipts and the footer; keep headings,
  body, button labels and links in Archivo.
- **Do** render fields as a label over a single underline, with a 2px ink outline at 4px offset on
  focus.
- **Do** measure contrast: body copy is ink or ink-80; mono metadata is ink-60 (6.10:1); verified
  text, when it exists, is mint-700 (6.12:1).
- **Do** report the engine's answer verbatim: a refusal keeps its own wording, and an unreadable
  state is shown with the remedy, never as a generic error.
- **Do** theme `::selection` (ink on paper) and every focus ring from the palette.
- **Do** keep the ledger at three facts on the auth screens, one term and one sentence per row, and
  one organization per row on the signed-in stub.
- **Do** use the gerund label on a submitting button and keep the control disabled until the
  request settles.
- **Do** ship dark by default and apply the stored theme in an inline script before first paint;
  the same component must work on both ends of the pair.

### Don't:
- **Don't** reintroduce the centered auth card, logo cloud or "Welcome back" register on these
  surfaces; the shipped build refuses all three.
- **Don't** use mint on an unverified surface, and never as a button, heading, background or brand
  wash; never use mint-500 (#34d399) as text (1.92:1).
- **Don't** add shadows, gradients, glass, blur or rounded cards; depth is hairlines and space.
- **Don't** box a field, and don't use a radius beyond 2px or any pill shape.
- **Don't** use the 1.95:1 strong hairline as a control boundary; it decorates dividers and inline
  links, and every field boundary clears 3:1 with Ink 60 at 6.10:1.
- **Don't** add verification email, password-reset mail, a cloud identity provider or a third-party
  request. Email is a local identifier for a local account; nothing is sent to it and no copy may
  imply that it was.
- **Don't** claim an account or session was created; the receipt must say what actually happened.
- **Don't** use mono uppercase as decoration; it marks a label, term, hint or receipt.
- **Don't** carry state by colour alone: errors are text with a leading `— `, an invalid underline
  in ink, `aria-invalid`, and focus moved to the first failing field.
- **Don't** give the sidebar a card, shadow, icon rail or collapsible sections; it is a hairline
  column of text links, and the ⌘K palette is the only command surface.
- **Don't** build a second palette for dark mode; invert the existing tokens, and never special-case
  a component per scheme.
