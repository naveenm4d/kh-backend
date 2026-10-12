---
name: Kulatissa Hardware Admin
description: The owner's back-office console for a single hardware store. Cool, quiet, dense, and built for glances between customers.
colors:
    accent-blue: '#3B6DEC'
    accent-blue-deep: '#2958D6'
    accent-blue-ink: '#2147B2'
    accent-blue-soft: '#93B4FB'
    accent-blue-mist: '#BFD3FE'
    accent-blue-wash: '#DDE7FE'
    accent-blue-tint: '#EFF4FF'
    cool-canvas: '#F6F6F7'
    panel-white: '#FFFFFF'
    zinc-ink: '#18181B'
    zinc-muted: '#63636B'
    zinc-subtle: '#A1A1AA'
    hairline: '#E4E4E7'
    success-wash: '#E7F6EC'
    success-ink: '#167A40'
    warning-wash: '#FDF1DC'
    warning-ink: '#925408'
    danger-wash: '#FDE8E6'
    danger-ink: '#B42318'
typography:
    headline:
        fontFamily: 'Inter Variable, Inter, system-ui, sans-serif'
        fontSize: '20px'
        fontWeight: 600
        lineHeight: '28px'
        letterSpacing: '-0.01em'
    figure:
        fontFamily: 'Inter Variable, Inter, system-ui, sans-serif'
        fontSize: '26px'
        fontWeight: 600
        lineHeight: '32px'
        letterSpacing: '-0.02em'
        fontFeature: 'tnum'
    title:
        fontFamily: 'Inter Variable, Inter, system-ui, sans-serif'
        fontSize: '14px'
        fontWeight: 600
        lineHeight: '20px'
    body:
        fontFamily: 'Inter Variable, Inter, system-ui, sans-serif'
        fontSize: '13px'
        fontWeight: 400
        lineHeight: 1.5
    label:
        fontFamily: 'Inter Variable, Inter, system-ui, sans-serif'
        fontSize: '12px'
        fontWeight: 500
        lineHeight: '16px'
    micro:
        fontFamily: 'Inter Variable, Inter, system-ui, sans-serif'
        fontSize: '11px'
        fontWeight: 400
        fontFeature: 'tnum'
    record-title:
        fontFamily: 'Inter Variable, Inter, system-ui, sans-serif'
        fontSize: '16px'
        fontWeight: 600
        lineHeight: '24px'
    panel-figure:
        fontFamily: 'Inter Variable, Inter, system-ui, sans-serif'
        fontSize: '15px'
        fontWeight: 600
        lineHeight: '24px'
        fontFeature: 'tnum'
rounded:
    bar: '4px'
    chip: '6px'
    control: '8px'
    panel: '12px'
    full: '9999px'
spacing:
    hairline: '1px'
    xs: '8px'
    sm: '12px'
    md: '16px'
    lg: '20px'
    xl: '32px'
    sidebar: '240px'
    record-panel: '340px'
    record-panel-xl: '400px'
    record-panel-2xl: '440px'
