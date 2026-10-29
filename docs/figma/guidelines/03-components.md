# Agentic BP DS — components

Every component in the library, with its closed property lists. A property value
that is not on its line does not exist: do not add a variant, a size or a colour
the list leaves out.

## base

### Avatar

Photo or initials for one person.

Props — `name`: `string`; `src`: `string`; `initials`: `string`; `size`: `xs` | `sm` | `md` | `lg` (default `md`); `shape`: `circle` | `square` (default `circle`); `decorative`: boolean (default `false`)

- Do not invent a local Avatar.
- Do not use for status or category labels.
- Do not make Avatar clickable. Wrap it in a Button or link only with a new contract.

### AvatarGroup

Overlapping row of kit Avatars with a +N count for the rest.

Props — `label`: `string`; `size`: `xs` | `sm` | `md` | `lg` (default `md`); `shape`: `circle` | `square` (default `circle`); `max`: `number`; `items`: `AvatarGroupItem[]` { name, src?, initials? }

- Do not invent a local avatar stack.
- Do not put anything but people in the group.
- Do not use for one person. Use Avatar.

### Button

Triggers an action.

Props — `emphasis`: `strong` | `subtle` | `minimal` (default `subtle`); `intent`: `brand` | `neutral` | `danger` (default `neutral`); `size`: `sm` | `md` | `lg` (default `md`); `iconStart`: `string`; `iconEnd`: `string`; `iconSize`: `sm` | `md` | `lg` | `xl`; `iconOnly`: boolean (default `false`); `loading`: boolean (default `false`); `toggle`: boolean; `disabled`: boolean (default `false`); `fullWidth`: boolean (default `false`); `type`: `button` | `submit` | `reset` (default `button`); `children`: `ReactNode`

- Do not use for in-text navigation (use Link).
- Do not put two strong brand Buttons in one view.
- Do not pair an emphasis and an intent outside the allowed pairs (no strong neutral, no subtle brand or danger).

### ButtonGroup

Joined row of kit Buttons that share one size and act as one control cluster.

Props — `label`: `string`; `size`: `sm` | `md` | `lg` (default `md`); `disabled`: boolean (default `false`); `children`: `Button[]`

- Do not invent a local button group or segmented control.
- Do not mix sizes inside one group.
- Do not put more than one strong brand Button in a group or the view.

### FilterButton

Filter chip for lists and tables: shows the filter name or its chosen value, opens its options, and turns an applied filter on or off.

Props — `size`: `sm` | `md` | `lg` (default `md`); `open`: boolean (default `false`); `disabled`: boolean (default `false`); `count`: `number`; `value`: `string`; `toggle`: `on` | `off`; `hasDropdown`: boolean (default `true`); `children`: `string`

Events — `onToggle`, `onClick`

- Do not invent a local split button, filter chip or dropdown trigger. Use Dropdown trigger=filter for the menu.
- Do not use for page actions or view switches. Use Button or a Dropdown.
- Do not put more than one word or two in the name.

### Icon

Draws one Material Symbols Outlined glyph at a kit size, colored by the parent text color or a semantic icon role.

Props — `name`: `string`; `size`: `xs` | `sm` | `md` | `lg` | `xl` (default `md`); `intent`: `inherit` | `neutral` | `subtle` | `brand` | `info` | `success` | `warning` | `danger` (default `inherit`); `filled`: boolean (default `false`); `label`: `string`

- Do not inline SVGs or emoji.
- Do not size with custom px; use size enum.

## brand

### Illustration

A piece of drawn artwork from the product, like the picture over an empty page.

Props — `name`: `ai-chip` | `chat-search`; `size`: `sm` | `md` | `lg` (default `md`); `animated`: boolean (default `false`); `label`: `string`

- Do not paste an SVG into a screen or a pattern. Add the artwork here instead.
- Do not use it for an icon. Use Icon.
- Do not use it for the product mark. Use Logo or LogoAI.

### Logo

Brand logo: the full wordmark or the mark alone, in fixed brand colors.

Props — `type`: `default` | `symbol` (default `default`); `label`: `string`

- Do not recolor, retint or tokenize the logo. Brand colors are fixed.
- Do not redraw it, use an image of it, or paste the SVG into a screen. Use this component.
- Do not stretch or resize it with custom px.

### LogoAI

AI logo for AI features: full logo or icon, in fixed brand colors.

Props — `type`: `default` | `symbol` (default `default`); `intent`: `color` | `monochrome` | `white` | `filled` (default `color`); `label`: `string`

- Do not recolor, retint or tokenize the logo. Brand colors are fixed.
- Do not redraw it, use an image of it, or paste the SVG into a screen.
- Do not stretch or resize it with custom px.

## data

### BarChart

Values side by side as bars, one group or stack per category, like invoices by status for each week.

Props — `label`: `string`; `title`: `string`; `subtitle`: `string`; `showHeader`: boolean (default `true`); `categories`: `string[]`; `series`: `ChartSeries[]` { name: string; values: number[]; intent?: ChartIntent; projectedFrom?: number; axis?: "start" | "end" }; `orientation`: `vertical` | `horizontal` (default `vertical`); `highlight`: `number | number[]`; `highlightIntent`: `green` | `olive` | `cyan` | `orange` | `pink` | `gray` | `purple` | `yellow` | `red` | `mint` (default `orange`); `stacked`: boolean (default `false`); `barWidth`: `wide` | `thin` (default `wide`); `showValues`: boolean (default `false`); `showGrid`: boolean (default `true`); `showLegend`: boolean (default `true`); `legendPosition`: `top` | `bottom` | `end` (default `bottom`); `animate`: boolean (default `true`); `format`: `number` | `currency` | `percent` (default `number`); `currency`: `string`; `height`: `number`; `emptyLabel`: `string`; `referenceLines`: `ChartReferenceLine[]`; `marker`: `ChartMarker` { category: number; label: string }; `selected`: `number | null`

Events — `onSelectedChange`

- Do not use it for a long, smooth trend. Use LineChart.
- Do not use it for one share of a total. Use PieChart.
- Do not draw charts with loose SVG or a chart library. Use the kit charts.

### Calendar

A full calendar of events by month, week, day or as a list, where people browse dates, filter calendars and add, edit or delete events.

Props — `label`: `string`; `events`: `CalendarEvent[]`; `defaultEvents`: `CalendarEvent[]`; `calendars`: `CalendarSource[]` { id: string; name: string; intent?: CalendarIntent; hidden?: boolean }; `view`: `month` | `week` | `day` | `list`; `defaultView`: `month` | `week` | `day` | `list` (default `month`); `views`: `CalendarView[]`; `date`: `string`; `defaultDate`: `string`; `weekStart`: `sunday` | `monday` (default `sunday`); `startHour`: `number`; `readOnly`: boolean (default `false`)

Events — `onEventsChange`, `onEventClick`, `onViewChange`, `onDateChange`

- Do not use it to pick one date or a range in a form. Use DatePicker.
- Do not use it for a timeline of one record's history or a list of due dates. Use Table.
- Do not build a local month grid, week grid or event chip. Use Calendar.

### Card

One item in a grid or list of options people compare and pick, like a proposal line, product or plan: title, details, a price and a status note, with an optional image and a select checkbox.