components:
    panel:
        backgroundColor: '{colors.panel-white}'
        rounded: '{rounded.panel}'
        padding: '16px 20px'
    stat-cell:
        backgroundColor: '{colors.panel-white}'
        textColor: '{colors.zinc-ink}'
        typography: '{typography.figure}'
        padding: '16px 20px'
    button-secondary:
        backgroundColor: '{colors.panel-white}'
        textColor: '{colors.zinc-ink}'
        rounded: '{rounded.control}'
        height: '32px'
        padding: '0 12px'
    button-secondary-hover:
        backgroundColor: '{colors.cool-canvas}'
    button-primary:
        backgroundColor: '{colors.accent-blue}'
        textColor: '{colors.panel-white}'
        rounded: '{rounded.control}'
        height: '32px'
        padding: '0 12px'
    button-primary-hover:
        backgroundColor: '{colors.accent-blue-deep}'
    nav-item:
        textColor: '{colors.zinc-muted}'
        typography: '{typography.body}'
        rounded: '{rounded.control}'
        height: '32px'
        padding: '0 8px'
    nav-item-active:
        backgroundColor: '{colors.panel-white}'
        textColor: '{colors.zinc-ink}'
    status-chip-success:
        backgroundColor: '{colors.success-wash}'
        textColor: '{colors.success-ink}'
        rounded: '{rounded.chip}'
        padding: '2px 8px'
    status-chip-warning:
        backgroundColor: '{colors.warning-wash}'
        textColor: '{colors.warning-ink}'
        rounded: '{rounded.chip}'
        padding: '2px 8px'
    status-chip-danger:
        backgroundColor: '{colors.danger-wash}'
        textColor: '{colors.danger-ink}'
        rounded: '{rounded.chip}'
        padding: '2px 8px'
    status-chip-brand:
        backgroundColor: '{colors.accent-blue-tint}'
        textColor: '{colors.accent-blue-ink}'
        rounded: '{rounded.chip}'
        padding: '2px 8px'
    chart-tooltip:
        backgroundColor: '{colors.zinc-ink}'
        textColor: '{colors.panel-white}'
        rounded: '{rounded.control}'
        padding: '6px 10px'
    select-compact:
        backgroundColor: '{colors.panel-white}'
        textColor: '{colors.zinc-ink}'
        typography: '{typography.body}'
        rounded: '{rounded.control}'
        height: '32px'
        padding: '0 32px 0 10px'
    date-field:
        backgroundColor: '{colors.panel-white}'
        textColor: '{colors.zinc-ink}'
        typography: '{typography.body}'
        rounded: '{rounded.control}'
        height: '32px'
        padding: '0 10px'
    segmented-control:
        backgroundColor: '{colors.cool-canvas}'
        rounded: '{rounded.control}'
        padding: '2px'
    segmented-item:
        textColor: '{colors.zinc-muted}'
        typography: '{typography.label}'
        rounded: '{rounded.chip}'
        height: '24px'
        padding: '0 10px'
    segmented-item-active:
        backgroundColor: '{colors.panel-white}'
        textColor: '{colors.zinc-ink}'
    chart-lead-callout:
        backgroundColor: '{colors.panel-white}'
        textColor: '{colors.zinc-ink}'
        rounded: '{rounded.chip}'
        padding: '4px 8px'
    button-compact:
        backgroundColor: '{colors.panel-white}'
        textColor: '{colors.zinc-ink}'
        rounded: '{rounded.control}'
        height: '32px'
        padding: '0 12px'
    button-compact-primary:
        backgroundColor: '{colors.accent-blue}'
        textColor: '{colors.panel-white}'
        rounded: '{rounded.control}'
        height: '32px'
        padding: '0 12px'
    button-compact-danger:
        backgroundColor: '{colors.panel-white}'
        textColor: '{colors.danger-ink}'
        rounded: '{rounded.control}'
        height: '32px'
        padding: '0 12px'
    button-compact-danger-hover:
        backgroundColor: '{colors.danger-wash}'
    button-compact-ghost:
        textColor: '{colors.zinc-muted}'
        rounded: '{rounded.control}'
        height: '32px'
        padding: '0 12px'
    search-field:
        backgroundColor: '{colors.panel-white}'
        textColor: '{colors.zinc-ink}'
        typography: '{typography.body}'
        rounded: '{rounded.control}'
        height: '32px'
        padding: '0 32px'
    compact-input:
        backgroundColor: '{colors.panel-white}'
        textColor: '{colors.zinc-ink}'
        typography: '{typography.body}'
        rounded: '{rounded.control}'
        height: '32px'
        padding: '0 10px'
    record-row-selected:
        backgroundColor: '{colors.accent-blue-tint}'
        textColor: '{colors.zinc-ink}'
    detail-panel:
        backgroundColor: '{colors.panel-white}'
        rounded: '{rounded.panel}'
        width: '{spacing.record-panel-xl}'
    panel-figure-cell:
        backgroundColor: '{colors.panel-white}'
        textColor: '{colors.zinc-ink}'
        typography: '{typography.panel-figure}'
        padding: '14px 16px'
    avatar-admin:
        backgroundColor: '{colors.accent-blue-wash}'
        textColor: '{colors.accent-blue-ink}'
        rounded: '{rounded.full}'
---

# Design System: Kulatissa Hardware Admin

## Overview

**Creative North Star: "The Category Standard, Done Well"**

The admin console follows the canon of modern operational software (Linear, Stripe Dashboard, Shopify Polaris, Vercel). It is benchmarked against those products, not quoted from them. A cool neutral canvas holds white panels drawn with 1px hairlines. Depth comes from edges, not shadows. One blue accent marks selection, primary action and the data series. Everything else is zinc ink at three strengths. Status colours appear only when a value carries a state.

The UI is dense: 13px text, 32px controls and 16px gutters. The figures are the exception. Money and counts are set large and semibold with tabular numerals, so the owner can read "how is today going" in a single glance between customers. The layout stays put while data loads. Skeletons mirror the loaded geometry, and empty states sit quietly inside their panel instead of taking over the page.

**Scope.** This document describes the **admin world only**. It is the token set under `:root[data-theme='admin']` in `frontend/src/styles/index.css`, and `AdminLayout` applies it to `<html>` so portalled modals, drawers and toasts inherit it too. By explicit user decision, the **POS/cashier and auth screens still use the legacy default token values in `:root`** (warm paper canvas, older blue, 16px card radius, a softer two-layer shadow). They are outside this system's scope. Do not treat those values as part of this system, and do not "fix" them to match this one without a new decision. Both worlds share the same token names (`brand-*`, `canvas`, `ink`, `line`, `success/warning/danger`, `radius-card`, `shadow-soft`). This means a component built from tokens re-themes correctly in either world.

**Brand mark.** The app icon is the store's only logo and sits outside both UI worlds. It is a stock-cream (#F2EDE2) plate with a black keyline, chamfered top-right and bottom-left and fastened by two aluminium socket-head bolts on the other diagonal. On it sits a condensed wood-type "KH", leaning about 12°, with a black K and a mechanical-red (#D7261E) H. A black label band carries the shop's Sinhala name, කුලතිස්ස, set in Noto Sans Sinhala Bold (SIL OFL). Each icon size has its own drawing: 256px and up carry everything, plus a faint letterpress speckle in the letters; 128px drops the label; 48–64px drops the bolts; 32px and below lose the plate, widen the letters and reduce the lean. The single source is `build/appicon.swift`, which `wails3 task common:generate:icons` runs to write `appicon.png`, `darwin/icons.icns` and `windows/icon.ico`. Never regenerate those files with `wails3 generate icons`, which downsamples one bitmap and destroys the small-size drawings. Inside the app the mark appears through `shared/components/BrandMark` (the generated `frontend/src/assets/brand/kh-mark.png`, the small-size drawing at 4×): 32px at the top of the admin sidebar and 44px in the cashier top bar, always beside the store name, so it carries no alt text. The mark's red and cream belong to the mark: they are not admin tokens, and the One Blue Rule still holds inside the admin.

The user explicitly rejected two things: the old warm-paper look in the admin, and the grid of identical KPI cards.

**Key Characteristics:**

- Cool neutral canvas, white panels, 1px hairlines, a 12px panel radius and near-zero shadow.
- A single blue accent for selection, primary action and charted data.
- Status hues reserved for state, always as a soft wash with dark ink.
- Inter Variable throughout, with tabular numerals on every figure.
- A dense 13px UI with large semibold figures.
- A grouped sidebar that sits on the canvas ground instead of a coloured rail.

## Colors

Zinc neutrals on a cool grey ground, with one blue doing all the accent work.

### Primary

- **Accent Blue** (accent-blue): today's bar in the sales chart, category revenue bars, the focus ring, primary buttons, and the active nav icon (via Accent Blue Deep).
- **Accent Blue Deep** (accent-blue-deep): the active nav icon, "View all" links, link hover and primary-button hover.
- **Accent Blue Ink** (accent-blue-ink): text on the blue tint, which covers the "Issued" status chip and the user avatar initials.
- **Accent Blue Soft / Mist** (accent-blue-soft, accent-blue-mist): Mist is the resting chart bar for past days and the text selection colour. Soft is the hovered or focused bar.
- **Accent Blue Wash / Tint** (accent-blue-wash, accent-blue-tint): Wash is the avatar ground. Tint is the bar-track ground and the brand chip ground.

### Neutral

- **Cool Canvas** (cool-canvas): the app ground behind the sidebar and content. It also fills table headers (at 50%), hovered rows and stat cells, and the chart's active-column well.
- **Panel White** (panel-white): every panel, stat cell, secondary button and the active nav item.
- **Zinc Ink** (zinc-ink): primary text, figures and the chart tooltip ground.
- **Zinc Muted** (zinc-muted): labels, descriptions, axis text, table headers and inactive nav text.
- **Zinc Subtle** (zinc-subtle): non-text marks only. That covers inactive nav icons, empty-state icons, the chart baseline and hovered control borders. It is too light for reading text.
- **Hairline** (hairline): every border, divider, stat-strip gutter and the scrollbar thumb. Row dividers inside lists use it at 70%.