Props — `title`: `string`; `overline`: `string`; `badge`: `string`; `badgeIntent`: `BadgeIntent`; `description`: `string`; `amount`: `string`; `message`: `string`; `messageIntent`: `success` | `warning` | `danger` | `info` (default `success`); `image`: `string`; `imageAlt`: `string`; `icon`: `string`; `selectable`: boolean (default `false`); `selected`: boolean; `defaultSelected`: boolean (default `false`); `disabled`: boolean (default `false`); `href`: `string`; `actions`: `CardAction[]` { id: string; label: string; icon: string }; `menu`: `DropdownMenuEntry[]`

Events — `onSelectedChange`, `onClick`, `onAction`

- Do not build a card from a div with a border, or add a ProductCard, ProposalCard or CardFooter. Use Card.
- Do not use it for page sections. Use Section.
- Do not use it for key numbers. Use Scoreboard.

### Cell

Content for one table cell: text, a number, a date, a link, a redirect to another page, a person, a file, a status, a trend, progress, a switch, row actions or a row menu, a tree row, with an optional row checkbox.

Props — `type`: `text` | `link` | `avatar` | `avatarGroup` | `file` | `payment` | `badge` | `badges` | `trendPositive` | `trendNegative` | `progress` | `actions` | `actionIcons` | `actionMenu` | `checkbox` | `tree` | `number` | `date` | `status` | `switch` | `popupTrigger` | `textBlock` | `redirect` (default `text`); `size`: `sm` | `md` (default `md`); `alignment`: `start` | `center` | `end` (default `start`); `text`: boolean (default `true`); `checkbox`: boolean (default `false`); `label`: `string`; `href`: `string`; `name`: `string`; `src`: `string`; `people`: `CellPerson[]` { name, src? }; `icon`: `string`; `intent`: `BadgeIntent`; `badges`: `CellBadge[]` { label, intent? }; `value`: `string | number`; `actions`: `CellAction[]` { label, icon?, emphasis, intent, onClick? }; `menu`: `CellAction[]`; `checked`: boolean; `defaultChecked`: boolean; `level`: `number`; `expanded`: boolean; `showLines`: boolean (default `true`); `treeToggle`: `chevron` | `box` (default `box`)

Events — `onClick`, `onCheckedChange`, `onExpandedChange`

- Do not invent a local table cell, Tag, Trend, FileIcon, PaymentMethod or ActionCell.
- Do not draw a progress bar in a cell. Use type progress; it is a kit Meter.
- Do not use Badge for trends. Use a trend type.

### ChatMessage

One turn in a chat with the assistant: what the person asked, or what the assistant answered, with its workings, buttons and suggestions.

Props — `author`: `user` | `assistant`; `text`: `string`; `children`: `ReactNode`; `bubble`: boolean; `status`: `string`; `sections`: `ChatMessageSection[]` { id, label, count?, content, defaultOpen? }; `actions`: `ChatMessageActionId[]`; `pressed`: `ChatMessageActionId[]`; `suggestions`: `ChatSuggestion[]` { id, label }; `menu`: `DropdownMenuEntry[]`; `person`: `{ name?: string; src?: string; initials?: string }`; `label`: `string`

Functions — `apply`

Events — `onAction`, `onSuggestion`, `onMenuSelect`

- Do not build a bubble from your own divs, or add a ChatBubble, MessageRow or AiAvatar. Pass the props.
- Do not use it for an alert or a system notice. Use Callout or Toast.
- Do not put more than one action row on a turn.

### DataGrid

An editable table: people click a cell to add or change its content, like rule conditions, line items or mappings.

Props — `columns`: `DataGridColumn[]`; `rows`: `DataGridRow[]` { id: string; [key: string]: string }; `defaultRows`: `DataGridRow[]`; `size`: `sm` | `md` (default `md`); `line`: `medium` | `thin` (default `medium`); `rowNumbers`: boolean (default `true`); `canAddRows`: boolean (default `false`); `canRemoveRows`: boolean (default `false`); `canDeleteRows`: boolean (default `false`); `canInsertRows`: boolean (default `false`); `selectable`: boolean (default `false`); `selected`: `string[]`; `defaultSelected`: `string[]`; `rowLabel`: `string`; `emptyLabel`: `string`; `label`: `string`; `stickyFirstColumn`: boolean (default `true`); `expanded`: `string[]`; `defaultExpanded`: `string[]`; `collapsed`: `string[]`; `defaultCollapsed`: `string[]`; `totalRow`: `DataGridRow`; `legend`: `DataGridLegendItem[]` { intent: "success" | "warning" | "danger" | "info" | "neutral"; label: string; icon?: string }

Functions — `deleteConfirm`, `actionsFor`, `detail`, `detailCount`, `rowParent`, `cellStatus`, `cellReadOnly`, `cellLink`

Events — `onRowsChange`, `onDeleteRow`, `onSelectionChange`, `onExpandedChange`, `onCollapsedChange`, `onCellLink`

- Do not use it to show data people only read. Use Table.
- Do not invent an EditableCell, GridRow or a table of loose inputs. Pass columns with a type.
- Do not put loose checkboxes beside the grid to pick rows. Pass selectable.

### HeaderCell

Column title for a data table: uppercase label, optional select-all checkbox, optional sort, with a brand-faint bottom border, 2px or 1px.

Props — `label`: `string`; `size`: `sm` | `md` (default `md`); `alignment`: `start` | `center` | `end` (default `start`); `line`: `medium` | `thin` (default `medium`); `checkbox`: boolean (default `false`); `checked`: boolean; `defaultChecked`: boolean; `indeterminate`: boolean (default `false`); `sortable`: boolean (default `false`); `sort`: `none` | `asc` | `desc` (default `none`)

Events — `onCheckedChange`, `onSort`

- Do not invent a local th, TableHeader, ColumnTitle or SortButton.
- Do not use Cell for column titles, or HeaderCell in body rows.
- Do not mix HeaderCell and Cell sizes in one table.

### Legend

The key to a drawing: a small colour mark per name, so people can read what each colour means.

Props — `items`: `LegendKey[]` { id?, label, intent, value?, shape }; `orientation`: `horizontal` | `vertical` (default `horizontal`); `alignment`: `start` | `center` | `end` (default `center`); `shape`: `square` | `line` | `dot` (default `square`); `size`: `sm` | `md` (default `md`); `hidden`: `string[]`; `defaultHidden`: `string[]`; `label`: `string`; `decorative`: boolean (default `false`)

Events — `onHiddenChange`

- Do not add a second legend under a kit chart; the chart draws its own. Use showLegend and legendPosition to place it.
- Do not use it as a list of filters or tags. Use Badge or FilterButton.
- Do not write the colour yourself; pick an intent.

### LineChart

How values change over time as lines or filled areas, one per series, like revenue by month or invoices approved by day.

Props — `label`: `string`; `title`: `string`; `subtitle`: `string`; `showHeader`: boolean (default `true`); `categories`: `string[]`; `series`: `ChartSeries[]` { name: string; values: number[]; intent?: ChartIntent; projectedFrom?: number }; `area`: boolean (default `false`); `stacked`: boolean (default `false`); `showPoints`: boolean (default `false`); `showValues`: boolean (default `false`); `showGrid`: boolean (default `true`); `showLegend`: boolean (default `true`); `legendPosition`: `top` | `bottom` | `end` (default `bottom`); `animate`: boolean (default `true`); `format`: `number` | `currency` | `percent` (default `number`); `currency`: `string`; `height`: `number`; `emptyLabel`: `string`; `referenceLines`: `ChartReferenceLine[]` { value: number; label: string; intent?: ChartIntent; values?: number[]; note?: { at: number; label: string } }; `marker`: `ChartMarker` { category: number; label: string }