### Status

- **Success** (success-wash / success-ink): Completed orders and positive month deltas.
- **Warning** (warning-wash / warning-ink): Pending orders, low-stock counts above the very-low level, and the low-stock meta dot.
- **Danger** (danger-wash / danger-ink): Cancelled orders, critical or out-of-stock counts, negative deltas, the logout hover and the error icon.

### Named Rules

**The One Blue Rule.** Blue is the only accent. It means selection, primary action or data. It is never decoration, and no second accent hue enters the admin.

**The State-Only Rule.** Green, amber and red appear only when a value carries a state (an order status, a stock level, the direction of a delta). They are always a soft wash with a dark ink of the same hue, never a saturated fill.

## Typography

**Display Font:** none (the admin has no display tier)
**Body Font:** Inter Variable (with Inter, system-ui, sans-serif), loaded from `@fontsource-variable/inter`

**Character:** One family, two voices. A compact 13px working voice for everything you read, and a tight-tracked semibold figure voice for everything you count.

### Hierarchy

- **Headline** (600, 20px/28px, -0.01em): the page title in the page header.
- **Figure** (600, 26px/32px, -0.02em, tabular): stat-strip values. This is the largest type in the admin, and it is used for numbers, not words.
- **Title** (600, 14px/20px): panel titles.
- **Body** (400 or 500, 13px, 1.5): the default UI size for nav items, list rows, table cells, panel descriptions and meta lines. Row names take 500, and amounts in rows take 600.
- **Label** (500, 12px/16px): table column headers, sidebar section labels, sub-lines and delta chips (600).
- **Micro** (400 to 600, 11px, tabular): chart axis ticks, tooltip date and status chip text (600).
- **Record Title** (600, 16px/24px): the title in a record page's detail panel header (a customer, bill, product or catalog entry).
- **Panel Figure** (600, 15px/24px, tabular): the two or three key figures at the top of a detail panel. Deliberately smaller than Figure: the panel is a reading surface beside a list, not a summary.

### Named Rules

**The Tabular Figures Rule.** Every number that can sit beside another number (money, counts, dates, invoice numbers, axis ticks) uses tabular numerals.

**The Sentence-Case Rule.** Labels, section names and status chips are sentence case ("Completed", "Overview"). No uppercase tracking labels.

## Layout

The app is a fixed two-column shell. A 240px sidebar sits on the canvas ground with a hairline right edge, and the scrolling content column fills the rest. The page header is padded 32px horizontally, 28px top and 20px bottom: title and context line on the left, then an "updated" time and a Refresh button on the right, bottom-aligned. The content is capped at 1440px wide with 32px side padding and 40px bottom padding.

The dashboard is a vertical stack of rows with a 16px gap. At 1280px (Tailwind `xl`) and above, each row after the stat strip is a three-column grid where the primary panel takes two columns and the companion panel takes one. Below 1280px, the rows stack to a single column and the stat strip drops from four cells to two. Within a row, panels stretch to equal height.

Panel interiors use a 20px horizontal inset, a 16px top inset and 12px under the header. Lists use 43px rows. Tables use 10px cell padding vertically and 12px horizontally, with 20px at the outer edges. Sidebar nav items are 32px tall with 1px between items and 20px between groups.

**Record pages.** Customers, Orders, Inventory and Catalog share one master–detail layout. The page header is padded 32px horizontally, 28px top and 16px bottom, with the title and a tabular count line on the left and the primary "New …" action on the right. A toolbar row (search, segmented filters, compact selects, a date field) sits below it with an 8px gap and 16px under. The body fills the remaining window height: the list takes the flexible left column and a fixed-width detail panel sits on the right, 16px apart, with 24px bottom padding. The panel is 340px below 1280px, 400px from 1280px and 440px from 1536px. Only the list and the panel scroll; the header and toolbar stay put.

**Optional columns.** A record list keeps its identifying column and its key figure at every width. Secondary columns are marked optional and drop out as the panel takes room: the first tier hides below 1280px (phone, last bill, category, sold this week, order date and status), the second hides below 1440px (spent, bill count, payment method). Hide whole columns rather than squeezing them; a cell that must survive at narrow widths truncates with an ellipsis.

## Elevation & Depth