- Do not use it for categories without an order, like regions. Use BarChart.
- Do not use it for one share of a total. Use PieChart.
- Do not fake a limit or target with an extra series. It shows in the legend, the tooltip and the table as data. Use referenceLines.

### ListView

A list of records, one a row: a primary and a secondary line with an avatar, icon or image before them, and badges, actions, a chevron or a drag handle after, grouped under headers when the list is long, and stepping into nested lists in place.

Props — `label`: `string`; `items`: `ListViewItem[]` { id, primary, secondary?, group?, avatar?, icon?, image?, badge?, badgeIntent?, badgePosition, unread?, message?, messageIntent, actions, disabled?, children?, menu? }; `groups`: `ListViewGroup[]` { id: string; title: string }; `size`: `sm` | `md` | `lg` (default `md`); `collapsible`: boolean (default `false`); `stickyGroups`: boolean (default `false`); `collapsed`: `string[]`; `defaultCollapsed`: `string[]`; `selection`: `none` | `single` | `multiple` (default `none`); `selected`: `string[]`; `defaultSelected`: `string[]`; `interaction`: `none` | `drill` | `drag` (default `none`); `path`: `string[]`; `defaultPath`: `string[]`; `nesting`: `step` | `expand` (default `step`); `expanded`: `string[]`; `defaultExpanded`: `string[]`; `detail`: `ReactNode`

Events — `onItemsChange`, `onCollapsedChange`, `onSelectedChange`, `onOpen`, `onAction`, `onPathChange`, `onExpandedChange`

- Do not use it for values people compare across columns. Use Table or DataGrid.
- Do not use it for a short set of links. Use LinkList.
- Do not nest deeper than three levels, or use it for a tree people need to see at once. Use TreeView.

### NavTile

A way in to somewhere: the name of a place, a line about what is in it, and a colored icon square.

Props — `title`: `string`; `description`: `string`; `icon`: `string`; `intent`: `brand` | `green` | `olive` | `cyan` | `orange` | `pink` | `gray` | `purple` | `yellow` | `red` | `mint` (default `brand`); `href`: `string`; `disabled`: boolean (default `false`)

Events — `onClick`

- Do not use it to compare or pick options; that is Card.
- Do not put buttons or fields inside it. The whole tile is one link.
- Do not give a grid of tiles one intent; give each its own so the colors mean something.

### PieChart

How a whole splits into a few parts, as a donut or a solid pie, like payments by method.

Props — `label`: `string`; `title`: `string`; `subtitle`: `string`; `showHeader`: boolean (default `true`); `data`: `PieChartSlice[]` { label: string; value: number; intent?: ChartIntent }; `donut`: boolean (default `true`); `size`: `sm` | `md` | `lg` (default `md`); `showTotal`: boolean (default `true`); `totalLabel`: `string`; `showLegend`: boolean (default `true`); `legendPosition`: `end` | `bottom` (default `end`); `alignment`: `start` | `center` (default `start`); `maxSlices`: `number`; `otherLabel`: `string`; `animate`: boolean (default `true`); `format`: `number` | `currency` | `percent` (default `number`); `currency`: `string`; `emptyLabel`: `string`

- Do not use it for many parts or values over time. Use BarChart or LineChart.
- Do not switch the legend to bottom only to centre the chart. Use alignment center.
- Do not use it to compare parts that don't add up to a whole.

### Scoreboard

A strip of key numbers at the top of a screen, like open invoices, revenue or overdue amount, each with an optional trend and spark chart.

Props — `items`: `ScoreboardItem[]`; `selectable`: boolean (default `false`); `selected`: `string | null`; `defaultSelected`: `string | null`; `scroll`: boolean (default `true`); `label`: `string`

Events — `onSelectedChange`

- Do not build a metric row from your own divs or cards, or add a MetricCard, ScoreCard or Sparkline. Pass items.
- Do not use the chart as a real chart; it only shows the shape of the trend. Use a chart for readable data.
- Do not pair direction none with a success or danger status.

### Table

A semantic table of rows and columns, like invoices or accounts, with optional row selection, a caption and a total.

Props — `columns`: `TableColumn[]`; `rows`: `TableRow[]` { id?: string; [key: string]: ReactNode }; `size`: `sm` | `md` (default `md`); `line`: `medium` | `thin` (default `medium`); `caption`: `string`; `footer`: `TableFooter` { label: string; value: ReactNode }; `emptyLabel`: `string`; `selectable`: boolean (default `false`); `selected`: `string[]`; `defaultSelected`: `string[]`; `rowLabel`: `string`

Functions — `detail`, `detailCount`

Events — `onSelectionChange`, `onRowClick`

- Do not invent TableHeader, TableRow, TableCell or a local grid of divs. Pass columns and rows.
- Do not draw cell content yourself. Use kit Cell types for badges, people, links and row actions.
- Do not put search or filters in the table. Use a Toolbar above it.

### Timeline

What happened on a record, newest first: a circled icon per entry joined by a line, with the note, links and action for each one.

Props — `items`: `TimelineItem[]` { id, title, timestamp?, subtitle?, icon?, intent, notes?, links, action, menu? }; `size`: `sm` | `md` (default `md`); `label`: `string`

Events — `onMenuSelect`

- Do not build a feed from your own divs, or add a TimelineItem, ActivityCard or FeedRow. Pass items.
- Do not use it for steps in a flow. Use Steps.
- Do not use it for a list of records people sort and filter. Use Table.

### TreeView

A nested list people open and close level by level, like teams in an organization, project folders or account hierarchies, to pick, check or reorder items.

Props — `label`: `string`; `items`: `TreeItem[]` { id: string; label: string; icon?: string; disabled?: boolean; children?: TreeItem[] }; `defaultItems`: `TreeItem[]`; `selection`: `none` | `single` | `multiple` (default `single`); `selected`: `string[]`; `defaultSelected`: `string[]`; `expanded`: `string[]`; `defaultExpanded`: `string[]`; `showIcons`: boolean (default `false`); `showLines`: boolean (default `true`); `reorderable`: boolean (default `false`); `size`: `sm` | `md` | `lg`

Events — `onItemsChange`, `onSelectedChange`, `onExpandedChange`

- Do not use it for a flat list. Use Table, Select or RadioGroup.
- Do not use it for main app navigation. Use AppNav.
- Do not use it for sections of one page that open and close. Use Accordion.

### UsageBar

One bar for everything available in a period, split into the parts it is made of: what each part used, what is left, and anything spent past the allowance.

Props — `segments`: `UsageBarSegment[]` { id, value, kind, intent, label?, note?, recent?, legend? }; `figures`: `UsageBarFigure[]` { value, label, at, intent }; `showLegend`: boolean (default `true`); `label`: `string`

- Do not use it for one limit with one number. Use Meter, or UsageList for several limits each with their own bar.
- Do not use it to compare periods or trends. Use BarChart or LineChart.
- Do not build it from a stacked BarChart with text under it, and do not add a local cousin like SegmentedBar or AllowanceBar.

### UsageList

A list of usage limits, one a row: the limit's name, how much is used of it, a bar, and a short note, like API calls, storage and seats on a plan.

Props — `items`: `UsageListItem[]` { id, label, used, limit, unit?, note? }; `label`: `string`