The system is flat and drawn with hairlines. Depth is conveyed by the white-on-cool-grey contrast between panel and canvas, plus a 1px hairline border. The one resting shadow is so faint that it reads as a slightly sharper edge rather than as lift. Real elevation is reserved for transient overlays (modals, drawers and the chart tooltip).

### Shadow Vocabulary

- **Edge** (`box-shadow: 0 1px 2px rgba(24, 24, 27, 0.04)`, token `shadow-soft`): panels, the active nav item, the Refresh and Open-cashier buttons.
- **Tooltip** (Tailwind `shadow-lg`): the dark chart tooltip only.
- **Overlay** (`box-shadow: 0 20px 60px rgba(0,0,0,0.18)`, token `shadow-pop`): modals and drawers, shared with the POS world.
- **Selected row edge** (`box-shadow: inset 2px 0 0 rgb(var(--c-brand-500))`): the leading edge of the selected row in a record list. It is drawn as an inset shadow rather than a border so the row's geometry does not shift by a pixel on selection. This is a mark, not elevation.
- **Sticky header rule** (`box-shadow: inset 0 -1px 0 rgb(var(--c-line))`): the bottom hairline under a record list's sticky header, drawn as a shadow so it stays attached while rows scroll beneath.

### Named Rules

**The Hairline-First Rule.** Separate things with a 1px hairline or a canvas/white tone step before reaching for a shadow. The stat strip divides its cells with 1px hairline gutters inside one panel, not with separate shadowed cards.

## Shapes

Corners are gently rounded and follow a strict size ladder. Panels use 12px (`radius-card`). Controls, nav items and the tooltip use 8px. Chips, the delta badge and skeleton bones use 6px. Chart bars use 4px tops. Avatars, bar tracks and status dots are fully round. Borders are always 1px hairline and never thicker. A panel clips its children to its radius, which is how the stat strip's gutters and the table's header band meet the panel edge cleanly.

## Components

### Buttons

Small, quiet and outlined. The admin's working control is the secondary button.

- **Shape:** 8px radius, 32px tall, 12px horizontal padding, 12px semibold label with a 14px leading icon.
- **Secondary:** white ground, hairline border, ink text and the edge shadow. Hover shifts the ground to canvas.
- **Primary:** blue ground with white text. Hover deepens to Accent Blue Deep.
- **Focus:** a 2px Accent Blue outline at a 2px offset, applied globally to every focusable element in the admin.
- **Busy:** the leading icon spins and the button disables (Refresh).

### Chips

- **Status chip:** a 6px radius with 2px x 8px padding, micro type at 600, sentence case, in a state wash and ink. Completed is success, Pending is warning, Cancelled is danger and Issued is the blue tint.
- **Delta chip:** the same shape in label type at 600, with an arrow icon and signed percentage. The arrow and sign carry the direction, so colour is never the only cue. A flat change uses canvas and muted text.
- **Stock count chip:** warning at or below the low-stock level, danger at or below the very-low level or when out of stock (both set in Settings, defaults 20 and 5). It reads "3 rolls left" or "Out of stock".

### Cards / Containers

- **Corner Style:** 12px.
- **Background:** Panel White on Cool Canvas.
- **Shadow Strategy:** the Edge shadow only (see Elevation & Depth).
- **Border:** 1px hairline.
- **Internal Padding:** a 20px horizontal inset. Panel headers use 16px top and 12px bottom.

### Panel (signature)

A titled section: a title (Title type) with an optional muted 13px description underneath, and an optional quiet link at the top right ("Customers ›") that turns blue on hover. When a panel shows only the top N, a blue "View all N ›" link closes the list. The empty state is centred inside the panel body: a 24px subtle icon, a 13px medium title and a muted line capped at 34ch.

### Stat Strip (signature)

One panel split into four cells (two below 1280px) by 1px hairline gutters. Each cell holds a muted label with an optional muted count opposite it, the figure, and a meta line underneath that names its comparison ("Yesterday: Rs. …", "+11% vs last month"). Cells that link elsewhere take a half-canvas hover.

### Segmented Control

A small switch for a panel's view (Running total / Per day, Payment / Category / Cashier). The group is a canvas well with a hairline border, an 8px radius and 2px of inner padding. Each option is 24px tall with a 6px radius, 10px horizontal padding and 12px medium text. At rest an option is muted text that turns ink on hover. The pressed option is a white chip with a hairline ring, the Edge shadow and ink text, which is the same raised-chip language as the active nav item. It sits under the panel header, and it is a labelled group of pressed buttons rather than tabs.