- Do not build usage rows from a Table with a Meter column, or from loose bars and text. Use UsageList.
- Do not use it for task progress, like an upload or a setup checklist. Use Meter or Steps.
- Do not use it to compare records across columns. Use Table.

## feedback

### Badge

Short status or category label.

Props — `intent`: `neutral` | `hollow` | `info` | `success` | `warning` | `danger` | `highlight` (default `neutral`); `emphasis`: `subtle` | `strong` | `faint` (default `subtle`); `size`: `sm` | `md` | `lg` (default `sm`); `icon`: `string`; `iconOnly`: boolean (default `false`); `removable`: boolean (default `false`); `disabled`: boolean (default `false`); `children`: `string`

Events — `onRemove`

- Do not invent a local Badge, Tag, Chip or Pill.
- Do not use as a button or link. Only the close button is interactive.
- Do not use for people. Use Avatar.

### BadgeAlt

Alternate status or category label: tinted fill with a matching border, in three sizes.

Props — `intent`: `neutral` | `brand` | `success` | `warning` | `danger` | `info` (default `neutral`); `size`: `sm` | `md` | `lg` (default `md`); `removable`: boolean (default `false`); `disabled`: boolean (default `false`); `children`: `string`

Events — `onRemove`

- Do not use BadgeAlt where Badge fits. Badge is the default.
- Do not mix Badge and BadgeAlt on one screen.
- Do not use as a button or link. Only the X is interactive.

### Callout

Inline message that stays on the page, with an optional action and dismiss.

Props — `intent`: `info` | `success` | `warning` | `danger` (default `info`); `title`: `string`; `actionLabel`: `string`; `closeButton`: boolean (default `false`); `children`: `ReactNode`

Events — `onAction`, `onDismiss`

- Do not invent a local Callout, Banner or Notice.
- Do not use for short status labels on rows or cards.
- Do not use for pop-up messages that disappear on their own.

### Count

Small number badge for counts, like unread items on a nav link or tab.

Props — `intent`: `info` | `danger` | `neutral` (default `info`); `size`: `sm` | `md` | `lg` (default `md`); `subtle`: boolean (default `false`); `disabled`: boolean (default `false`); `count`: `number`; `max`: `number`; `label`: `string`

- Do not invent a local counter or notification dot.
- Do not put words in a Count. Use Badge.
- Do not use Count as a button.

### EmptyState

What a list, page or panel shows when it has nothing yet: an icon, a title, a line of help and the action that fills it.

Props — `title`: `string`; `description`: `string`; `icon`: `string`; `iconStyle`: `well` | `plain` (default `well`); `media`: `ReactNode`; `actions`: `ReactNode`; `outlined`: boolean (default `false`); `headingLevel`: `2` | `3` | `4` (default `3`)

- Do not invent EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription or EmptyContent. Pass props.
- Do not use it for page messages like errors or warnings. Use Callout.
- Do not use it while content is loading.

### Meter

How far along or how full something is, from 0 to 100, as a bar, a ring or a half ring, with optional red, amber and green zones.

Props — `value`: `number | "indeterminate"`; `label`: `string`; `shape`: `bar` | `circle` | `semicircle` (default `bar`); `size`: `sm` | `md` | `lg` (default `md`); `thresholds`: `none` | `bar` | `plotArea` | `all` (default `none`); `intent`: `info` | `success` | `warning` | `danger`; `referenceLines`: boolean (default `false`); `showValue`: boolean (default `false`); `datatip`: `string`

- Do not use it for a short wait of unknown length in the spot that is loading. Show a Spinner. indeterminate is for a bar that sits with the work, like a loading Toast, or that will get a value later.
- Do not use indeterminate with circle or semicircle; it is bar only.
- Do not draw bars or rings from divs or SVG. Use Meter.

### ProgressBar

The older 20-tall progress bar with its percent written on or beside it, for screens that still use the legacy look.

Props — `value`: `number`; `label`: `string`; `valueLabel`: `string`; `showLabel`: boolean (default `true`); `labelPosition`: `center` | `right` (default `center`)

- Do not use it for waits of unknown length. Show a spinner instead.
- Do not stack several bars for one process. Use one bar with a clear label.
- Do not draw a progress bar from divs. Use this or the kit progress bar.

### Skeleton

Gray placeholder shapes in the layout of content that is still loading, like lines of text, an avatar or an image, so the page keeps its shape until the data arrives.

Props — `shape`: `text` | `circle` | `rect` (default `text`); `lines`: `number`; `size`: `sm` | `md` | `lg` (default `md`); `width`: `string | number`; `height`: `string | number`; `animation`: `shimmer` | `pulse` | `none` (default `shimmer`); `loading`: boolean (default `true`); `children`: `ReactNode`; `label`: `string`

- Do not use it for a short status line. Use TextLoader.
- Do not use it when the amount done is known. Use Meter.
- Do not leave it up when the load failed; show a Callout or an EmptyState.

### Spinner

A small ring of ticks in the brand color that turns while something loads and the wait is short and unknown.

Props — `size`: `sm` | `md` | `lg` (default `md`); `label`: `string`; `showLabel`: boolean (default `false`)

- Do not put it in a Button. Use Button loading.
- Do not use it when the amount done is known. Use Meter.
- Do not use it for content with a known layout. Use Skeleton.

### TextLoader

Short text with a soft wave of light running through it, for a moment of work whose end is unknown, like Generating response… or Syncing invoices….

Props — `children`: `string`; `size`: `sm` | `md` | `lg` (default `md`); `speed`: `slow` | `normal` | `fast` (default `normal`)

- Do not use it for headings or body copy.
- Do not use it for long text; keep it to a few words.
- Do not use it when the amount done is known. Use Meter.

### Toast

A short note that floats in after an action, like Saved successfully, and goes away on its own after a few seconds, with an optional Undo.

Props — `open`: boolean; `title`: `string`; `description`: `string`; `intent`: `info` | `success` | `warning` | `danger` (default `info`); `actionLabel`: `string`; `progress`: `number | "indeterminate"`; `duration`: `number | null`

Events — `onClose`, `onAction`

- Do not use it for errors people must fix or read later. Use Callout on the page.
- Do not put more than one action in a toast.
- Do not make duration shorter than people need to read it and reach the action.

## form

### Cascader

Pick one item from options that nest several levels deep by walking columns left to right, like a field on a related object (Invoice / Account / Owner) or a region / country / city.

Props — `label`: `string`; `options`: `CascaderOption[]`; `value`: `string[]`; `defaultValue`: `string[]`; `variant`: `field` | `panel` (default `field`); `changeOnSelect`: boolean (default `false`); `searchable`: boolean (default `false`); `hasLegend`: boolean (default `true`); `placeholder`: `string`; `size`: `sm` | `md` | `lg`; `labelPosition`: `top` | `start`; `hideLabel`: boolean (default `false`); `name`: `string`; `required`: boolean (default `false`); `disabled`: boolean (default `false`); `invalid`: boolean (default `false`); `error`: `string`; `hint`: `string`; `help`: `string`; `emptyLabel`: `string`

Events — `onChange`

- Do not use it for a flat list. Use Select.
- Do not use it to browse or arrange a hierarchy without picking. Use TreeView.
- Do not nest Selects to fake levels, or build local columns. Use Cascader.

### ChatComposer

The box people write to the assistant in: what the question is about, what is attached, the words, and the toolbar that sends it.