### Compact Fields

Selects and date fields share the secondary button's frame: 32px tall, an 8px radius, a white ground, a hairline border and the Edge shadow, with 13px medium ink text and 10px horizontal padding. Hover darkens the border to Zinc Subtle. The select is the native control with a 14px muted chevron at the right edge (32px right padding). Date fields set their value in tabular numerals, and a range reads "[start] to [end]" with a muted 12px "to". An invalid range turns both borders to Danger Ink at 60%, and the line above the fields says what is wrong in Danger Ink ("Start date must be on or before the end date").

### Delta Chip, Neutral Tone

Some measures have no good direction. More credit sales is also more money not yet collected. Their delta keeps the arrow and the signed percentage, but it always takes the flat treatment (canvas ground, muted text) whichever way it moves. Green and red stay with measures where up is plainly good. A compact delta (11px, 4px horizontal padding, no vertical padding) sits in table cells and breakdown rows. When the comparison value is zero there is no percentage to show, so the chip gives way to muted text: "New" if the current value is above zero, a dash if both are zero. Changes under 10% keep one decimal, and the minus is a true minus sign (−).

### Panel Conventions

- **View all:** when a panel shows the top N of a list that lives on another page, it closes with the blue "View all N ›" link (Accent Blue Deep, Accent Blue Ink on hover). When there is no page to send the owner to, the tail folds into one final "Other (a, b, c)" row instead, so a breakdown stays at five rows.
- **No sales:** a period, row or chart with nothing sold says so in words that start with "No sales" ("No sales in either period", "No sales in the last 14 days"). In a table's change column, a row with no sales in the current period shows a muted 11px "No sales" instead of a −100% delta. Panel-sized gaps use the Panel empty state, and row-sized gaps stay inside the row.

### Data Visualisation

Columns are drawn in one hue. Past days use Accent Blue Mist, the hovered day uses Accent Blue Soft, and today uses solid Accent Blue with a "Today" axis label in ink. The plot uses horizontal gridlines at hairline 70% and a baseline in Zinc Subtle. The tooltip is dark ink with white tabular figures. Ranked bars sit on a 6px fully rounded Accent Blue Tint track, filled in Accent Blue.

**Comparison (A/B).** Wherever two periods are compared, A (the period being asked about) is solid Accent Blue and B (the comparison) is Accent Blue Mist. A small 10px swatch names each period in chart legends, the period bar, table column headers and the tooltip. B's figure is always printed beside A's ("vs Rs. 516,700 · 1–9 Sep"), so the pale colour is never the only way to read B. Paired bars stack two 6px fully rounded Tint tracks 2px apart, A on top in Accent Blue and B underneath in Mist, both scaled to the largest value in the panel. Paired columns put A on the left of B, 2px apart.

**Line chart.** Running totals are drawn as lines. Both strokes are 2px with round joins and caps. B is drawn first so A sits on top, and only A gets an area wash, at Accent Blue 8%. Points sit on bucket centres so the lines align with the paired columns and the x labels. At rest, A's last point carries a 4px-radius dot with a 2px white ring, and a lead callout sits just above whichever line finishes higher. The callout is a white 6px-radius chip with a hairline border and the Edge shadow, in 12px tabular text: the amount in semibold ink, then muted "ahead" or "behind" (plus "so far" while the period is still running). On hover the callout hides, the column takes the canvas well, a 1px Zinc Subtle crosshair drops to the baseline, both lines get dots, and the dark tooltip lists A and B with their swatches. The y-axis uses four even intervals at rounded values, labelled in 11px muted compact rupees. The plot is 240 to 340px tall and grows to match the panel beside it.

**The Fixed Pair Rule.** A is solid Accent Blue and B is Accent Blue Mist on every chart, bar, swatch and tooltip. The pair never swaps, and a comparison never brings in a second hue.

### Tables

13px cells. The header band uses half-canvas with hairline top and bottom and muted 12px column labels. Rows are divided by hairlines at 70%. The amount column is right-aligned, semibold and tabular. A cancelled amount is muted and struck through.

### Navigation