Props — `value`: `string`; `defaultValue`: `string`; `placeholder`: `string`; `hints`: `string[]`; `scopeLabel`: `string`; `scoped`: boolean; `defaultScoped`: boolean (default `false`); `attachments`: `ChatComposerAttachment[]` { id, label }; `addMenu`: `DropdownMenuEntry[]`; `selecting`: boolean (default `false`); `dictating`: boolean (default `false`); `mode`: `quick` | `deep` (default `quick`); `disabled`: boolean (default `false`); `label`: `string`

Events — `onChange`, `onSend`, `onScopedChange`, `onScopeClose`, `onAttachmentRemove`, `onAdd`, `onSelectingChange`, `onDictatingChange`, `onModeChange`

- Do not build the box from Textarea and Buttons, or add a MessageBox, PromptInput or SendButton. Use this.
- Do not use it for an ordinary form field. Use Textarea.
- Do not show the scope row on a screen with nothing to scope to, and do not name a page the person is not on.

### Checkbox

Checkbox for multi-select and confirmations.

Props — `size`: `sm` | `md` | `lg` (default `md`); `checked`: boolean; `defaultChecked`: boolean (default `false`); `indeterminate`: boolean (default `false`); `error`: boolean (default `false`); `disabled`: boolean (default `false`); `hideLabel`: boolean (default `false`); `label`: `string`; `name`: `string`; `id`: `string`

Events — `onChange`

- Do not invent a local Checkbox.
- Do not use for one choice from several.
- Do not use as a submit action. Use Button.

### DatePicker

A date field that opens a calendar to pick one date, or a range between two dates.

Props — `label`: `string`; `type`: `single` | `dual` (default `single`); `size`: `sm` | `md` | `lg` (default `md`); `labelPosition`: `top` | `start` (default `top`); `hideLabel`: boolean (default `false`); `placeholder`: `string`; `value`: `string | DatePickerRange`; `defaultValue`: `string | DatePickerRange`; `minDate`: `string`; `maxDate`: `string`; `presets`: boolean (default `true`); `monthYear`: `title` | `menus` (default `title`); `name`: `string`; `id`: `string`; `required`: boolean (default `false`); `disabled`: boolean (default `false`); `invalid`: boolean (default `false`); `error`: `string`; `hint`: `string`; `help`: `string`

Events — `onChange`

- Do not invent a local Calendar, DateRangePicker, Popover or native input type=date.
- Do not use two DatePickers for a start and end. Use type dual.
- Do not use for time. There is no time picker yet.

### Form

One form: an optional title, kit fields (or titled sections of them) and the actions that save it.

Props — `title`: `string`; `description`: `string`; `variant`: `plain` | `card` (default `plain`); `labelPosition`: `top` | `start` (default `top`); `labelWidth`: `sm` | `md` | `lg` (default `md`); `columns`: `1` | `2` | `3`; `children`: `ReactNode`; `sections`: `FormSection[]`; `actions`: `ReactNode`; `error`: `string`; `id`: `string`

Events — `onSubmit`

- Do not invent FieldSet, FieldGroup, FieldLegend, FormSection, FormActions or a local <form> wrapper.
- Do not put a Form inside another Form.
- Do not put more than one strong brand Button in actions.

### FormDisplay

A read-only label and value, like a form field that shows data instead of editing it.

Props — `label`: `string`; `value`: `ReactNode`; `labelPosition`: `top` | `start` (default `top`); `help`: `string`; `empty`: `string`

- Do not put a gap or margin between stacked FormDisplays, or pass them to a Section one by one. Wrap the stack in one plain div, unless the Section has columns: then pass the rows straight in.
- Do not lay rows side by side with your own grid or flex. Use Section or Form columns.
- Do not invent DescriptionList, KeyValue, DetailRow, ReadOnlyField or a local label and value pair.

### FormulaEditor

A monospace field for writing formulas and rules, with a toolbar that inserts fields, operators and functions and checks the syntax.

Props — `label`: `string`; `hideLabel`: boolean (default `false`); `labelPosition`: `top` | `start` (default `top`); `size`: `sm` | `md` | `lg` (default `sm`); `placeholder`: `string`; `value`: `string`; `defaultValue`: `string`; `fields`: `FormulaField[]` { id: string; label: string }; `functions`: `FormulaFunction[]` { name: string; syntax?: string; description?: string }; `aiActive`: boolean (default `false`); `name`: `string`; `id`: `string`; `required`: boolean (default `false`); `disabled`: boolean (default `false`); `readOnly`: boolean (default `false`); `invalid`: boolean (default `false`); `error`: `string`; `hint`: `string`; `help`: `string`

Events — `onChange`, `onCheckSyntax`, `onCalculate`, `onAiAssist`

- Do not invent CodeEditor, ExpressionInput, a formula toolbar or a Textarea with buttons above it.
- Do not use for prose or notes. Use Textarea.
- Do not use for one-line values. Use Input.

### Input

Single-line text entry with its own label, hint, error and character count.

Props — `label`: `string`; `hideLabel`: boolean (default `false`); `labelPosition`: `top` | `start` (default `top`); `size`: `sm` | `md` | `lg` (default `md`); `type`: `text` | `email` | `password` | `search` | `number` | `tel` | `url` | `file` (default `text`); `placeholder`: `string`; `value`: `string`; `defaultValue`: `string`; `accept`: `string`; `multiple`: boolean (default `false`); `name`: `string`; `id`: `string`; `autoComplete`: `string`; `required`: boolean (default `false`); `disabled`: boolean (default `false`); `readOnly`: boolean (default `false`); `invalid`: boolean (default `false`); `error`: `string`; `hint`: `string`; `help`: `string`; `prefix`: `string`; `suffix`: `string`; `iconStart`: `string`; `iconEnd`: `string`; `maxLength`: `number`

Events — `onChange`, `onFilesChange`

- Do not invent a local Field, FieldLabel, FieldDescription, FieldError, FormItem, InputGroup or SearchInput.
- Do not build a local tooltip for help. Pass help; it shows in the kit HelpPopover.
- Do not use a placeholder as the label. Pass label, and hideLabel if it must not show.

### Lookup

A form field for picking one record from a long list, like a product or an account, through a searchable table in a wide Modal.

Props — `label`: `string`; `columns`: `TableColumn[]`; `rows`: `LookupRow[]`; `value`: `string | null`; `defaultValue`: `string | null`; `labelKey`: `string`; `title`: `string`; `icon`: `string`; `searchPlaceholder`: `string`; `pageSize`: `number`; `clearable`: boolean (default `true`); `placeholder`: `string`; `emptyLabel`: `string`; `size`: `sm` | `md` | `lg`; `labelPosition`: `top` | `start`; `hideLabel`: boolean (default `false`); `name`: `string`; `required`: boolean (default `false`); `disabled`: boolean (default `false`); `invalid`: boolean (default `false`); `error`: `string`; `hint`: `string`; `help`: `string`; `multiple`: boolean (default `false`); `trigger`: `field` | `button` (default `field`); `buttonIcon`: `string`; `confirmLabel`: `string`

Functions — `detail`, `detailCount`

Events — `onChange`, `onConfirm`

- Do not use it for a short list of plain options. Use Select.
- Do not use it for a path through nested levels. Use Cascader.
- Do not build a local lookup dialog, table picker or search field with a button. Use Lookup.

### RadioGroup

Pick exactly one option from a short visible list.

Props — `size`: `sm` | `md` | `lg` (default `md`); `orientation`: `vertical` | `horizontal` (default `vertical`); `layout`: `list` | `card` (default `list`); `disabled`: boolean (default `false`); `hideLegend`: boolean (default `false`); `labelPosition`: `top` | `start` (default `top`); `legend`: `string`; `name`: `string`; `value`: `string`; `defaultValue`: `string`; `error`: `string`; `hint`: `string`; `options`: `RadioGroupOption[]` { value, label, description?, badge?, badgeIntent?, disabled?, hideLabel? }

Events — `onChange`

- Do not invent a Radio, RadioItem or RadioLegend cousin.
- Do not use for independent yes/no choices. Use Checkbox.
- Do not use for long lists of options.

### Segmented

One choice from two to five options, shown as kit minimal Buttons side by side.

Props — `label`: `string`; `hideLabel`: boolean (default `false`); `options`: `SegmentedControlOption[]` { value: string; label: string; icon?: string; disabled?: boolean }; `value`: `string`; `defaultValue`: `string`; `size`: `sm` | `md` | `lg` (default `md`); `fullWidth`: boolean (default `false`); `disabled`: boolean (default `false`); `name`: `string`

Events — `onChange`

- Do not invent ToggleGroup, ToggleButtons, Segmented or a ButtonGroup with a pressed button. Options are already kit Buttons.
- Do not use for more than five options or long labels. Use Select.
- Do not use for on/off. Use Switch.

### Select

Choose one or several options from a list.

Props — `label`: `string`; `options`: `SelectOption[]` { value, label, disabled? }; `size`: `sm` | `md` | `lg` (default `md`); `labelPosition`: `top` | `start` (default `top`); `itemCheck`: `check` | `checkbox` (default `check`); `hideLabel`: boolean (default `false`); `multiple`: boolean (default `false`); `placeholder`: `string`; `value`: `string | string[]`; `defaultValue`: `string | string[]`; `maxVisible`: `number`; `searchable`: boolean (default `false`); `searchPlaceholder`: `string`; `name`: `string`; `id`: `string`; `required`: boolean (default `false`); `disabled`: boolean (default `false`); `invalid`: boolean (default `false`); `error`: `string`; `hint`: `string`; `help`: `string`; `menuWidth`: `default` | `field` (default `default`)

Events — `onChange`

- Do not use a native select.
- Do not invent SelectTrigger, SelectContent, SelectItem, MultiSelect, Combobox or Tag.
- Do not use for actions from a button. Use Dropdown.

### Switch

An on/off setting that takes effect right away.

Props — `label`: `string`; `hideLabel`: boolean (default `false`); `description`: `string`; `size`: `sm` | `md` | `lg` (default `md`); `checked`: boolean; `defaultChecked`: boolean (default `false`); `disabled`: boolean (default `false`); `name`: `string`; `id`: `string`

Events — `onChange`

- Do not invent Toggle, ToggleGroup, SwitchGroup or a local pill switch.
- Do not use for choices that wait for a Save button, or for agreeing to terms. Use Checkbox.
- Do not use for picking one of several options. Use RadioGroup.

### Textarea

Multi-line text entry for notes, descriptions and code, with its own label, hint, error and character count.

Props — `label`: `string`; `hideLabel`: boolean (default `false`); `labelPosition`: `top` | `start` (default `top`); `size`: `sm` | `md` | `lg` (default `md`); `type`: `text` | `code` (default `text`); `placeholder`: `string`; `value`: `string`; `defaultValue`: `string`; `name`: `string`; `id`: `string`; `required`: boolean (default `false`); `disabled`: boolean (default `false`); `readOnly`: boolean (default `false`); `invalid`: boolean (default `false`); `error`: `string`; `hint`: `string`; `help`: `string`; `maxLength`: `number`

Events — `onChange`

- Do not invent a local Field, FieldLabel, FieldError, CodeEditor or NotesBox.
- Do not use for one-line values. Use Input.
- Do not use for rich text or syntax highlighting. That is out of scope.

## layout

### Accordion

List of short sections where one opens at a time.

Props — `defaultExpanded`: `string`; `items`: `AccordionItem[]` { id, title, content }

- Do not invent a local Accordion, Collapse or Disclosure.
- Do not open more than one item at a time.
- Do not use for switching between peer views of the same data.

### Carousel

A track of slides people page through with previous and next buttons, swipe or the arrow keys, like a gallery or featured cards.

Props — `items`: `ReactNode[]`; `orientation`: `horizontal` | `vertical` (default `horizontal`); `slidesPerView`: `1` | `2` | `3` | `4` (default `1`); `alignment`: `start` | `center` (default `start`); `loop`: boolean (default `false`); `showControls`: boolean (default `true`); `showIndex`: boolean (default `false`); `label`: `string`

Events — `onIndexChange`

- Do not add CarouselContent, CarouselItem, CarouselPrevious or CarouselNext. Pass items.
- Do not use it to switch views. Use Tabs.
- Do not use it to page a list or table. Show the rows.

### Conveyor

Arrows at both ends of a row or column that is too long to fit, so people can move it along without a scrollbar.

Props — `children`: `ReactNode`; `orientation`: `horizontal` | `vertical` (default `horizontal`); `step`: `number`; `label`: `string`

- Do not use it for paged slides or a gallery. Use Carousel.
- Do not use it to page a table. Use Pagination.
- Do not put a second scrolling box inside it; turn that one's scrolling off.

### Density

Sets the density tokens for everything inside it: Compact, Default or Comfortable spacing, control and icon sizes, and font sizes, like the BP Foundations density modes.

Props — `value`: `compact` | `default` | `comfortable` (default `default`); `children`: `ReactNode`

- Do not set size on every control to fake a density. Wrap them in Density.
- Do not invent DensityProvider, SizeProvider or a local size context.
- Do not set data-density by hand on screens. Use Density.

### Section

A titled block of a page, like Account information or Recent invoices: a header with a line under it, optional help and buttons, and the content below.

Props — `title`: `string`; `description`: `string`; `help`: `string`; `actions`: `ReactNode`; `children`: `ReactNode`; `line`: `medium` | `thin` | `none` (default `medium`); `columns`: `1` | `2` | `3`; `collapsible`: boolean (default `false`); `expanded`: boolean; `defaultExpanded`: boolean (default `true`); `heading`: `md` | `sm` | `xs`; `spacing`: `default` | `tight` (default `default`)

Events — `onExpandedChange`

- Do not invent a SectionHeader, SectionTitle or a heading with a border. Use Section.
- Do not override the header line with CSS or draw a border above the content. Use line.
- Do not use it for the page title. Use PageHeader.

## navigation

### AnchorNav

A list of the sections on one long page, which jumps to a section and shows the one the page is at.

Props — `items`: `AnchorNavItem[]` { id, label }; `active`: `string`; `defaultActive`: `string`; `variant`: `rail` | `menu` (default `rail`); `spy`: boolean (default `true`); `offset`: `number`; `label`: `string`

Events — `onActiveChange`

- Do not use it for app navigation. Use AppNav.
- Do not use it to switch views on one screen. Use Tabs.
- Do not use it for steps in a flow. Use Steps.

### AppHeader

The product's top bar: logo and environment on the start, global search in the centre, utility icons, the user and their company on the end.