The sidebar sits on the canvas ground with a hairline right edge. It opens with an ink "KH" monogram tile and the store name. Items are grouped under 12px muted sentence-case labels (Overview, Sales, Stock, Admin). An item is 32px tall with an 8px radius, 13px medium text and a 16px icon. At rest it shows muted text with a subtle icon. Hover adds a 4% ink wash and ink text. The active item is a white raised chip with a hairline border, the Edge shadow, ink text and a blue icon. The footer holds an "Open cashier" secondary button and the user row (a blue-wash avatar, name and role, and a logout icon that turns danger on hover).

### Loading

A skeleton mirrors the loaded layout cell for cell, using hairline-at-60% bones with a 6px radius and a pulse, so nothing shifts when data arrives.

### Record Page (signature)

The admin's shape for any list of records the owner works through: customers, bills, products, brands, categories, suppliers. One shared kit, configured per page.

- **Master–detail:** the list stays on the left and the selected record opens in the fixed right panel (see Layout). Moving between records never opens or closes anything.
- **Selection lives in the URL** as `?id=`, replacing history rather than pushing it, so the dashboard, reports and other panels can deep-link straight to a record (a bill's customer, an item's product, a customer's bills). Changing a catalog tab clears the selection.
- **Keyboard:** the list is one focusable region (focus shows the 2px Accent Blue ring inset at the panel radius). ↑ and ↓ move the selection, and the list scrolls only vertically to keep the selected row in view below the sticky header.
- **Selected row:** Accent Blue Tint ground with the 2px Accent Blue inset leading edge (see Elevation & Depth). Rows at rest take a 60% canvas hover. A muted row (a cancelled bill) keeps muted text until it is selected.
- **List table:** 13px cells, 10px vertical cell padding, 12px horizontal and 20px at the outer edges. The sticky header is half-canvas over white, with muted 12px column labels. Rows divide at hairline 70%. While loading, eight skeleton rows mirror the columns. Over an empty result the header hides and the Panel empty state takes its place, with copy that names the filter or search that produced it.
- **No selection:** the panel shows a centred 24px subtle pointer icon, "Select [a customer] to see details" in 13px medium ink, and a muted hint naming the ↑/↓ keys. A stale or deleted `?id=` says the record could not be found, in muted 13px text, instead of an empty panel.

### Detail Panel

A white panel (12px radius, hairline, Edge shadow) with a fixed header and a scrolling body.

- **Header:** Record Title with an optional status chip beside it, a muted 13px tabular meta line (phone · address, brand · category, date · cashier), a 28px ghost close button at the top right, and a row of compact buttons underneath, 8px apart. The header is closed by a hairline.
- **Order of content:** figures, then the main inline action, then history or detail sections, then the destructive action. **The Last-Action Rule.** The destructive action (Delete customer, Delete product, Cancel bill) is a danger compact button alone in the final section of the panel, and it always confirms in a dialog that states the consequence. It never sits in the header button row.
- **Sections:** 20px horizontal inset and 16px vertical, divided by hairlines. A section title is a 12px medium muted label, with an optional muted tabular aside opposite it ("4 bills · 1 payment", "Low at 20 or fewer").
- **Callouts:** a state note about the whole record ("This bill was cancelled…", "On credit: …") is a 13px line in a state wash with its ink, 8px radius, set 20px in from the panel edges.

### Panel Figures and Facts

- **Panel Figures:** two or three key figures directly under the header, as one row divided by 1px hairline gutters, the stat strip's language at panel scale. Each cell has a 12px muted label over a Panel Figure value. A figure that carries a state takes the state ink with no wash (Owes in Warning Ink, a low or out-of-stock count in Warning or Danger Ink). A value that is zero reads in words where it matters ("Nothing" owed).
- **Panel Facts:** definition rows in 13px, muted label on the left and ink value right-aligned and tabular on the right, 8px apart. Values truncate rather than wrap unless they are free text. A related record in a fact (the bill's customer) is an Accent Blue Deep link.

### Compact Button

The admin's 32px button, used on every record page; the shared `Button` keeps POS's 44px touch sizing and is not resized for the admin. 8px radius, 12px horizontal padding, 13px medium label, a 14px icon 6px from the label, the Edge shadow on bordered variants. Disabled drops to 50% opacity. Busy disables it and adds a spinning leading icon.

- **Secondary** (default): white ground, hairline border, ink text. Hover darkens the border to Zinc Subtle.
- **Primary:** Accent Blue ground and border, white text, Accent Blue Deep on hover. The page's "New …" action, the panel's main action (Record payment), and the commit button of an inline action (Add to stock, Save price).
- **Danger:** white ground, hairline border, Danger Ink text; hover fills with Danger Wash. Used only for the Last-Action Rule's destructive action.
- **Ghost:** no ground or border, muted text; hover adds a 4% ink wash and ink text. For secondary navigation and resets ("All bills", "Clear filters").
- An icon-only compact button (pager arrows) narrows its padding to 8px and carries an aria-label.

### Search Field and Compact Input

Both share the compact field frame (32px, 8px radius, white ground, hairline border, Edge shadow, Zinc Subtle border on hover, 13px ink text, muted placeholder). The search field has a 14px muted search icon at the left and, once it holds text, a clear button at the right. The compact input sets its value in tabular numerals and turns its border to Danger Ink at 60% when invalid. An empty date field reads "Any date" in muted text instead of the browser's format mask, and carries a 14px muted calendar icon in place of the native picker glyph.

### Inline Action with Preview

Edits made inside a panel (record a payment, update stock, change a price) happen in place, without a modal. Fields carry a 12px medium muted label above them and sit beside or above the compact action button. Under the fields, one 12px muted tabular line says what the action will do before it is taken: "Leaves Rs. 4,500 owing" or "Settles the balance in full", "3 rolls → 43 rolls", "Cashier shows 12% off Rs. 2,000". With nothing entered the line explains the mode ("Adds to the current count."). A validation error replaces the line in Danger Ink rather than adding a second one.

### Avatars

In the admin, customer avatars use the single blue wash: Accent Blue Wash ground, Accent Blue Ink initials, fully round (24px in list rows, 32px in dashboard lists). The name-derived multi-tint palette belongs to the POS world only; the admin passes `mono` (The One Blue Rule).

### Stock Chip Wording

A stock count that carries a state is a chip whose label is the count in the product's unit: "3 rolls left", "14 pieces left", or "Out of stock" at zero. Danger at the very-low level or fewer (including zero), warning up to the low-stock level. Above that there is no chip, only the plain tabular number. Both levels are shop settings (Settings → Stock alerts; defaults 5 and 20), read through `useStockThresholds()`, never hard-coded. Status words ("Very low", "Low stock") appear only as the badge beside a product's title in its panel, never in a list cell, so a list column always reads as quantities.

### Record Pages: Open Items

Recorded as observed in the build, not as rules. The user may change both.

- The orders list's status chips carry a 1px inset ink-at-10% ring on every row, added so the Issued chip stays visible on a selected (tint) row. Status chips elsewhere (dashboard, customer history) have no ring.
- Below 1280px, order rows fold the date and status chip under the invoice number, giving rows of about 58px against roughly 41px for every other record list.
- The compact button's 13px medium label and its border-darkening secondary hover differ from the Buttons entry above (12px semibold, canvas ground on hover). Both are in the build; which one governs is unresolved.

## Do's and Don'ts

### Do:

- **Do** build every admin surface from the shared token names (`canvas`, `canvas-card`, `ink`, `ink-muted`, `line`, `brand-*`, status pairs, `radius-card`, `shadow-soft`) so it re-themes under `data-theme='admin'`.
- **Do** use the 12px / 8px / 6px radius ladder: panel, control, chip.
- **Do** set every comparable number in tabular numerals, and put the comparison period in words next to any delta ("vs last month").
- **Do** pair every status colour with text or an icon that carries the same meaning.
- **Do** keep empty and loading states inside the panel geometry they replace.
- **Do** build a list of records the owner works through as a Record Page: list left, fixed detail panel right, selection in `?id=`, ↑/↓ to move.
- **Do** put the destructive action last in the detail panel, alone, as a danger compact button that confirms (The Last-Action Rule).
- **Do** preview the outcome of an inline action in a muted line under its fields before the owner commits.
- **Do** use the compact button for admin actions instead of resizing the shared POS `Button`.

### Don't:

- **Don't** introduce a second accent hue. Blue is the only accent (The One Blue Rule).
- **Don't** use green, amber or red for anything that is not a state.
- **Don't** return to the warm-paper look or a grid of identical KPI cards in the admin.
- **Don't** set reading text in Zinc Subtle. It is for icons and marks only.
- **Don't** document, extend or restyle the POS/cashier or auth screens from this file. They run on the legacy `:root` values by explicit user decision.