Props — `navOpen`: boolean (default `false`); `logo`: `ReactNode`; `homeHref`: `string`; `environment`: `string`; `environmentIntent`: `success` | `info` | `warning` | `danger` | `highlight` | `neutral` (default `success`); `search`: boolean (default `true`); `searchPlaceholder`: `string`; `searchShortcut`: `string`; `searchGroups`: `CommandGroup[]` { heading?: string; items: { id; label; description?; icon?; shortcut?; disabled? }[] }; `searchVariant`: `list` | `tabs` (default `list`); `searchIconStyle`: `tile` | `plain` (default `tile`); `searchScopes`: `CommandScope[]` { value: string; label: string }; `searchScope`: `string`; `actions`: `AppHeaderAction[]` { id: string; label: string; icon: string }; `user`: `AppHeaderUser` { name: string; src?: string }; `company`: `AppHeaderCompany` { name: string; logo?: ReactNode }; `darkMode`: boolean (default `false`); `density`: `compact` | `default` | `comfortable`

Events — `onNavToggle`, `onSearch`, `onSearchSelect`, `onSearchScopeChange`, `onAction`, `onUserSettings`, `onDarkModeChange`, `onDensityChange`, `onLogout`

- Do not invent TopBar, NavBar, Header, GlobalSearch, UserBadge, UserMenu or CompanyBadge.
- Do not put the page title, breadcrumbs or page actions in it. They belong in the page.
- Do not put more than three icon actions in it.

### AppNav

The app's main navigation: a brand rail of sections on the left, each with an optional second-level menu that flies out beside it.

Props — `items`: `SideNavEntry[]` { id: string; label: string; icon: string; href?: string; children?: SideNavChild[] } | { divider: true }; `endItems`: `SideNavItem[]`; `current`: `string`; `defaultCurrent`: `string`; `expanded`: boolean (default `false`); `pinned`: boolean; `defaultPinned`: boolean (default `false`); `label`: `string`

Events — `onNavigate`, `onPinnedChange`

- Do not invent a Sidebar, NavRail, Flyout or local menu beside it.
- Do not put page actions, filters or tabs in it. Those belong in the page.
- Do not nest a third level. A section has one menu of links, split by dividers.

### Breadcrumb

Path to the current page as a trail of links.

Props — `separator`: `slash` | `chevron` (default `slash`); `maxItems`: `number`; `items`: `BreadcrumbItem[]` { label, href?, onClick? }; `current`: boolean (default `true`)

- Do not invent a local Breadcrumb, BreadcrumbItem or BreadcrumbLink.
- Do not make the current page a link.
- Do not use Breadcrumb as the sidebar or as tabs.

### ChatHeader

The bar at the top of the assistant: its mark and name, then start a new chat, go full screen, the options menu and close.

Props — `title`: `string`; `expanded`: boolean (default `false`); `chatsCount`: `number`; `playbooksCount`: `number`; `planMode`: boolean (default `false`); `menu`: `DropdownMenuEntry[]`; `label`: `string`

Events — `onNewChat`, `onExpandedChange`, `onClose`, `onPlanModeChange`, `onMenuSelect`

- Do not use it as the app's top bar. Use AppHeader.
- Do not use it as a page title. Use PageHeader.
- Do not build the bar from Buttons and a Logo, or add an AiHeader or CopilotBar. Use this.

### ChatList

The saved chats or playbooks beside the assistant: a titled panel with a search box and rows that open what they name.

Props — `title`: `string`; `items`: `ChatListItem[]` { id, label, icon?, menu? }; `groups`: `ChatListGroup[]` { id, label, items, defaultOpen? }; `selected`: `string`; `searchable`: boolean (default `true`); `searchPlaceholder`: `string`; `query`: `string`; `createLabel`: `string`; `closeLabel`: `string`; `emptyLabel`: `string`

Functions — `more`

Events — `onSelect`, `onQueryChange`, `onCreate`, `onClose`, `onItemMenuSelect`

- Do not use it for app navigation. Use AppNav.
- Do not use it for a list of records people sort and filter. Use Table.
- Do not build the rows from your own divs, or add a ChatRow or PlaybookItem. Pass items.

### GlobalSearch

A search field over a grouped list of pages, records and actions.

Props — `groups`: `CommandGroup[]` { heading?, items }; `variant`: `list` | `tabs` (default `list`); `iconStyle`: `tile` | `plain` (default `tile`); `size`: `sm` | `md` (default `md`); `label`: `string`; `placeholder`: `string`; `empty`: `string`; `defaultQuery`: `string`; `hints`: boolean (default `true`); `scopes`: `CommandScope[]` { value: string; label: string }; `scope`: `string`; `defaultScope`: `string`; `autoFocus`: boolean (default `false`)

Events — `onScopeChange`, `onSelect`, `onViewAll`

- Do not invent CommandInput, CommandList, CommandItem, CommandGroup, CommandEmpty, CommandDialog or SearchPanel.
- Do not use for a short list of actions from a button. Use Dropdown.
- Do not use for choosing a form value. Use RadioGroup, or Select when it exists.

### GuidedProcess

The pieces of a process walked one step at a time: a dark panel for a step, the dark list of every step beside the page, the header over a step, and the footer under it.

Props — `part`: `panel` | `steps` | `header` | `footer` (default `panel`); `title`: `string`; `subtitle`: `string`; `steps`: `GuidedProcessStep[]` { title, status, statusText?, tasks }; `current`: `number`; `started`: boolean (default `true`); `placement`: `auto` | `side` | `band` (default `auto`); `shade`: `1` | `2` | `3` | `4` | `5` (default `1`); `startLabel`: `string`; `side`: `start` | `end` (default `end`); `stepTitle`: `string`; `total`: `number`; `actions`: `GuidedProcessAction[]` { id, label, icon?, emphasis, intent?, type, form?, disabled? }; `updated`: `string`

Events — `onStart`, `onCancel`, `onClose`, `onStepsOpen`, `onAction`

- Do not use it for a short flow inside a Modal or a Drawer. Use Steps.
- Do not use it for page sections that can be visited in any order. Use Tabs or AnchorNav.
- Do not invent GuidedProcessPanel, GuidedProcessSteps, GuidedProcessHeader, GuidedProcessFooter or a light version of the dark parts.

### Link

Inline text that takes people somewhere: a record, a list or another page.

Props — `children`: `ReactNode`; `href`: `string`; `intent`: `brand` | `neutral` (default `brand`); `external`: boolean (default `false`); `disabled`: boolean (default `false`)

Events — `onClick`

- Do not use Link for an action that changes data, like Delete or Save. Use Button.
- Do not use Link in a table cell. Use a link Cell.
- Do not stack Links into a list yourself. Use LinkList.

### LinkList

A column of links, one a row with a chevron at the end, like an account's quick links.

Props — `items`: `LinkListItem[]` { id, label, href?, onClick, icon?, description?, external? }; `label`: `string`

- Do not use it for actions that change data. Use Buttons or a Dropdown.
- Do not use it for page navigation across the app. Use AppNav or Tabs.
- Do not put it in a Card or draw a box round it yourself. Put it in a Section.

### PageHeader

The top of a page's content: where it sits (breadcrumb), what it is (title, badge, and an optional icon) and the page actions.

Props — `title`: `string`; `breadcrumbs`: `BreadcrumbItem[]` { label: string; href?: string; onClick?: () => void }; `back`: `PageHeaderBack` { label: string; href?: string; onClick?: () => void }; `icon`: `string`; `badge`: `string`; `badgeIntent`: `neutral` | `info` | `success` | `warning` | `danger` | `highlight` (default `neutral`); `actions`: `ReactNode`; `moreActions`: `DropdownMenuEntry[]` { id: string; label: string; icon?: string; danger?: boolean } | { divider: true }; `sticky`: boolean (default `false`); `shadow`: boolean (default `true`)

Events — `onMoreSelect`

- Do not invent ContentHeader, PageTitle, TitleBar or a local heading row.
- Do not put the app's logo, search or user in it. That is the AppHeader.
- Do not put more than one strong brand Button in actions, or more than five visible actions.

### Pagination

The bar under a long table that moves between pages, says which rows are showing, and lets people pick how many rows a page holds.

Props — `total`: `number`; `page`: `number`; `defaultPage`: `number`; `pageSize`: `number`; `defaultPageSize`: `number`; `pageSizes`: `number[]`; `showRange`: boolean (default `true`); `showPageSize`: boolean (default `true`); `label`: `string`

Events — `onPageChange`, `onPageSizeChange`

- Do not use it to switch views or steps. Use Tabs.
- Do not build page buttons from a ButtonGroup or loose Buttons. Use Pagination.
- Do not invent a PageSizeSelect or RowsInfo. Turn showPageSize and showRange on or off.

### Steps

A row of numbered steps that shows where a person is in a flow of a few steps: done, current and still to come.

Props — `steps`: `string[]`; `current`: `number`; `size`: `sm` | `md` (default `md`); `fill`: boolean (default `false`); `label`: `string`

Events — `onStepClick`

- Do not use it for page sections the person can visit in any order. Use Tabs.
- Do not use it for a single amount done. Use Meter.
- Do not put the Back and Next buttons inside it; they belong to the page.

### Tabs

A row of tabs that switches between related views in the same place.

Props — `items`: `TabItem[]`; `label`: `string`; `value`: `string`; `defaultValue`: `string`; `size`: `sm` | `md` | `lg` (default `sm`); `expand`: boolean (default `false`); `border`: boolean (default `true`)

Events — `onChange`

- Do not invent TabList, Tab, TabPanel, TabsTrigger or a local tab strip. It is one component.
- Do not use for app or page navigation. Use the side nav.
- Do not use for a small choice that applies at once, like density or List / Board. Use Segmented.

### Toolbar

The bar above a list or table: find and filter on the left, view and actions on the right, with a filter bar that opens under it.

Props — `filters`: `ReactNode`; `filterCount`: `number`; `filtersOpen`: boolean; `defaultFiltersOpen`: boolean (default `false`); `filterHelp`: `string`; `searchValue`: `string`; `searchPlaceholder`: `string`; `searchGroups`: `CommandGroup[]` { heading?: string; items: { id: string; label: string; description?: string; icon?: string }[] }; `field`: `ReactNode`; `selectedCount`: `number`; `views`: `ToolbarView[]` { id: string; label: string }; `view`: `string`; `moreActions`: `DropdownMenuEntry[]` { id: string; label: string; icon?: string; danger?: boolean } | { divider: true }; `actions`: `ReactNode`; `buttons`: `raised` | `subtle` (default `raised`); `label`: `string`

Events — `onFiltersOpenChange`, `onReset`, `onApply`, `onSearchChange`, `onSearchSelect`, `onSearchViewAll`, `onViewChange`, `onRefresh`, `onMoreSelect`

- Do not put a loose label and field, or a count of ticked rows, beside the toolbar. Pass field and selectedCount.
- Do not invent a FilterBar, ListToolbar or a local row of controls above a table.
- Do not open the filter bar when the screen loads. It starts closed; people open it with Filters, and filterCount still says the list is narrowed.

## overlay

### AlertDialog

Overlay that stops the user until they cancel or confirm.

Props — `open`: boolean; `title`: `string`; `description`: `string`; `cancelLabel`: `string`; `actionLabel`: `string`; `actionIntent`: `brand` | `danger` (default `brand`); `size`: `sm` | `md` (default `md`)

Events — `onCancel`, `onAction`

- Do not invent a local confirm dialog or use window.confirm.
- Do not put forms, tables or extra actions inside.
- Do not add a close X or close on backdrop click.

### Drawer

A panel that slides in from the right edge for a detail view or an edit form about something on the page, while the page stays in view behind it.

Props — `open`: boolean; `title`: `string`; `description`: `string`; `size`: `narrow` | `medium` | `wide` | `extended` (default `narrow`); `showClose`: boolean (default `true`); `children`: `ReactNode`; `footer`: `ReactNode`

Events — `onClose`

- Do not use it for main navigation. Use AppNav.
- Do not open a drawer from inside another drawer.
- Do not use it for a decision that must block the page. Use Modal or AlertDialog.

### Dropdown

A short list of actions or options that opens from a Button or a FilterButton.

Props — `label`: `string`; `items`: `DropdownMenuEntry[]` { id, label, description?, icon?, danger?, disabled?, selected?, checkbox?, count? }; `trigger`: `button` | `filter` | `field` (default `button`); `emphasis`: `strong` | `subtle` | `minimal` (default `subtle`); `intent`: `brand` | `neutral` | `danger` (default `neutral`); `size`: `sm` | `md` | `lg` (default `md`); `icon`: `string`; `iconOnly`: boolean (default `false`); `count`: `number`; `alignment`: `left` | `right` (default `left`); `disabled`: boolean (default `false`); `closeOnSelect`: boolean (default `true`); `open`: boolean; `multiple`: boolean (default `false`); `id`: `string`; `text`: `string`; `muted`: boolean (default `false`); `badge`: `string`; `toggle`: `on` | `off`; `labelledBy`: `string`; `describedBy`: `string`; `searchable`: boolean (default `false`); `searchPlaceholder`: `string`; `empty`: `string`; `menuWidth`: `default` | `field` (default `default`)

Events — `onOpenChange`, `onSelect`, `onToggle`

- Do not invent DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, MenuDivider, ContextMenu or Popover cousins.
- Do not use for choosing a value in a form. Use Select.
- Do not put page navigation here. Use links.

### HelpPopover

A small help panel with an optional title and a short paragraph, opened from a ? icon beside a label or setting.

Props — `title`: `string`; `content`: `string`; `position`: `above` | `below` | `left` | `right` (default `below`); `delay`: `number`; `open`: boolean; `disabled`: boolean (default `false`); `children`: `ReactElement`

- Do not invent Popover, HoverCard, InfoTip, ContextInfo or a local help panel.
- Do not use for an icon button's name. Use Tooltip.
- Do not put links, buttons or forms in it. Use Modal.

### Modal

A window over the page for a short task, a form or extra detail.

Props — `open`: boolean; `title`: `string`; `description`: `string`; `icon`: `string`; `size`: `sm` | `md` | `lg` | `xl` | `fullscreen` (default `sm`); `showClose`: boolean (default `true`); `children`: `ReactNode`; `footer`: `ReactNode`

Events — `onClose`

- Do not invent Dialog, DialogTrigger, DialogContent, ModalCard, Sheet or CommandDialog.
- Do not use for a must-choose confirm. Use AlertDialog.
- Do not put page navigation or long flows in a modal. Use a page.

### Tooltip

Brief extra text on hover or keyboard focus of one trigger.

Props — `content`: `string`; `position`: `above` | `below` | `left` | `right` (default `above`); `delay`: `number`; `open`: boolean; `disabled`: boolean (default `false`); `children`: `ReactElement`

- Do not invent Popover, HoverCard, InfoTip or a local tooltip. For a titled help panel, use HelpPopover.
- Do not put required instructions in a tooltip. Use the field's hint.
- Do not put links, buttons or forms in it. Use Modal.
