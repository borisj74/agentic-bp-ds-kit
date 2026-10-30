# Agentic BP DS — components

Every component in the library, with its closed property lists. A property value
that is not on its line does not exist: do not add a variant, a size or a colour
the list leaves out.

## base

### Avatar

Photo or initials for one person.

Props — `name`: `string`; `src`: `string`; `initials`: `string`; `size`: `xs` | `sm` | `md` | `lg` (default `md`); `shape`: `circle` | `square` (default `circle`); `decorative`: boolean (default `false`)

Always pass name. src is optional: a missing or broken photo falls back to initials from the name. A person icon shows only if there are no initials either.

- Do not invent a local Avatar.
- Do not use for status or category labels.
- Do not make Avatar clickable. Wrap it in a Button or link only with a new contract.

### AvatarGroup

Overlapping row of kit Avatars with a +N count for the rest.

Props — `label`: `string`; `size`: `xs` | `sm` | `md` | `lg` (default `md`); `shape`: `circle` | `square` (default `circle`); `max`: `number`; `items`: `AvatarGroupItem[]` { name, src?, initials? }

Use for several people on a row, card or table cell. Only kit Avatars go in the group. People past max collapse into a +N count, not another face. One person is a plain Avatar.

- Do not invent a local avatar stack.
- Do not put anything but people in the group.
- Do not use for one person. Use Avatar.

### Button

Triggers an action.

Props — `emphasis`: `strong` | `subtle` | `minimal` (default `subtle`); `intent`: `brand` | `neutral` | `danger` (default `neutral`); `size`: `sm` | `md` | `lg` (default `md`); `iconStart`: `string`; `iconEnd`: `string`; `iconSize`: `sm` | `md` | `lg` | `xl`; `iconOnly`: boolean (default `false`); `loading`: boolean (default `false`); `toggle`: boolean; `disabled`: boolean (default `false`); `fullWidth`: boolean (default `false`); `type`: `button` | `submit` | `reset` (default `button`); `children`: `ReactNode`

Pick an emphasis and an intent. Use one strong brand Button per view for the main action. Use subtle (the default) for quieter paths like cancel or back, and minimal for low-emphasis actions. Intent danger is only for work that cannot be undone. Only these pairs exist: strong with brand or danger, subtle with neutral, minimal with neutral, brand or danger. Accessibility is built in: native button, focus ring, loading and disabled states, and a label for icon-only buttons.

- Do not use for in-text navigation (use Link).
- Do not put two strong brand Buttons in one view.
- Do not pair an emphasis and an intent outside the allowed pairs (no strong neutral, no subtle brand or danger).

### ButtonGroup

Joined row of kit Buttons that share one size and act as one control cluster.

Props — `label`: `string`; `size`: `sm` | `md` | `lg` (default `md`); `disabled`: boolean (default `false`); `children`: `Button[]`

Use a group for related actions that share one size, like a view switch, a cancel and save pair, or a toolbar. The group sets size and disabled for every Button inside it. Only kit Buttons go in a group.

- Do not invent a local button group or segmented control.
- Do not mix sizes inside one group.
- Do not put more than one strong brand Button in a group or the view.

### FilterButton

Filter chip for lists and tables: shows the filter name or its chosen value, opens its options, and turns an applied filter on or off.

Props — `size`: `sm` | `md` | `lg` (default `md`); `open`: boolean (default `false`); `disabled`: boolean (default `false`); `count`: `number`; `value`: `string`; `toggle`: `on` | `off`; `hasDropdown`: boolean (default `true`); `children`: `string`

Events — `onToggle`, `onClick`

Use FilterButton for filter controls above tables and lists, like Status or Owner, and in the Toolbar filter bar. To open options, use Dropdown with trigger filter: it renders this button and opens the menu. Nothing set: one quiet outline with the chevron; the whole button opens the options. Once a filter is set (value or count) it turns blue; with onToggle it splits in two: the name turns the filter on or off (off keeps the selection, drawn dashed) and the chevron opens the options. hasDropdown false makes a plain on/off chip.

- Do not invent a local split button, filter chip or dropdown trigger. Use Dropdown trigger=filter for the menu.
- Do not use for page actions or view switches. Use Button or a Dropdown.
- Do not put more than one word or two in the name.

### Icon

Draws one Material Symbols Outlined glyph at a kit size, colored by the parent text color or a semantic icon role.

Props — `name`: `string`; `size`: `xs` | `sm` | `md` | `lg` | `xl` (default `md`); `intent`: `inherit` | `neutral` | `subtle` | `brand` | `info` | `success` | `warning` | `danger` (default `inherit`); `filled`: boolean (default `false`); `label`: `string`

Use Icon for every glyph. Pick a size from the scale and an intent from the semantic roles. Pass a label only when the icon means something on its own.

- Do not inline SVGs or emoji.
- Do not size with custom px; use size enum.

## brand

### Illustration

A piece of drawn artwork from the product, like the picture over an empty page.

Props — `name`: `ai-chip` | `chat-search`; `size`: `sm` | `md` | `lg` (default `md`); `animated`: boolean (default `false`); `label`: `string`

Use Illustration where a screen needs a drawn picture rather than an icon or a logo: the art over an EmptyState, or the opening of an assistant panel. It is one component: pass name for the artwork and size for how big it is drawn. animated sets the art moving where the movement says something, like the glass walking over the message while the assistant waits for a first question; it is still by default, and stops for anyone who asks for less motion. The art carries the brand colors of the drawing itself, so it does not change with the theme. It is decorative by default and hidden from screen readers; pass label only when the picture is the only thing saying what the block is about. New artwork joins the name list here; do not paste an SVG into a screen.

- Do not paste an SVG into a screen or a pattern. Add the artwork here instead.
- Do not use it for an icon. Use Icon.
- Do not use it for the product mark. Use Logo or LogoAI.

### Logo

Brand logo: the full wordmark or the mark alone, in fixed brand colors.

Props — `type`: `default` | `symbol` (default `default`); `label`: `string`

Use the default wordmark in app headers and sign-in screens. Use the symbol alone where space is tight, like a collapsed sidebar. Brand colors are fixed and never follow the theme tokens. In dark theme the wordmark text switches to the white reverse; the mark never changes.

- Do not recolor, retint or tokenize the logo. Brand colors are fixed.
- Do not redraw it, use an image of it, or paste the SVG into a screen. Use this component.
- Do not stretch or resize it with custom px.

### LogoAI

AI logo for AI features: full logo or icon, in fixed brand colors.

Props — `type`: `default` | `symbol` (default `default`); `intent`: `color` | `monochrome` | `white` | `filled` (default `color`); `label`: `string`

Use LogoAI to mark AI features, like an assistant panel header or an AI suggestion. Use Logo for the product brand itself. color is the default. Use white on dark or photo backgrounds, monochrome where color is not allowed, and filled for a stand-alone tile. In dark theme the AI text of the color logo switches to white.

- Do not recolor, retint or tokenize the logo. Brand colors are fixed.
- Do not redraw it, use an image of it, or paste the SVG into a screen.
- Do not stretch or resize it with custom px.

## data

### BarChart

Values side by side as bars, one group or stack per category, like invoices by status for each week.

Props — `label`: `string`; `title`: `string`; `subtitle`: `string`; `showHeader`: boolean (default `true`); `categories`: `string[]`; `series`: `ChartSeries[]` { name: string; values: number[]; intent?: ChartIntent; projectedFrom?: number; axis?: "start" | "end" }; `orientation`: `vertical` | `horizontal` (default `vertical`); `highlight`: `number | number[]`; `highlightIntent`: `green` | `olive` | `cyan` | `orange` | `pink` | `gray` | `purple` | `yellow` | `red` | `mint` (default `orange`); `stacked`: boolean (default `false`); `barWidth`: `wide` | `thin` (default `wide`); `showValues`: boolean (default `false`); `showGrid`: boolean (default `true`); `showLegend`: boolean (default `true`); `legendPosition`: `top` | `bottom` | `end` (default `bottom`); `animate`: boolean (default `true`); `format`: `number` | `currency` | `percent` (default `number`); `currency`: `string`; `height`: `number`; `emptyLabel`: `string`; `referenceLines`: `ChartReferenceLine[]`; `marker`: `ChartMarker` { category: number; label: string }; `selected`: `number | null`

Events — `onSelectedChange`

Use BarChart to compare amounts across categories or periods. It is one component: pass categories and series. orientation vertical puts the categories along the bottom with bars standing up; horizontal lists them down the start with bars running across, best for long names or ranked lists like top customers. Bars sit side by side per category, or on top of each other with stacked, so the bar height is the total and the colors are its parts. barWidth thin draws 8px bars with rounded ends, for a long run of periods like a month of daily use. showValues writes each value at the end of its bar. On an upright chart, a grant, limit or target goes in referenceLines, a dashed line across the chart with its label and value at the end, drawn over the bars so it stays visible where they pass it; give that line values, one level per category, when it changes during the period and it steps instead. A forecast stays in the same series: projectedFrom names its first forecast category, and its bars draw see-through from there. marker draws a thin line down the chart at one category, like Today. A horizontal chart ignores all three. Hover or use the arrow keys for a tooltip with every series in that category. Pass selected and onSelectedChange to let people click a bar to pick that category, like a day in a daily chart, so the screen can show its details below. The pick follows the chart's categories (hour, day, week, period). Keep a visible way to clear it near what it filters, like a Show the whole period button. animate lets bars grow out from the baseline. Put the chart's title and report link in the Section or Card around it. ChartIntent: green | olive | cyan | orange | pink | gray | purple | yellow | red | mint (the kit category colors). title and subtitle write a heading over the chart; showHeader turns it off when the Card around it already says the same. highlight picks out one or more bars in the highlight intent, like the biggest and smallest in a ranked list. The keys under the chart are the kit Legend; legendPosition moves them over it or beside it. A legend beside the chart drops under it when the chart's own box is narrower than 360px.

- Do not use it for a long, smooth trend. Use LineChart.
- Do not use it for one share of a total. Use PieChart.
- Do not draw charts with loose SVG or a chart library. Use the kit charts.

### Calendar

A full calendar of events by month, week, day or as a list, where people browse dates, filter calendars and add, edit or delete events.

Props — `label`: `string`; `events`: `CalendarEvent[]`; `defaultEvents`: `CalendarEvent[]`; `calendars`: `CalendarSource[]` { id: string; name: string; intent?: CalendarIntent; hidden?: boolean }; `view`: `month` | `week` | `day` | `list`; `defaultView`: `month` | `week` | `day` | `list` (default `month`); `views`: `CalendarView[]`; `date`: `string`; `defaultDate`: `string`; `weekStart`: `sunday` | `monday` (default `sunday`); `startHour`: `number`; `readOnly`: boolean (default `false`)

Events — `onEventsChange`, `onEventClick`, `onViewChange`, `onDateChange`

Use Calendar for schedules: shifts, PTO, billing runs, meetings. It is one component: pass events and, if events belong to calendars, calendars. The toolbar has a month picker, New event, previous and next, Today, Calendars (show or hide each calendar) and a Month / Week / Day / List switch. Month shows up to 3 events a day, then +N more; Week and Day show all-day events in a row on top and timed events on an hourly grid that scrolls, side by side when they overlap, with a line at the current time; List shows the week's events by day. Click an empty day or time, or New event, to open a drawer with the event form; click an event to edit or delete it. With events it is controlled (save changes in onEventsChange); with defaultEvents it keeps changes itself. readOnly turns creating and editing off. Dates are local ISO strings: 2024-10-09 for all-day, 2024-10-09T08:30 for timed. CalendarIntent: green | olive | cyan | orange | pink | gray | purple | yellow | red | mint (the kit category colors).

- Do not use it to pick one date or a range in a form. Use DatePicker.
- Do not use it for a timeline of one record's history or a list of due dates. Use Table.
- Do not build a local month grid, week grid or event chip. Use Calendar.

### Card

One item in a grid or list of options people compare and pick, like a proposal line, product or plan: title, details, a price and a status note, with an optional image and a select checkbox.

Props — `title`: `string`; `overline`: `string`; `badge`: `string`; `badgeIntent`: `BadgeIntent`; `description`: `string`; `amount`: `string`; `message`: `string`; `messageIntent`: `success` | `warning` | `danger` | `info` (default `success`); `image`: `string`; `imageAlt`: `string`; `icon`: `string`; `selectable`: boolean (default `false`); `selected`: boolean; `defaultSelected`: boolean (default `false`); `disabled`: boolean (default `false`); `href`: `string`; `actions`: `CardAction[]` { id: string; label: string; icon: string }; `menu`: `DropdownMenuEntry[]`

Events — `onSelectedChange`, `onClick`, `onAction`

Use Card for items people scan side by side and often pick from. It is one component: pass the parts you need as props; every part is optional (header, badge, overline, title, description, amount, message, image, footer). The header row holds a badge and an overline, like a request code. description is two lines at most. amount is the price or key number. message is a short status line with an icon, colored by messageIntent. image shows a photo tile at the top right, or icon an icon tile. selectable adds a footer checkbox; clicking anywhere on the card toggles it, and the selected card turns blue. disabled greys the card out. href or onClick make the card open what it shows, like an account in a card view of a list: the title becomes the one link, its hit area covers the whole card, hover lifts the card and keyboard focus rings it. A card either opens something or is picked, not both. Lay cards out with the layout grid classes. actions and menu put the record's actions at the end of the footer, beside the checkbox: the ones it is used for as icon buttons, the rest behind More. Give a Card the same actions as the record's Table row and ListView row, so switching views never changes what can be done.

- Do not build a card from a div with a border, or add a ProductCard, ProposalCard or CardFooter. Use Card.
- Do not use it for page sections. Use Section.
- Do not use it for key numbers. Use Scoreboard.

### Cell

Content for one table cell: text, a number, a date, a link, a redirect to another page, a person, a file, a status, a trend, progress, a switch, row actions or a row menu, a tree row, with an optional row checkbox.

Props — `type`: `text` | `link` | `avatar` | `avatarGroup` | `file` | `payment` | `badge` | `badges` | `trendPositive` | `trendNegative` | `progress` | `actions` | `actionIcons` | `actionMenu` | `checkbox` | `tree` | `number` | `date` | `status` | `switch` | `popupTrigger` | `textBlock` | `redirect` (default `text`); `size`: `sm` | `md` (default `md`); `alignment`: `start` | `center` | `end` (default `start`); `text`: boolean (default `true`); `checkbox`: boolean (default `false`); `label`: `string`; `href`: `string`; `name`: `string`; `src`: `string`; `people`: `CellPerson[]` { name, src? }; `icon`: `string`; `intent`: `BadgeIntent`; `badges`: `CellBadge[]` { label, intent? }; `value`: `string | number`; `actions`: `CellAction[]` { label, icon?, emphasis?, intent?, onClick? }; `menu`: `CellAction[]`; `checked`: boolean; `defaultChecked`: boolean; `level`: `number`; `expanded`: boolean; `showLines`: boolean (default `true`); `treeToggle`: `chevron` | `box` (default `box`)

Events — `onClick`, `onCheckedChange`, `onExpandedChange`

Use Cell inside table cells to show one kind of value consistently. Pick the type from the data: text for plain values, number for amounts and counts (end-aligned, even-width digits), date for a day, textBlock for a note that wraps over several lines (md only), link to open a record, redirect to go to another page in the app (brand link text with an outward arrow), popupTrigger for grey underlined text with an open_in_full mark that opens a popup the screen owns, avatar for a person, badge for status, status for a coloured dot and a label, trend for change, progress for how far along something is, actions for row buttons, actionMenu for a More menu, switch to turn a row setting on or off right away, checkbox for a column with only the row Checkbox, tree for the first cell of parent and child rows (an indent per level, faint guide lines and the outlined plus or minus square to open and close its children; treeToggle chevron swaps the square for a chevron button). Cell composes kit Avatar, AvatarGroup, Badge, Button, ButtonGroup, Checkbox, Dropdown, Icon, Link, Meter and Switch; it never draws its own. Pair with HeaderCell for column titles. With actionIcons, menu puts the row's remaining actions behind one More button at the end. In a box narrower than 640px, the kit's mobile break, the icon buttons fold into that More menu and the cell keeps one button, so the row's own values get the width; only one of the two is in the layout, so nothing is reached twice by the keyboard.

- Do not invent a local table cell, Tag, Trend, FileIcon, PaymentMethod or ActionCell.
- Do not draw a progress bar in a cell. Use type progress; it is a kit Meter.
- Do not use Badge for trends. Use a trend type.

### ChatMessage

One turn in a chat with the assistant: what the person asked, or what the assistant answered, with its workings, buttons and suggestions.

Props — `author`: `user` | `assistant`; `text`: `string`; `children`: `ReactNode`; `bubble`: boolean; `status`: `string`; `sections`: `ChatMessageSection[]` { id, label, count?, content, defaultOpen? }; `actions`: `ChatMessageActionId[]`; `pressed`: `ChatMessageActionId[]`; `suggestions`: `ChatSuggestion[]` { id, label }; `menu`: `DropdownMenuEntry[]`; `person`: `{ name?: string; src?: string; initials?: string }`; `label`: `string`

Functions — `apply`

Events — `onAction`, `onSuggestion`, `onMenuSelect`

Use ChatMessage for each turn in an assistant panel. It is one component: pass author user or assistant. A person's turn sits on the right in a grey bubble with their avatar, and can carry a More menu for Edit and Copy. The assistant answers on the left under the AI mark, in a brand bubble of its own; pass bubble false for a long answer that should run as plain text down the panel. status shows the bubble glowing while it works, like Analyzing your request. sections opens its workings, like Reasoning 1 and Tool References 2. actions draws the row of buttons at the very bottom of an answer (copy, good work, needs work, share, read aloud), after the workings and the suggestions, never above the answer, and pressed keeps the one that was picked lit. suggestions writes what to ask next, each one a kit Button that sends itself, lined up on the left under the answer. apply adds one action under an assistant answer that uses it where it was asked, like Insert into formula writing a suggested formula into the field the assistant is attached to.

- Do not build a bubble from your own divs, or add a ChatBubble, MessageRow or AiAvatar. Pass the props.
- Do not use it for an alert or a system notice. Use Callout or Toast.
- Do not put more than one action row on a turn.

### DataGrid

An editable table: people click a cell to add or change its content, like rule conditions, line items or mappings.

Props — `columns`: `DataGridColumn[]`; `rows`: `DataGridRow[]` { id: string; [key: string]: string }; `defaultRows`: `DataGridRow[]`; `size`: `sm` | `md` (default `md`); `line`: `medium` | `thin` (default `medium`); `rowNumbers`: boolean (default `true`); `canAddRows`: boolean (default `false`); `canRemoveRows`: boolean (default `false`); `canDeleteRows`: boolean (default `false`); `canInsertRows`: boolean (default `false`); `selectable`: boolean (default `false`); `selected`: `string[]`; `defaultSelected`: `string[]`; `rowLabel`: `string`; `emptyLabel`: `string`; `label`: `string`; `stickyFirstColumn`: boolean (default `true`); `expanded`: `string[]`; `defaultExpanded`: `string[]`; `collapsed`: `string[]`; `defaultCollapsed`: `string[]`; `totalRow`: `DataGridRow`; `legend`: `DataGridLegendItem[]` { intent: "success" | "warning" | "danger" | "info" | "neutral"; label: string; icon?: string }

Functions — `deleteConfirm`, `actionsFor`, `detail`, `detailCount`, `rowParent`, `cellStatus`, `cellReadOnly`, `cellLink`

Events — `onRowsChange`, `onDeleteRow`, `onSelectionChange`, `onExpandedChange`, `onCollapsedChange`, `onCellLink`

Use DataGrid when people enter or change data in rows, not just read it. It is one component: pass columns and rows as data. Each column has a type: text and number cells edit in place with a kit Input, select cells are a kit Select, formula cells open a kit FormulaEditor in the cell, date cells are a kit DatePicker, and readOnly columns only show. Click a cell or press Enter to edit; Enter or leaving the cell saves, Escape cancels, Tab moves to the next cell. rowNumbers adds a # column. canAddRows adds an Add row button under the grid; canInsertRows, canRemoveRows and canDeleteRows each add a button to the action column at the end of every row, in that order: + adds an empty row under this one, X takes the row out of this grid, and the trash deletes the record everywhere it is used. Two stand on the row and any after that go in a More menu at the end, so with all three on, Delete is in the menu. Keep remove and delete apart: a row people only meant to take off a quote is removed, not deleted. Delete asks first in a kit AlertDialog and only then calls onDeleteRow. actionsFor picks, row by row, which of those a row shows, so a saved row can carry the trash and a row added since the X. selectable adds a checkbox column at the start, with select-all in the header, for actions on several rows at once. Columns are at least 160 wide unless they hug. The first column (and #) stays pinned when the grid scrolls sideways. setForAll on a column adds a Set for all menu under its title. detail makes rows expandable, with settings or sub-rows under each row. Inside a Form with columns, the grid spans the row, and with start labels it starts at the section's edge, since its column headers stand in for a label. For read-only lists use Table.

- Do not use it to show data people only read. Use Table.
- Do not invent an EditableCell, GridRow or a table of loose inputs. Pass columns with a type.
- Do not put loose checkboxes beside the grid to pick rows. Pass selectable.

### HeaderCell

Column title for a data table: uppercase label, optional select-all checkbox, optional sort, with a brand-faint bottom border, 2px or 1px.

Props — `label`: `string`; `size`: `sm` | `md` (default `md`); `alignment`: `start` | `center` | `end` (default `start`); `line`: `medium` | `thin` (default `medium`); `checkbox`: boolean (default `false`); `checked`: boolean; `defaultChecked`: boolean; `indeterminate`: boolean (default `false`); `sortable`: boolean (default `false`); `sort`: `none` | `asc` | `desc` (default `none`)

Events — `onCheckedChange`, `onSort`

Use HeaderCell inside th scope=col, one per column, above Cell rows. Match its size to the Cell size so side padding lines up. Use alignment end for number columns and center for a checkbox-only or actions column. HeaderCell composes kit Checkbox and Icon.

- Do not invent a local th, TableHeader, ColumnTitle or SortButton.
- Do not use Cell for column titles, or HeaderCell in body rows.
- Do not mix HeaderCell and Cell sizes in one table.

### Legend

The key to a drawing: a small colour mark per name, so people can read what each colour means.

Props — `items`: `LegendKey[]` { id?, label, intent?, value?, shape?, strong? }; `orientation`: `horizontal` | `vertical` (default `horizontal`); `alignment`: `start` | `center` | `end` (default `center`); `shape`: `square` | `line` | `dot` | `outline` (default `square`); `size`: `sm` | `md` (default `md`); `hidden`: `string[]`; `defaultHidden`: `string[]`; `label`: `string`; `decorative`: boolean (default `false`)

Events — `onHiddenChange`

Use Legend as the key to anything drawn in the chart colours. The kit charts already draw one inside, so reach for it on its own when the key sits somewhere else: over a group of charts that share their colours, beside a map, or under a colour-coded bar. It is one component: pass items. orientation runs the keys across or down, shape picks a square, a line, a dot or an outline, and value writes a number after each name. An outline key is the empty box, for what is left rather than used — a usage bar keys what is still to spend that way beside its filled parts — and it takes no intent. A key with strong takes the strong step of its colour, for a darker part of the same colour as the whole it came out of. With onHiddenChange the keys become buttons that switch a series off, and it tells you which are off so you can drop them from your data.

- Do not add a second legend under a kit chart; the chart draws its own. Use showLegend and legendPosition to place it.
- Do not use it as a list of filters or tags. Use Badge or FilterButton.
- Do not write the colour yourself; pick an intent.

### LineChart

How values change over time as lines or filled areas, one per series, like revenue by month or invoices approved by day.

Props — `label`: `string`; `title`: `string`; `subtitle`: `string`; `showHeader`: boolean (default `true`); `categories`: `string[]`; `series`: `ChartSeries[]` { name: string; values: number[]; intent?: ChartIntent; projectedFrom?: number }; `area`: boolean (default `false`); `stacked`: boolean (default `false`); `showPoints`: boolean (default `false`); `showValues`: boolean (default `false`); `showGrid`: boolean (default `true`); `showLegend`: boolean (default `true`); `legendPosition`: `top` | `bottom` | `end` (default `bottom`); `animate`: boolean (default `true`); `format`: `number` | `currency` | `percent` (default `number`); `currency`: `string`; `height`: `number`; `emptyLabel`: `string`; `referenceLines`: `ChartReferenceLine[]` { value: number; label: string; intent?: ChartIntent; values?: number[]; note?: { at: number; label: string } }; `marker`: `ChartMarker` { category: number; label: string }

Use LineChart for trends across ordered categories, usually time. It is one component: pass categories (the labels along the bottom) and series (one values array each). area fills under each line; stacked piles the areas on each other so the top edge is the total, like invoices by severity. showPoints marks each value with a dot and showValues writes it above. A limit or target goes in referenceLines, a dashed line across the chart with its label and value at the end. A forecast stays in the same series: projectedFrom names its first forecast category, and the line turns dashed from there. marker draws a thin line down the chart at one category, like Today. Hover or use the arrow keys for a tooltip with every series at that point. animate plays a subtle draw-in. Put the chart's title and report link in the Section or Card around it. ChartIntent: green | olive | cyan | orange | pink | gray | purple | yellow | red | mint (the kit category colors). title and subtitle write a heading over the chart; showHeader turns it off when the Card around it already says the same. The keys under the chart are the kit Legend; legendPosition moves them over it or beside it. A legend beside the chart drops under it when the chart's own box is narrower than 360px. A reference label keeps clear of the marker's line and label, other reference labels and the points near the end of a line: it moves to the other side of its line, or slides left, rather than drawing over them.

- Do not use it for categories without an order, like regions. Use BarChart.
- Do not use it for one share of a total. Use PieChart.
- Do not fake a limit or target with an extra series. It shows in the legend, the tooltip and the table as data. Use referenceLines.

### ListView

A list of records, one a row: a primary and a secondary line with an avatar, icon or image before them, and badges, actions, a chevron or a drag handle after, grouped under headers when the list is long, and stepping into nested lists in place.

Props — `label`: `string`; `items`: `ListViewItem[]` { id, primary, secondary?, group?, avatar?, icon?, image?, badge?, badgeIntent?, badgePosition?, unread?, message?, messageIntent?, actions?, disabled?, children?, menu? }; `groups`: `ListViewGroup[]` { id: string; title: string }; `size`: `sm` | `md` | `lg` (default `md`); `collapsible`: boolean (default `false`); `stickyGroups`: boolean (default `false`); `collapsed`: `string[]`; `defaultCollapsed`: `string[]`; `selection`: `none` | `single` | `multiple` (default `none`); `selected`: `string[]`; `defaultSelected`: `string[]`; `interaction`: `none` | `drill` | `drag` (default `none`); `path`: `string[]`; `defaultPath`: `string[]`; `nesting`: `step` | `expand` (default `step`); `expanded`: `string[]`; `defaultExpanded`: `string[]`; `detail`: `ReactNode`

Events — `onItemsChange`, `onCollapsedChange`, `onSelectedChange`, `onOpen`, `onAction`, `onPathChange`, `onExpandedChange`

Use ListView when each record reads best as a line or two of text rather than as columns: people, invoices, messages, tasks, files. It is one component: pass items, each with an id and primary text, and optional secondary text. avatar (a name, shown as initials in a square), icon or image goes before the text; badge adds a status Badge at the end, or before the text with badgePosition start; unread puts a brand dot at the start; message adds a status line under the text; actions adds icon buttons at the end and menu puts the rest behind a More button, so a row offers the same actions as the record's Table row and Card. selection single makes a click pick one row (a light blue band between brand lines); multiple adds a checkbox to each row. interaction drill ends each row in a chevron and calls onOpen, for rows that go to a record page; drag adds a drag handle that is also a Move menu, and Alt with the arrows moves the focused row, calling onItemsChange with the new order. groups splits the list under headers: give each item a group id. size sets the header text, collapsible lets headers fold their rows away, and stickyGroups keeps each header at the top of the scrolling box while its rows pass under it. A row with children steps into its own list in place: a chevron at the end, and a click swaps the list for that row's children under a header with Back and the row's name, one level at a time, for records that hold records, like an account's invoices. With nesting expand, the children open right under the row instead, indented, like a tree. detail shows the picked record under its row, inside the list. path, defaultPath and onPathChange say which level is on screen. To show a picked record beside the list rather than going to its page, put the ListView in the ListDetail pattern. Rows are spaced like a kit Table: inset 12 at every width, the checkbox takes only its own width, and the text starts 24 after it, so a ListView and a Table of the same records line up when a screen switches between them. For columns of values that people compare use Table; for a short set of links use LinkList.

- Do not use it for values people compare across columns. Use Table or DataGrid.
- Do not use it for a short set of links. Use LinkList.
- Do not nest deeper than three levels, or use it for a tree people need to see at once. Use TreeView.

### NavTile

A way in to somewhere: the name of a place, a line about what is in it, and a colored icon square.

Props — `title`: `string`; `description`: `string`; `icon`: `string`; `intent`: `brand` | `green` | `olive` | `cyan` | `orange` | `pink` | `gray` | `purple` | `yellow` | `red` | `mint` (default `brand`); `href`: `string`; `disabled`: boolean (default `false`)

Events — `onClick`

Use NavTile for the doors on a landing page: a settings home, a reports home, the start of a job. It is one component: title names the place, description says in one line what is inside, icon and intent draw the 72px square, and href or onClick is where it goes. Give each tile in a grid its own intent so people learn the colors; intent takes the kit category colors, not a color of your own. Lay a set of them out with the.layout-metrics class from `02-tokens.md`, never a grid of your own. It is a link, not a choice: if people are comparing options and picking one, that is a Card.

- Do not use it to compare or pick options; that is Card.
- Do not put buttons or fields inside it. The whole tile is one link.
- Do not give a grid of tiles one intent; give each its own so the colors mean something.

### PieChart

How a whole splits into a few parts, as a donut or a solid pie, like payments by method.

Props — `label`: `string`; `title`: `string`; `subtitle`: `string`; `showHeader`: boolean (default `true`); `data`: `PieChartSlice[]` { label: string; value: number; intent?: ChartIntent }; `donut`: boolean (default `true`); `size`: `sm` | `md` | `lg` (default `md`); `showTotal`: boolean (default `true`); `totalLabel`: `string`; `showLegend`: boolean (default `true`); `legendPosition`: `end` | `bottom` (default `end`); `alignment`: `start` | `center` (default `start`); `maxSlices`: `number`; `otherLabel`: `string`; `animate`: boolean (default `true`); `format`: `number` | `currency` | `percent` (default `number`); `currency`: `string`; `emptyLabel`: `string`

Use PieChart for the share of a total across a handful of parts. It is one component: pass data, one entry per slice. Slices go largest first from the top, clockwise; past maxSlices the rest merge into one grey Other slice. donut (the default) leaves a hole with the total in it; turn it off for a solid pie. The legend lists each part with its percent, beside the chart or under it. alignment center keeps the pie and a legend beside it together in the middle of a wide box. Hover or use the arrow keys for a tooltip with the value. animate sweeps the slices in. ChartIntent: green | olive | cyan | orange | pink | gray | purple | yellow | red | mint (the kit category colors). title and subtitle write a heading over the chart; showHeader turns it off when the Card around it already says the same. A legend beside the chart drops under it when the chart's own box is narrower than 360px.

- Do not use it for many parts or values over time. Use BarChart or LineChart.
- Do not switch the legend to bottom only to centre the chart. Use alignment center.
- Do not use it to compare parts that don't add up to a whole.

### Scoreboard

A strip of key numbers at the top of a screen, like open invoices, revenue or overdue amount, each with an optional trend and spark chart.

Props — `items`: `ScoreboardItem[]`; `selectable`: boolean (default `false`); `selected`: `string | null`; `defaultSelected`: `string | null`; `scroll`: boolean (default `true`); `label`: `string`

Events — `onSelectedChange`

Use Scoreboard for the 3 to 6 numbers that sum up a screen. It is one component: pass items as data. Each item is a card with a title, the metric, and optional badge, metadata line, trend (arrow, value and unit, colored by status) and spark chart (a small line drawn from points). Cards share the width and run side by side with no gap; every card but the last has a thin line down its right side, the full height of the card. selectable turns each card into a button: picking one marks it selected, like a filter for the list below, and picking it again clears it. Past four cards the Scoreboard puts itself in a Conveyor, so arrows at both ends move the row; the arrows show only when the cards do not fit. On a box narrower than 640px, the kit's mobile break, the cards take a smaller minimum so two are in view, the strip snaps card by card, and the Conveyor's arrows give way to swiping.

- Do not build a metric row from your own divs or cards, or add a MetricCard, ScoreCard or Sparkline. Pass items.
- Do not use the chart as a real chart; it only shows the shape of the trend. Use a chart for readable data.
- Do not pair direction none with a success or danger status.

### Table

A semantic table of rows and columns, like invoices or accounts, with optional row selection, a caption and a total.

Props — `columns`: `TableColumn[]`; `rows`: `TableRow[]` { id?: string; [key: string]: ReactNode }; `size`: `sm` | `md` (default `md`); `line`: `medium` | `thin` (default `medium`); `caption`: `string`; `footer`: `TableFooter` { label: string; value: ReactNode }; `emptyLabel`: `string`; `selectable`: boolean (default `false`); `selected`: `string[]`; `defaultSelected`: `string[]`; `rowLabel`: `string`

Functions — `detail`, `detailCount`

Events — `onSelectionChange`, `onRowClick`

Use Table for lists of records. It is one component: pass columns and rows as data. Headers are kit HeaderCells; string and number values become text Cells, and anything richer is a kit Cell you put in the row (badge, avatar, link, actionMenu). Number columns take numeric, which aligns them to the end with even digits. selectable adds a checkbox column: each row gets a checkbox Cell and the header a select-all that shows a dash when only some rows are picked. The caption sits under the grid; footer holds a total in the last column. With no rows, one cell spans the columns and shows emptyLabel. Search, filters and actions belong in a Toolbar above it. Every cell keeps its value on one line at any width, so a name, a contract, a date or an amount never wraps down its cell. While the table fits its box it has no scroll of its own, and its column names hold at the top of the page while the rows pass under them: how far down they stop is set by whatever is pinned above, which a pattern holding the table says in --table-stick-top. When the columns need more room than the box has, the box itself takes the sideways scroll — the page never slides — and the first column, which names the row, freezes against the start edge while the rest of the row slides under it; with selectable, the checkbox column freezes with it, so a row can still be ticked while it is read. That is a trade rather than a setting: a cell can only hold still against whatever scrolls, so once the box scrolls, the names hold at the top of the box rather than at the top of the page. For parent and child rows, put a Cell type tree in the first column and list only the rows whose parents are open.

- Do not invent TableHeader, TableRow, TableCell or a local grid of divs. Pass columns and rows.
- Do not draw cell content yourself. Use kit Cell types for badges, people, links and row actions.
- Do not put search or filters in the table. Use a Toolbar above it.

### Timeline

What happened on a record, newest first: a circled icon per entry joined by a line, with the note, links and action for each one.

Props — `items`: `TimelineItem[]` { id, title, timestamp?, subtitle?, icon?, intent?, notes?, links, action?, menu? }; `size`: `sm` | `md` (default `md`); `label`: `string`

Events — `onMenuSelect`

Use Timeline for the activity on a record: calls, emails, notes, status changes, an audit trail. It is one component: pass items as data. Each item has a title, and optional timestamp, subtitle, icon, intent, notes, links and one action, plus a More menu of kit Dropdown entries. The line joins the entries and stops at the last one. Keep the order you want to show, usually newest first. For steps in a flow, use Steps. For a list of records, use Table.

- Do not build a feed from your own divs, or add a TimelineItem, ActivityCard or FeedRow. Pass items.
- Do not use it for steps in a flow. Use Steps.
- Do not use it for a list of records people sort and filter. Use Table.

### TreeView

A nested list people open and close level by level, like teams in an organization, project folders or account hierarchies, to pick, check or reorder items.

Props — `label`: `string`; `items`: `TreeItem[]` { id: string; label: string; icon?: string; disabled?: boolean; children?: TreeItem[] }; `defaultItems`: `TreeItem[]`; `selection`: `none` | `single` | `multiple` (default `single`); `selected`: `string[]`; `defaultSelected`: `string[]`; `expanded`: `string[]`; `defaultExpanded`: `string[]`; `showIcons`: boolean (default `false`); `showLines`: boolean (default `true`); `reorderable`: boolean (default `false`); `size`: `sm` | `md` | `lg`

Events — `onItemsChange`, `onSelectedChange`, `onExpandedChange`

Use TreeView for data that nests: folders and files, an org chart, parent and child accounts, product categories. It comes in two looks from one component: simple (chevrons and guide lines, one row selected) and advanced (selection multiple, showIcons and reorderable: checkboxes, folder icons and drag handles). It is one component: pass items, each with an id, a label and, for a folder, children. Chevrons open and close folders; faint guide lines join each level to its parent (showLines). selection single highlights one row (clicking a folder also opens it); multiple adds a checkbox to each row that checks a folder's whole branch and shows a dash when only part of it is checked; none only opens and closes. showIcons adds a folder or file icon (or the item's own). reorderable adds a drag handle: drag a row above or below another, or onto a folder to move it inside. The handle is also a button that opens a Move menu (up, down, into the folder above, out of its folder), so nothing needs dragging. Alt with the arrow keys makes the same moves on the focused row, and Shift+F10 opens the menu. Items, selection and open folders can each be controlled or left to the tree.

- Do not use it for a flat list. Use Table, Select or RadioGroup.
- Do not use it for main app navigation. Use AppNav.
- Do not use it for sections of one page that open and close. Use Accordion.

### UsageBar

One bar for everything available in a period, split into the parts it is made of: what each part used, what is left, and anything spent past the allowance.

Props — `segments`: `UsageBarSegment[]` { id, value, kind?, intent?, label?, note?, recent?, legend? }; `figures`: `UsageBarFigure[]` { value, label, at, intent? }; `showLegend`: boolean (default `true`); `label`: `string`

Use UsageBar when a single allowance comes from more than one source and people need to see, in one line, where it went and how much is left — free credits, a plan and a top-up, say. It is one component: pass segments, each with an id, a value and a kind. kind "used" takes a chart intent and draws in that colour; kind "left" is the empty track and takes no intent; kind "outside" is what was spent past the allowance: it follows the last part of the allowance, draws red, and is not counted in what the bar measures. Its colour, its caption and its legend key say it is past the end, so nothing else marks where the allowance ran out. A segment with recent true draws as a darker sliver of the same intent right after its part, for the last hour, day or week; give it a legend and it takes its own key in that darker colour, as the hourly bar does with Used in the last hour. Each part can carry a label and a note, written under it as wide as the part; a part too narrow for its own caption leaves it out. figures writes up to three numbers above the bar, in the kit display type, — at "start", at "left" (the first part that is left) and at "end", right-aligned — each with a small line under it, and each able to take a warning or danger intent. The legend under the bar is the kit Legend, one key per used intent plus Left to use, keyed as an outline rather than a colour, and, when there is one, Over the allowance; turn it off with showLegend false. label names the bar for screen readers. Put it in a Section or Card, which gives it its title; the bar draws no box of its own.

- Do not use it for one limit with one number. Use Meter, or UsageList for several limits each with their own bar.
- Do not use it to compare periods or trends. Use BarChart or LineChart.
- Do not build it from a stacked BarChart with text under it, and do not add a local cousin like SegmentedBar or AllowanceBar.

### UsageList

A list of usage limits, one a row: the limit's name, how much is used of it, a bar, and a short note, like API calls, storage and seats on a plan.

Props — `items`: `UsageListItem[]` { id, label, used, limit, unit?, note? }; `label`: `string`

Use UsageList to show how much of each limit is used, like a plan or account usage panel. It is one component: pass items, each with an id, a label, used and limit, and optionally a unit and a note. Each row writes used of limit, like 8,420 of 10,000 or 32 of 50 GB, over a kit Meter bar. The bar is blue, turns amber at 80% of the limit and red at 100%; at those points a warning or error icon sits before the numbers and screen readers hear Almost at limit or Limit reached. Use over the limit is shown as it is, like 12 of 10, with a full red bar. note adds a quieter line under the bar, like Resets on Oct 1. Put it in a Section or Card, which gives it its title; the list draws no box of its own. label names the list for screen readers, like Plan usage.

- Do not build usage rows from a Table with a Meter column, or from loose bars and text. Use UsageList.
- Do not use it for task progress, like an upload or a setup checklist. Use Meter or Steps.
- Do not use it to compare records across columns. Use Table.

## feedback

### Badge

Short status or category label.

Props — `intent`: `neutral` | `hollow` | `info` | `success` | `warning` | `danger` | `highlight` (default `neutral`); `emphasis`: `subtle` | `strong` | `faint` (default `subtle`); `size`: `sm` | `md` | `lg` (default `sm`); `icon`: `string`; `iconOnly`: boolean (default `false`); `removable`: boolean (default `false`); `disabled`: boolean (default `false`); `children`: `string`

Events — `onRemove`

Use Badge for status on rows and cards, and for category or filter labels. Pick the intent from meaning and the emphasis from how loud it should be: subtle is the default, strong for the one thing that must stand out, faint for quiet lists. Only dismissible filters are removable. sm (20px) is the default; md and lg are larger kit sizes for roomier layouts.

- Do not invent a local Badge, Tag, Chip or Pill.
- Do not use as a button or link. Only the close button is interactive.
- Do not use for people. Use Avatar.

### BadgeAlt

Alternate status or category label: tinted fill with a matching border, in three sizes.

Props — `intent`: `neutral` | `brand` | `success` | `warning` | `danger` | `info` (default `neutral`); `size`: `sm` | `md` | `lg` (default `md`); `removable`: boolean (default `false`); `disabled`: boolean (default `false`); `children`: `string`

Events — `onRemove`

BadgeAlt is the alternate badge style: a light tint, a matching border and intent-colored text, with a brand intent. Use Badge by default; use BadgeAlt only where a screen already uses this style. Do not mix Badge and BadgeAlt on one screen. Only dismissible filters are removable.

- Do not use BadgeAlt where Badge fits. Badge is the default.
- Do not mix Badge and BadgeAlt on one screen.
- Do not use as a button or link. Only the X is interactive.

### Callout

Inline message that stays on the page, with an optional action and dismiss.

Props — `intent`: `info` | `success` | `warning` | `danger` (default `info`); `title`: `string`; `actionLabel`: `string`; `closeButton`: boolean (default `false`); `children`: `ReactNode`

Events — `onAction`, `onDismiss`

Use Callout for a message that stays on the page until the user acts on it or dismisses it. Pick the intent from what the message means. Keep it to one or two sentences and at most one action. Warning and danger are announced right away; info and success are announced politely.

- Do not invent a local Callout, Banner or Notice.
- Do not use for short status labels on rows or cards.
- Do not use for pop-up messages that disappear on their own.

### Count

Small number badge for counts, like unread items on a nav link or tab.

Props — `intent`: `info` | `danger` | `neutral` (default `info`); `size`: `sm` | `md` | `lg` (default `md`); `subtle`: boolean (default `false`); `disabled`: boolean (default `false`); `count`: `number`; `max`: `number`; `label`: `string`

Use Count for a number next to a nav item, tab, button or icon, like 3 unread. Use Badge for words. Counts above max show as max+ (99+). Pass label so screen readers hear 3 unread messages, not just 3.

- Do not invent a local counter or notification dot.
- Do not put words in a Count. Use Badge.
- Do not use Count as a button.

### EmptyState

What a list, page or panel shows when it has nothing yet: an icon, a title, a line of help and the action that fills it.

Props — `title`: `string`; `description`: `string`; `icon`: `string`; `iconStyle`: `well` | `plain` (default `well`); `media`: `ReactNode`; `actions`: `ReactNode`; `outlined`: boolean (default `false`); `headingLevel`: `2` | `3` | `4` (default `3`)

Use EmptyState in place of content that isn't there yet: a list with no rows, a new account's first screen, a panel with nothing selected. It is one component: pass title, and add description, icon and actions as needed. icon shows in a round well above the title, or large and filled with iconStyle="plain"; media replaces it with a kit Avatar or AvatarGroup. actions holds kit Buttons, like one strong brand Create and a subtle Import. outlined adds a border and a card fill, for an empty region inside a page.

- Do not invent EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription or EmptyContent. Pass props.
- Do not use it for page messages like errors or warnings. Use Callout.
- Do not use it while content is loading.

### Meter

How far along or how full something is, from 0 to 100, as a bar, a ring or a half ring, with optional red, amber and green zones.

Props — `value`: `number | "indeterminate"`; `label`: `string`; `shape`: `bar` | `circle` | `semicircle` (default `bar`); `size`: `sm` | `md` | `lg` (default `md`); `thresholds`: `none` | `bar` | `plotArea` | `all` (default `none`); `intent`: `info` | `success` | `warning` | `danger`; `referenceLines`: boolean (default `false`); `showValue`: boolean (default `false`); `datatip`: `string`

Use Meter for task completion (uploads, setup) and for measures against a range (storage used, budget spent, health scores). It is one component: pass value from 0 to 100 and a label that names it; value indeterminate slides a segment along the bar while the amount done is not known. shape picks a bar, a circle or a semicircle gauge (a bowl that fills left to right); size sets the bar thickness or the ring width. thresholds splits the range into thirds, low red, middle amber, high green: bar colors the value by its zone, plotArea colors the track, all shows the three bands. referenceLines marks the zone edges. showValue writes the percent after the bar or inside the ring, and datatip puts a short note in a tip at the end of the value.

- Do not use it for a short wait of unknown length in the spot that is loading. Show a Spinner. indeterminate is for a bar that sits with the work, like a loading Toast, or that will get a value later.
- Do not use indeterminate with circle or semicircle; it is bar only.
- Do not draw bars or rings from divs or SVG. Use Meter.

### ProgressBar

The older 20-tall progress bar with its percent written on or beside it, for screens that still use the legacy look.

Props — `value`: `number`; `label`: `string`; `valueLabel`: `string`; `showLabel`: boolean (default `true`); `labelPosition`: `center` | `right` (default `center`)

Use ProgressBar only to match screens built with the older progress bar. It is one component: pass value from 0 to 100 and a label that names what is loading. The percent shows in the middle of the bar, or to its right with labelPosition="right" when the bar is narrow. valueLabel replaces the percent text, like 3 of 12 files.

- Do not use it for waits of unknown length. Show a spinner instead.
- Do not stack several bars for one process. Use one bar with a clear label.
- Do not draw a progress bar from divs. Use this or the kit progress bar.

### Skeleton

Gray placeholder shapes in the layout of content that is still loading, like lines of text, an avatar or an image, so the page keeps its shape until the data arrives.

Props — `shape`: `text` | `circle` | `rect` (default `text`); `lines`: `number`; `size`: `sm` | `md` | `lg` (default `md`); `width`: `string | number`; `height`: `string | number`; `animation`: `shimmer` | `pulse` | `none` (default `shimmer`); `loading`: boolean (default `true`); `children`: `ReactNode`; `label`: `string`

Use Skeleton while data loads, in the place and rough shape the content will take: text lines for copy, a circle for an avatar, a block for an image, chart or card. It is one component: pick a shape, and for text how many lines (the last is shorter). animation shimmer runs a soft band of light across every skeleton on the page together; pulse fades them in and out; none keeps them still gray. Wrap the real content as children and set loading to false when it is ready: the Skeleton steps aside. Compose several for a card, a list row or a table. For a short line saying work is happening, use TextLoader; for a known amount done, use Meter.

- Do not use it for a short status line. Use TextLoader.
- Do not use it when the amount done is known. Use Meter.
- Do not leave it up when the load failed; show a Callout or an EmptyState.

### Spinner

A small ring of ticks in the brand color that turns while something loads and the wait is short and unknown.

Props — `size`: `sm` | `md` | `lg` (default `md`); `label`: `string`; `showLabel`: boolean (default `false`)

Use Spinner for a short wait with no known end, in the spot that is loading: a panel refreshing, a list fetching more, a Drawer loading a record. It is one component: pick a size. label is read by screen readers (Loading by default); showLabel writes it next to the ring, like Loading invoices…. For a button that is working, use Button loading. For content with a known layout, use Skeleton; for a known amount done, use Meter; for a line of status text, use TextLoader.

- Do not put it in a Button. Use Button loading.
- Do not use it when the amount done is known. Use Meter.
- Do not use it for content with a known layout. Use Skeleton.

### TextLoader

Short text with a soft wave of light running through it, for a moment of work whose end is unknown, like Generating response… or Syncing invoices….

Props — `children`: `string`; `size`: `sm` | `md` | `lg` (default `md`); `speed`: `slow` | `normal` | `fast` (default `normal`)

Use TextLoader for one short line that says something is being worked on: an AI answer being written, a sync, a search. It is one component: pass the text as children. The letters fade in and out one after another, left to right. Swap it for the real content as soon as it is ready. For the shape of content that is still loading, use Skeleton; for a known amount done, use Meter.

- Do not use it for headings or body copy.
- Do not use it for long text; keep it to a few words.
- Do not use it when the amount done is known. Use Meter.

### Toast

A short note that floats in after an action, like Saved successfully, and goes away on its own after a few seconds, with an optional Undo.

Props — `open`: boolean; `title`: `string`; `description`: `string`; `intent`: `info` | `success` | `warning` | `danger` (default `info`); `actionLabel`: `string`; `progress`: `number | "indeterminate"`; `duration`: `number | null`

Events — `onClose`, `onAction`

Use Toast to confirm an action people just took, or to offer a quick Undo. It is one component: render it with open and onClose, and set open when the action happens. It floats at the bottom right of the screen, above dialogs; several stack. It is 360 wide and has no close button. A bar along the top counts down duration and then onClose runs: 5 seconds by default, 8 with an action, so people have time to reach it. Pointing at the toast or tabbing into it pauses the countdown, and Escape closes it while focus is inside. intent colors the icon and the bar. actionLabel adds one link-style action, like Undo; picking it runs onAction and closes the toast. Loading mode: set progress to a number from 0 to 100, or to indeterminate when the amount done is not known, for work that runs in the background while people keep using the page, like Data is loading. A loading toast sits at the top center of the screen, and loading toasts stack there. The kit Spinner takes the place of the icon, the title runs through the kit TextLoader wave, and a thin kit Meter bar sits under the text, with the percent after it. It has no countdown and never closes itself, and Escape does not close it: actionLabel, like Cancel, is the way out (onAction runs, then onClose), and the screen sets open to false when the work is done. It has no scrim and does not block the page. intent colors the bar. For messages that must stay on the page, use Callout. A toast is not opened by anything in particular, so it follows the page's own theme rather than a frame's.

- Do not use it for errors people must fix or read later. Use Callout on the page.
- Do not put more than one action in a toast.
- Do not make duration shorter than people need to read it and reach the action.

## form

### Cascader

Pick one item from options that nest several levels deep by walking columns left to right, like a field on a related object (Invoice / Account / Owner) or a region / country / city.

Props — `label`: `string`; `options`: `CascaderOption[]`; `value`: `string[]`; `defaultValue`: `string[]`; `variant`: `field` | `panel` (default `field`); `changeOnSelect`: boolean (default `false`); `searchable`: boolean (default `false`); `hasLegend`: boolean (default `true`); `placeholder`: `string`; `size`: `sm` | `md` | `lg`; `labelPosition`: `top` | `start`; `hideLabel`: boolean (default `false`); `name`: `string`; `required`: boolean (default `false`); `disabled`: boolean (default `false`); `invalid`: boolean (default `false`); `error`: `string`; `hint`: `string`; `help`: `string`; `emptyLabel`: `string`

Events — `onChange`

Use Cascader when the choice sits at the end of a path and people need to see each level: fields on related records, categories, locations. It is one component: pass options, each with a value, a label and, when it opens another level, children. variant field is a form field that opens the columns in a dropdown and shows the picked path (Invoice / Account / Owner); variant panel draws the columns inline, like the field picker in a modal, with the page showing the choice. Each row can carry a path in brackets (the related object or id), a type badge (Text, Num, Date) and a relation mark: parent ([+], opens the related record's fields) or children (», opens related child records). A legend under the columns explains the marks when any row has one. Only the last level can be picked unless changeOnSelect lets any level be the answer. searchable adds a search box that lists every matching path. A portaled panel takes the theme of whatever opened it, so it is dark with a dark app frame even though it is drawn at the end of the page. A label set at the start goes back on top of the field when the box around it is narrower than 554px, since a 234px label column would leave too little of the field to type in.

- Do not use it for a flat list. Use Select.
- Do not use it to browse or arrange a hierarchy without picking. Use TreeView.
- Do not nest Selects to fake levels, or build local columns. Use Cascader.

### ChatComposer

The box people write to the assistant in: what the question is about, what is attached, the words, and the toolbar that sends it.

Props — `value`: `string`; `defaultValue`: `string`; `placeholder`: `string`; `hints`: `string[]`; `scopeLabel`: `string`; `scoped`: boolean; `defaultScoped`: boolean (default `false`); `attachments`: `ChatComposerAttachment[]` { id, label }; `addMenu`: `DropdownMenuEntry[]`; `selecting`: boolean (default `false`); `dictating`: boolean (default `false`); `mode`: `quick` | `deep` (default `quick`); `disabled`: boolean (default `false`); `label`: `string`

Events — `onChange`, `onSend`, `onScopedChange`, `onScopeClose`, `onAttachmentRemove`, `onAdd`, `onSelectingChange`, `onDictatingChange`, `onModeChange`

Use ChatComposer at the foot of an assistant panel or a full-screen chat. It is one component: the ask field grows to six lines and then scrolls, Enter sends and Shift plus Enter starts a new line. scopeLabel adds the Scope to this page checkbox on top, naming the page the person is on; onScopeClose puts a close button at the end of that row so the whole row can be shut. attachments shows the files and fields going with the message, each a kit Badge you can take off, and the bar is gone when there are none. The toolbar holds add (a kit Dropdown when you pass addMenu), select fields, dictate, Deep Thought and send; send is off until something is typed. Select fields and dictate are switches: while one is on it turns red and says how to stop.

- Do not build the box from Textarea and Buttons, or add a MessageBox, PromptInput or SendButton. Use this.
- Do not use it for an ordinary form field. Use Textarea.
- Do not show the scope row on a screen with nothing to scope to, and do not name a page the person is not on.

### Checkbox

Checkbox for multi-select and confirmations.

Props — `size`: `sm` | `md` | `lg` (default `md`); `checked`: boolean; `defaultChecked`: boolean (default `false`); `indeterminate`: boolean (default `false`); `error`: boolean (default `false`); `disabled`: boolean (default `false`); `hideLabel`: boolean (default `false`); `label`: `string`; `name`: `string`; `id`: `string`

Events — `onChange`

Use Checkbox for independent yes/no choices and multi-select, like agreeing to terms or picking table rows. For one choice from several, use radio buttons. Every Checkbox has a label; set hideLabel in table rows and other slots with no visible text. Indeterminate is only for a parent that reflects mixed children.

- Do not invent a local Checkbox.
- Do not use for one choice from several.
- Do not use as a submit action. Use Button.

### DatePicker

A date field that opens a calendar to pick one date, or a range between two dates.

Props — `label`: `string`; `type`: `single` | `dual` (default `single`); `size`: `sm` | `md` | `lg` (default `md`); `labelPosition`: `top` | `start` (default `top`); `hideLabel`: boolean (default `false`); `placeholder`: `string`; `value`: `string | DatePickerRange`; `defaultValue`: `string | DatePickerRange`; `minDate`: `string`; `maxDate`: `string`; `presets`: boolean (default `true`); `monthYear`: `title` | `menus` (default `title`); `name`: `string`; `id`: `string`; `required`: boolean (default `false`); `disabled`: boolean (default `false`); `invalid`: boolean (default `false`); `error`: `string`; `hint`: `string`; `help`: `string`

Events — `onChange`

Use DatePicker for dates in forms and filters. type single picks one day; type dual picks a start and an end across two months, with quick ranges like Last week. monthYear menus turns the month and year over the days into two menus, for dates far from today, like a date of birth; the arrows stay beside them. Picks stay pending until Apply; Cancel, Escape or a click outside leave the value as it was. Dates are ISO strings (YYYY-MM-DD); a range is { start, end }. Label, hint, error, help and sizes work like Input. A portaled panel takes the theme of whatever opened it, so it is dark with a dark app frame even though it is drawn at the end of the page. A label set at the start goes back on top of the field when the box around it is narrower than 554px, since a 234px label column would leave too little of the field to type in.

- Do not invent a local Calendar, DateRangePicker, Popover or native input type=date.
- Do not use two DatePickers for a start and end. Use type dual.
- Do not use for time. There is no time picker yet.

### Form

One form: an optional title, kit fields (or titled sections of them) and the actions that save it.

Props — `title`: `string`; `description`: `string`; `variant`: `plain` | `card` (default `plain`); `labelPosition`: `top` | `start` (default `top`); `labelWidth`: `sm` | `md` | `lg` (default `md`); `columns`: `1` | `2` | `3`; `children`: `ReactNode`; `sections`: `FormSection[]`; `actions`: `ReactNode`; `error`: `string`; `id`: `string`

Events — `onSubmit`

Use Form to wrap kit fields (Input, Textarea, Select, DatePicker, Lookup, Cascader, FormulaEditor, Checkbox, RadioGroup, Switch) that save together. Read-only values go in FormDisplay rows; back-to-back rows sit flush as one list. Pass the fields as children, or as sections when they fall into groups like Company and Billing; each section is a titled group. labelPosition="start" puts every field's label in a column at the beginning, 234px wide unless labelWidth narrows or widens it; columns={2} puts fields side by side, and columns={3} puts them in threes on a wide page. Once columns is set (1, 2 or 3), each column stops at 554px (--layout-column-max) and the fields stay at the start, so a wide page leaves the space on the right empty instead of stretching the fields; with columns unset, the fields fill the form, as in a Modal or Drawer. Inside a FormPage the Form takes the page's columns unless it sets its own. A long form of groups — a create page — takes sections with collapsible, and the save can sit outside the form: give the Form an id and the Button type="submit" with form set to it, so one press still saves one form. actions holds kit Buttons: subtle first, one strong brand Button last with type="submit". Enter in a field submits, and onSubmit gets the values by field name. Inside a Modal, skip the title (the Modal names it), give the Form an id, and put the Save Button in the Modal footer with form set to that id.

- Do not invent FieldSet, FieldGroup, FieldLegend, FormSection, FormActions or a local <form> wrapper.
- Do not put a Form inside another Form.
- Do not put more than one strong brand Button in actions.

### FormDisplay

A read-only label and value, like a form field that shows data instead of editing it.

Props — `label`: `string`; `value`: `ReactNode`; `labelPosition`: `top` | `start` (default `top`); `help`: `string`; `empty`: `string`

Use FormDisplay on detail and review screens to show saved values: account type, billing email, payment terms. One component per pair, with a faint line underneath so a stack reads as a list. labelPosition start puts the label on a faint fill in the same 234px column as start-label inputs, so displays and fields line up in one Form; top puts it above the value. It takes labelPosition from an enclosing Form. Stack several in one plain box with no gap between them: the rows butt together, so the start labels read as one filled column and the lines divide the rows. Inside a Section, wrap the stack in one div, or the Section's gap spaces the rows apart; the exception is a Section with columns (or one in a RecordPage, which gives its Sections columns), where the rows go straight in as children and flow into columns left to right, each at most 554px and kept at the start, with no gap between rows. Inside a RecordPage the rows take the record's labelPosition. An empty value shows a dash.

- Do not put a gap or margin between stacked FormDisplays, or pass them to a Section one by one. Wrap the stack in one plain div, unless the Section has columns: then pass the rows straight in.
- Do not lay rows side by side with your own grid or flex. Use Section or Form columns.
- Do not invent DescriptionList, KeyValue, DetailRow, ReadOnlyField or a local label and value pair.

### FormulaEditor

A monospace field for writing formulas and rules, with a toolbar that inserts fields, operators and functions and checks the syntax.

Props — `label`: `string`; `hideLabel`: boolean (default `false`); `labelPosition`: `top` | `start` (default `top`); `size`: `sm` | `md` | `lg` (default `sm`); `placeholder`: `string`; `value`: `string`; `defaultValue`: `string`; `fields`: `FormulaField[]` { id: string; label: string }; `functions`: `FormulaFunction[]` { name: string; syntax?: string; description?: string }; `aiActive`: boolean (default `false`); `name`: `string`; `id`: `string`; `required`: boolean (default `false`); `disabled`: boolean (default `false`); `readOnly`: boolean (default `false`); `invalid`: boolean (default `false`); `error`: `string`; `hint`: `string`; `help`: `string`

Events — `onChange`, `onCheckSyntax`, `onCalculate`, `onAiAssist`

Use FormulaEditor for calculated fields, rules and validations. It is one form field: pass label, hint, error and help as props, same as Input, and it takes labelPosition from an enclosing Form. The toolbar inserts at the cursor. fields adds an Insert field menu that inserts {!Field.Id}; functions replaces the default function list. Check syntax runs onCheckSyntax, or a built-in bracket and quote check. onCalculate adds a Calculate button that shows its result under the field. onAiAssist adds an AI assistant button at the front of the toolbar for a screen that can answer with a formula; aiActive shows it toggled on while the assistant is attached to this field. A label set at the start goes back on top of the field when the box around it is narrower than 554px, since a 234px label column would leave too little of the field to type in.

- Do not invent CodeEditor, ExpressionInput, a formula toolbar or a Textarea with buttons above it.
- Do not use for prose or notes. Use Textarea.
- Do not use for one-line values. Use Input.

### Input

Single-line text entry with its own label, hint, error and character count.

Props — `label`: `string`; `hideLabel`: boolean (default `false`); `labelPosition`: `top` | `start` (default `top`); `size`: `sm` | `md` | `lg` (default `md`); `type`: `text` | `email` | `password` | `search` | `number` | `tel` | `url` | `file` (default `text`); `placeholder`: `string`; `value`: `string`; `defaultValue`: `string`; `accept`: `string`; `multiple`: boolean (default `false`); `name`: `string`; `id`: `string`; `autoComplete`: `string`; `required`: boolean (default `false`); `disabled`: boolean (default `false`); `readOnly`: boolean (default `false`); `invalid`: boolean (default `false`); `error`: `string`; `hint`: `string`; `help`: `string`; `prefix`: `string`; `suffix`: `string`; `iconStart`: `string`; `iconEnd`: `string`; `maxLength`: `number`

Events — `onChange`, `onFilesChange`

Use Input for short text: names, emails, amounts, search. It is one component: pass label, hint and error as props, no Field wrapper. Always pass label; set hideLabel when the screen already makes the purpose clear, like a search box. required adds a red asterisk and the native required attribute. error shows a red border and a message under the field; invalid shows the red border alone. prefix and suffix are text inside the field, like https:// or USD. maxLength adds a live counter. type="file" opens the native file picker; accept limits the file types and multiple allows more than one. A label set at the start goes back on top of the field when the box around it is narrower than 554px, since a 234px label column would leave too little of the field to type in.

- Do not invent a local Field, FieldLabel, FieldDescription, FieldError, FormItem, InputGroup or SearchInput.
- Do not build a local tooltip for help. Pass help; it shows in the kit HelpPopover.
- Do not use a placeholder as the label. Pass label, and hideLabel if it must not show.

### Lookup

A form field for picking one record from a long list, like a product or an account, through a searchable table in a wide Modal.

Props — `label`: `string`; `columns`: `TableColumn[]`; `rows`: `LookupRow[]`; `value`: `string | null`; `defaultValue`: `string | null`; `labelKey`: `string`; `title`: `string`; `icon`: `string`; `searchPlaceholder`: `string`; `pageSize`: `number`; `clearable`: boolean (default `true`); `placeholder`: `string`; `emptyLabel`: `string`; `size`: `sm` | `md` | `lg`; `labelPosition`: `top` | `start`; `hideLabel`: boolean (default `false`); `name`: `string`; `required`: boolean (default `false`); `disabled`: boolean (default `false`); `invalid`: boolean (default `false`); `error`: `string`; `hint`: `string`; `help`: `string`; `multiple`: boolean (default `false`); `trigger`: `field` | `button` (default `field`); `buttonIcon`: `string`; `confirmLabel`: `string`

Functions — `detail`, `detailCount`

Events — `onChange`, `onConfirm`

Use Lookup when the choice is a record from a list too long or too detailed for a Select: products, accounts, contracts, users. It is one component: pass label, the table's columns and rows, and value with onChange. The field shows the picked record's name, a × to clear it and a lookup button at the end; clicking the field or the button opens a Modal (xl) titled Lookup: label, with a folder icon, a search box with a Search button, the kit Table and Pagination under it. Clicking a row, or its name, picks it and closes the Modal; the × on the Modal closes it without a change. Search looks through every text value of each row. A label set at the start goes back on top of the field when the box around it is narrower than 554px, since a 234px label column would leave too little of the field to type in. multiple turns the same dialog into a picker for many records: rows get checkboxes, clicking a row ticks it, ticks stay while people search and page, and the footer's strong brand Button hands them all to onConfirm. With trigger button a kit Button opens it instead of a field, for adding a batch of records to a list or grid.

- Do not use it for a short list of plain options. Use Select.
- Do not use it for a path through nested levels. Use Cascader.
- Do not build a local lookup dialog, table picker or search field with a button. Use Lookup.

### RadioGroup

Pick exactly one option from a short visible list.

Props — `size`: `sm` | `md` | `lg` (default `md`); `orientation`: `vertical` | `horizontal` (default `vertical`); `layout`: `list` | `card` (default `list`); `disabled`: boolean (default `false`); `hideLegend`: boolean (default `false`); `labelPosition`: `top` | `start` (default `top`); `legend`: `string`; `name`: `string`; `value`: `string`; `defaultValue`: `string`; `error`: `string`; `hint`: `string`; `options`: `RadioGroupOption[]` { value, label, description?, badge?, badgeIntent?, disabled?, hideLabel? }

Events — `onChange`

Use RadioGroup for one choice from two to six options that should stay visible, like a billing cycle. Use Checkbox for independent yes/no choices. The legend names the group; hide it only when a heading already names it. labelPosition start moves the legend into the 234px label column beside the options, so the group lines up with the fields around it. Card layout suits choices that need a description.

- Do not invent a Radio, RadioItem or RadioLegend cousin.
- Do not use for independent yes/no choices. Use Checkbox.
- Do not use for long lists of options.

### Segmented

One choice from two to five options, shown as kit minimal Buttons side by side.

Props — `label`: `string`; `hideLabel`: boolean (default `false`); `options`: `SegmentedControlOption[]` { value: string; label: string; icon?: string; disabled?: boolean }; `value`: `string`; `defaultValue`: `string`; `size`: `sm` | `md` | `lg` (default `md`); `fullWidth`: boolean (default `false`); `disabled`: boolean (default `false`); `name`: `string`

Events — `onChange`

Use Segmented for a small, always-visible choice that applies at once, like density, a view (List / Board) or a period (Day / Week / Month). It works like a radio group: one option is chosen, and arrow keys move the choice. Pass label (visible, or hideLabel), options and value or defaultValue. fullWidth stretches the options to fill the row, like in a menu. For more options or long labels, use Select; for an on/off setting, use Switch.

- Do not invent ToggleGroup, ToggleButtons, Segmented or a ButtonGroup with a pressed button. Options are already kit Buttons.
- Do not use for more than five options or long labels. Use Select.
- Do not use for on/off. Use Switch.

### Select

Choose one or several options from a list.

Props — `label`: `string`; `options`: `SelectOption[]` { value, label, disabled? }; `size`: `sm` | `md` | `lg` (default `md`); `labelPosition`: `top` | `start` (default `top`); `itemCheck`: `check` | `checkbox` (default `check`); `hideLabel`: boolean (default `false`); `multiple`: boolean (default `false`); `placeholder`: `string`; `value`: `string | string[]`; `defaultValue`: `string | string[]`; `maxVisible`: `number`; `searchable`: boolean (default `false`); `searchPlaceholder`: `string`; `name`: `string`; `id`: `string`; `required`: boolean (default `false`); `disabled`: boolean (default `false`); `invalid`: boolean (default `false`); `error`: `string`; `hint`: `string`; `help`: `string`; `menuWidth`: `default` | `field` (default `default`)

Events — `onChange`

Use Select to pick a value from a fixed list in a form or filter: country, status, owner, tags. One pick closes the menu; with multiple the menu stays open and each pick toggles. The field shows the picked labels; with maxVisible it shows the first few and a +N badge. Label, hint, error, help, required and sizes work like Input. For 2 to 5 options that should stay visible, use RadioGroup. A label set at the start goes back on top of the field when the box around it is narrower than 554px, since a 234px label column would leave too little of the field to type in.

- Do not use a native select.
- Do not invent SelectTrigger, SelectContent, SelectItem, MultiSelect, Combobox or Tag.
- Do not use for actions from a button. Use Dropdown.

### Switch

An on/off setting that takes effect right away.

Props — `label`: `string`; `hideLabel`: boolean (default `false`); `description`: `string`; `size`: `sm` | `md` | `lg` (default `md`); `checked`: boolean; `defaultChecked`: boolean (default `false`); `disabled`: boolean (default `false`); `name`: `string`; `id`: `string`

Events — `onChange`

Use Switch in settings rows for preferences that apply as soon as they flip, like email notifications or auto-pay. The label sits first and the track last; a labeled Switch fills its row, so a stack of them reads as a settings list. description adds a second line. For choices saved with a form button, or agreeing to terms, use Checkbox.

- Do not invent Toggle, ToggleGroup, SwitchGroup or a local pill switch.
- Do not use for choices that wait for a Save button, or for agreeing to terms. Use Checkbox.
- Do not use for picking one of several options. Use RadioGroup.

### Textarea

Multi-line text entry for notes, descriptions and code, with its own label, hint, error and character count.

Props — `label`: `string`; `hideLabel`: boolean (default `false`); `labelPosition`: `top` | `start` (default `top`); `size`: `sm` | `md` | `lg` (default `md`); `type`: `text` | `code` (default `text`); `placeholder`: `string`; `value`: `string`; `defaultValue`: `string`; `name`: `string`; `id`: `string`; `required`: boolean (default `false`); `disabled`: boolean (default `false`); `readOnly`: boolean (default `false`); `invalid`: boolean (default `false`); `error`: `string`; `hint`: `string`; `help`: `string`; `maxLength`: `number`

Events — `onChange`

Use Textarea for text that runs over one line: notes, descriptions, messages, formulas. Pass label, hint, error and help as props, same as Input. size sets the starting height (100 / 180 / 240+ px); people can drag it taller. type code switches to a monospace font for formulas and snippets. maxLength shows a live count under the field. A label set at the start goes back on top of the field when the box around it is narrower than 554px, since a 234px label column would leave too little of the field to type in.

- Do not invent a local Field, FieldLabel, FieldError, CodeEditor or NotesBox.
- Do not use for one-line values. Use Input.
- Do not use for rich text or syntax highlighting. That is out of scope.

## layout

### Accordion

List of short sections where one opens at a time.

Props — `defaultExpanded`: `string`; `items`: `AccordionItem[]` { id, title, content }

Use Accordion for FAQs or short groups of details the user opens one at a time. Opening one item closes the others. Clicking the open item closes it.

- Do not invent a local Accordion, Collapse or Disclosure.
- Do not open more than one item at a time.
- Do not use for switching between peer views of the same data.

### Carousel

A track of slides people page through with previous and next buttons, swipe or the arrow keys, like a gallery or featured cards.

Props — `items`: `ReactNode[]`; `orientation`: `horizontal` | `vertical` (default `horizontal`); `slidesPerView`: `1` | `2` | `3` | `4` (default `1`); `alignment`: `start` | `center` (default `start`); `loop`: boolean (default `false`); `showControls`: boolean (default `true`); `showIndex`: boolean (default `false`); `label`: `string`

Events — `onIndexChange`

Use Carousel for galleries, featured cards and paged media. It is one component: pass items as an array of slides. slidesPerView shows 1 to 4 slides at once, so the next ones peek in. Previous and next are kit Buttons beside the track (above and below it when vertical); they turn off at the ends unless loop wraps around. People can also swipe or scroll the track, and press the arrow keys when it has focus. showIndex adds a Slide 2 of 5 caption under it.

- Do not add CarouselContent, CarouselItem, CarouselPrevious or CarouselNext. Pass items.
- Do not use it to switch views. Use Tabs.
- Do not use it to page a list or table. Show the rows.

### Conveyor

Arrows at both ends of a row or column that is too long to fit, so people can move it along without a scrollbar.

Props — `children`: `ReactNode`; `orientation`: `horizontal` | `vertical` (default `horizontal`); `step`: `number`; `label`: `string`

Use Conveyor around a run of pieces that does not fit, like eight scorecards in a Scoreboard, a row of filter chips or a tall side list. It is one component: put the run inside it. The arrows show only when there is something to scroll, and each one turns off at its end. A soft fade sits where the content passes under an arrow. A press moves most of a screenful, or the step you set. The row can also be scrolled by hand, with a trackpad, or with the arrow keys when it has focus. A Scoreboard past four cards already puts itself in one, so wrap a Scoreboard by hand only when you want other settings, and pass it scroll off. For paged slides with a Slide 2 of 5 caption, use Carousel. In a box narrower than 640px, the kit's mobile break, the two arrows would take a third of the room, so they give way to swiping: the track keeps the whole width and comes to rest on a whole piece. It stays a focus stop, so the arrow keys still move it.

- Do not use it for paged slides or a gallery. Use Carousel.
- Do not use it to page a table. Use Pagination.
- Do not put a second scrolling box inside it; turn that one's scrolling off.

### Density

Sets the density tokens for everything inside it: Compact, Default or Comfortable spacing, control and icon sizes, and font sizes, like the BP Foundations density modes.

Props — `value`: `compact` | `default` | `comfortable` (default `default`); `children`: `ReactNode`

Wrap the app content (or one area) in Density and pass the person's choice, usually from the AppHeader account menu. Density sets data-density on a wrapper with no box of its own (display: contents), and the kit tokens inside take that mode: space, control heights, icon sizes and font sizes. Controls keep their own size (md when not set); a medium Input is 32 / 36 / 36px tall and its text 14 / 16 / 18px in Compact / Default / Comfortable. Component sizes follow too (table and tree rows, tabs, avatars, badges, checkboxes, switches). Radius, border widths and the 24px minimum click target do not change. Menus, date pickers, modals and other popups opened from inside keep the same density. AppHeader keeps its own density sizes (its density prop, else the surrounding Density).

- Do not set size on every control to fake a density. Wrap them in Density.
- Do not invent DensityProvider, SizeProvider or a local size context.
- Do not set data-density by hand on screens. Use Density.

### Section

A titled block of a page, like Account information or Recent invoices: a header with a line under it, optional help and buttons, and the content below.

Props — `title`: `string`; `description`: `string`; `help`: `string`; `actions`: `ReactNode`; `children`: `ReactNode`; `line`: `medium` | `thin` | `none` (default `medium`); `columns`: `1` | `2` | `3`; `collapsible`: boolean (default `false`); `expanded`: boolean; `defaultExpanded`: boolean (default `true`); `heading`: `md` | `sm` | `xs`; `spacing`: `default` | `tight` (default `default`)

Events — `onExpandedChange`

Use Section to split a page under its PageHeader into titled parts, each holding a Table, FormDisplay rows, a Scoreboard or a Form. It is one component: pass title and the content as children, or leave children out for a header only, like a heading above content laid out by the page. Page edge padding and gap between Section blocks come from layout classes (`.layout-content`), not from Section —. help adds a ? icon after the title that opens a HelpPopover. actions holds kit Buttons at the end of the header. collapsible adds a chevron button before the title that hides and shows the content; it starts expanded unless defaultExpanded is false. A Section inside another Section's children is a sub-block: its title steps down to text-heading-xs on its own, so the outer title stays the louder one. Its stacked blocks sit one grid gutter apart. line sets the rule under the header: medium (2px, the default) or thin (1px). Each Section sets its own, so a page can keep 2px lines on its sections and give their subsections thin ones. columns (1, 2 or 3) lays a Section of FormDisplay rows or kit fields out in columns, left to right: pass the rows or fields straight in as children, not wrapped in a div. Each column stops at --layout-column-max (554px) and the block stays at the start, so the space past the last column stays empty on a wide screen; the header and its line keep the full width. Columns give way as the Section narrows, like Form columns: three become two under 1301px with start labels (720px with labels on top), and two become one under 867px with start labels (560px on top). Inside a RecordPage the Section takes the record's columns and labelPosition unless it sets its own columns. A Table, Scoreboard or anything else that is not a field or a FormDisplay is never put in columns: a Section of those keeps the full width.

- Do not invent a SectionHeader, SectionTitle or a heading with a border. Use Section.
- Do not override the header line with CSS or draw a border above the content. Use line.
- Do not use it for the page title. Use PageHeader.

## navigation

### AnchorNav

A list of the sections on one long page, which jumps to a section and shows the one the page is at.

Props — `items`: `AnchorNavItem[]` { id, label }; `active`: `string`; `defaultActive`: `string`; `variant`: `rail` | `menu` (default `rail`); `spy`: boolean (default `true`); `offset`: `number`; `label`: `string`

Events — `onActiveChange`

Use AnchorNav beside a long page that is split into sections, like a settings page or a long record: a contract, an account or a policy. It is one component: pass items, where each id is the id of that section on the page. Clicking a row scrolls to it and gives it focus. The row the page is at has a strong line and a caret. spy follows the page as it scrolls; offset keeps the jump clear of a sticky header. The menu variant is the same list inside a popover, for narrow screens. This is a map of one page, not app navigation: use AppNav for that, and Tabs to switch views.

- Do not use it for app navigation. Use AppNav.
- Do not use it to switch views on one screen. Use Tabs.
- Do not use it for steps in a flow. Use Steps.

### AppHeader

The product's top bar: logo and environment on the start, global search in the centre, utility icons, the user and their company on the end.

Props — `navOpen`: boolean (default `false`); `logo`: `ReactNode`; `homeHref`: `string`; `environment`: `string`; `environmentIntent`: `success` | `info` | `warning` | `danger` | `highlight` | `neutral` (default `success`); `search`: boolean (default `true`); `searchPlaceholder`: `string`; `searchShortcut`: `string`; `searchGroups`: `CommandGroup[]` { heading?: string; items: { id; label; description?; icon?; shortcut?; disabled? }[] }; `searchVariant`: `list` | `tabs` (default `list`); `searchIconStyle`: `tile` | `plain` (default `tile`); `searchScopes`: `CommandScope[]` { value: string; label: string }; `searchScope`: `string`; `actions`: `AppHeaderAction[]` { id: string; label: string; icon: string }; `user`: `AppHeaderUser` { name: string; src?: string }; `company`: `AppHeaderCompany` { name: string; logo?: ReactNode }; `darkMode`: boolean (default `false`); `density`: `compact` | `default` | `comfortable`

Events — `onNavToggle`, `onSearch`, `onSearchSelect`, `onSearchScopeChange`, `onAction`, `onUserSettings`, `onDarkModeChange`, `onDensityChange`, `onLogout`

Put one AppHeader at the top of the app shell, full width. onNavToggle adds the menu button that opens the side nav. It is one component: logo, environment, search, actions, user and company come from props, and it uses kit Logo, Badge, Button, Tooltip and Avatar inside. environment tags the instance (UAT-2, Sandbox) so people know where they are. With searchGroups, the search opens a kit GlobalSearch in its place: one search box that grows down into the results (Recent items, scopes, arrow keys and Enter); otherwise it runs onSearch; searchShortcut only shows a hint. actions are icon buttons named by a Tooltip. The avatar opens an account menu with the name, User settings, Dark mode, Density & text size and Log out; each row shows only when its handler is passed. The header follows density: its bar, search and buttons shrink in compact and grow in comfortable. Under 800px it turns compact: the logo becomes the symbol and the search becomes an icon button beside the other icons. Under 640px, the kit's mobile break, it turns phone-sized: the environment tag goes, and the row of icon actions becomes one more button holding the same actions, so onAction still tells you which was picked. Under 480px the company badge goes too; the avatar still says who is signed in. The bar answers to its own width, not the window's. Page titles, breadcrumbs and page actions belong in the page, not here.

- Do not invent TopBar, NavBar, Header, GlobalSearch, UserBadge, UserMenu or CompanyBadge.
- Do not put the page title, breadcrumbs or page actions in it. They belong in the page.
- Do not put more than three icon actions in it.

### AppNav

The app's main navigation: a brand rail of sections on the left, each with an optional second-level menu that flies out beside it.

Props — `items`: `SideNavEntry[]` { id: string; label: string; icon: string; href?: string; children?: SideNavChild[] } | { divider: true }; `endItems`: `SideNavItem[]`; `current`: `string`; `defaultCurrent`: `string`; `expanded`: boolean (default `false`); `pinned`: boolean; `defaultPinned`: boolean (default `false`); `label`: `string`

Events — `onNavigate`, `onPinnedChange`

Put one AppNav on the left of the app shell, under the AppHeader, full height. It is one component: items are the rail sections (icon and label), endItems sit at the bottom of the rail, and a section's children make its second-level menu. Hovering a section rolls its menu out beside the rail; moving off the nav or picking a link rolls it back in. The menu's header row, which holds the section name and the pin, is 48px like a rail row, over 40px link rows. Every menu is the same width, the longest link in the whole nav (within --side-nav-panel-min and --side-nav-panel-max), so the menu never resizes as people move from one section to another, whether the rail is expanded or not. Clicking a section opens its first link, so a section with no menu still works. pin docks the menu open beside the rail; the × closes it. expanded shows the labels (the AppHeader menu button toggles it). A long menu is kept on screen and scrolls with overflow rows at the top and bottom. In a box narrower than 640px, the kit's mobile break, there is no room for a rail beside the page, so the nav is a drawer: it takes its open width with the labels shown whether or not expanded is passed, and it leaves the sliding to the frame around it.

- Do not invent a Sidebar, NavRail, Flyout or local menu beside it.
- Do not put page actions, filters or tabs in it. Those belong in the page.
- Do not nest a third level. A section has one menu of links, split by dividers.

### Breadcrumb

Path to the current page as a trail of links.

Props — `separator`: `slash` | `chevron` (default `slash`); `maxItems`: `number`; `items`: `BreadcrumbItem[]` { label, href?, onClick? }; `current`: boolean (default `true`)

Use Breadcrumb above a page title to show where the page sits in the app. The last crumb is the current page and is never a link. Slash is the default separator; chevron is the alternate. Long trails collapse with maxItems.

- Do not invent a local Breadcrumb, BreadcrumbItem or BreadcrumbLink.
- Do not make the current page a link.
- Do not use Breadcrumb as the sidebar or as tabs.

### ChatHeader

The bar at the top of the assistant: its mark and name, then start a new chat, go full screen, the options menu and close.

Props — `title`: `string`; `expanded`: boolean (default `false`); `chatsCount`: `number`; `playbooksCount`: `number`; `planMode`: boolean (default `false`); `menu`: `DropdownMenuEntry[]`; `label`: `string`

Events — `onNewChat`, `onExpandedChange`, `onClose`, `onPlanModeChange`, `onMenuSelect`

Use ChatHeader at the top of an assistant panel or its full-screen view. It is one component: pass the handlers for the buttons you want, and the ones you leave out do not show. The options menu is built for you: Chats and Playbooks with how many there are, Plan Mode with a tick while it is on, and Settings. While Plan Mode is on the bar also carries a Plan Mode badge beside the name, so it can be seen with the menu shut. On a narrow bar, like the side panel, the badge gives way first and shows its icon only, so the title is never cut short. chatsCount and playbooksCount leave the number off when there is none. menu replaces the whole menu when a screen needs different entries. Pair it with ChatList, ChatMessage and ChatComposer to make the window.

- Do not use it as the app's top bar. Use AppHeader.
- Do not use it as a page title. Use PageHeader.
- Do not build the bar from Buttons and a Logo, or add an AiHeader or CopilotBar. Use this.

### ChatList

The saved chats or playbooks beside the assistant: a titled panel with a search box and rows that open what they name.

Props — `title`: `string`; `items`: `ChatListItem[]` { id, label, icon?, menu? }; `groups`: `ChatListGroup[]` { id, label, items, defaultOpen? }; `selected`: `string`; `searchable`: boolean (default `true`); `searchPlaceholder`: `string`; `query`: `string`; `createLabel`: `string`; `closeLabel`: `string`; `emptyLabel`: `string`

Functions — `more`

Events — `onSelect`, `onQueryChange`, `onCreate`, `onClose`, `onItemMenuSelect`

Use ChatList for the panel of saved chats, or of playbooks, next to an assistant. It is one component: pass items for one plain list, or groups for named groups like Pinned Chats and Recent Chats, which people can fold away. Searching narrows the rows as it is typed, and empty groups drop out. Each row can carry its own menu, like Pin, Rename and Delete for a chat, or Edit and Delete for a playbook; it stays out of sight until the row is hovered or has focus. more adds the last row that reaches further back, like View chats older than 30 days. onCreate adds the button that starts a new one, and onClose the × that shuts the panel.

- Do not use it for app navigation. Use AppNav.
- Do not use it for a list of records people sort and filter. Use Table.
- Do not build the rows from your own divs, or add a ChatRow or PlaybookItem. Pass items.

### GlobalSearch

A search field over a grouped list of pages, records and actions.

Props — `groups`: `CommandGroup[]` { heading?, items }; `variant`: `list` | `tabs` (default `list`); `iconStyle`: `tile` | `plain` (default `tile`); `size`: `sm` | `md` (default `md`); `label`: `string`; `placeholder`: `string`; `empty`: `string`; `defaultQuery`: `string`; `hints`: boolean (default `true`); `scopes`: `CommandScope[]` { value: string; label: string }; `scope`: `string`; `defaultScope`: `string`; `autoFocus`: boolean (default `false`)

Events — `onScopeChange`, `onSelect`, `onViewAll`

Use GlobalSearch for quick jumps and actions across the app, like a global search. It is one component: pass groups of items as data. Typing filters by label and description, and the typed text shows bold in each label. Arrow keys move the highlight and Enter picks; Escape clears the search. It shows inline; a ⌘K palette comes later. variant tabs turns the group headings into tabs (All, Records, Reports.), like the global search. scopes adds a menu in the search row to narrow what it looks through. onViewAll adds a View all results row at the end. AppHeader and Toolbar open it over their search field, so the field grows into the results.

- Do not invent CommandInput, CommandList, CommandItem, CommandGroup, CommandEmpty, CommandDialog or SearchPanel.
- Do not use for a short list of actions from a button. Use Dropdown.
- Do not use for choosing a form value. Use RadioGroup, or Select when it exists.

### GuidedProcess

The pieces of a process walked one step at a time: a dark panel for a step, the dark list of every step beside the page, the header over a step, and the footer under it.

Props — `part`: `panel` | `steps` | `header` | `footer` (default `panel`); `title`: `string`; `subtitle`: `string`; `steps`: `GuidedProcessStep[]` { title, status?, statusText?, tasks }; `current`: `number`; `started`: boolean (default `true`); `placement`: `auto` | `side` | `band` (default `auto`); `shade`: `1` | `2` | `3` | `4` | `5` (default `1`); `startLabel`: `string`; `side`: `start` | `end` (default `end`); `stepTitle`: `string`; `total`: `number`; `actions`: `GuidedProcessAction[]` { id, label, icon?, emphasis?, intent?, type?, form?, disabled? }; `updated`: `string`

Events — `onStart`, `onCancel`, `onClose`, `onStepsOpen`, `onAction`

Use GuidedProcess for a process of a few steps done in order where each step is a page, like importing usage or registering a supplier. It is one component with four parts, picked by part, and each part takes only its own props. part panel (the default) is one step as a dark column: pass steps and current, the step number starting at 1, and it shows the number, the title and how the step went. Each step has a title, and can have a status (success, warning or error) with statusText, and tasks, the short list of what is done and left in it. Give the first column title and subtitle, and while the process has not started set started false with onStart and onCancel for Start and Cancel; shade 1 to 5 darkens columns further along. placement auto is a tall column from 1024 of box width and a band under it; side and band fix it. part steps is the dark panel beside the page once the process has started: the 4 | 6 counter at the top and every step at the foot, with a notch in the edge at the current step and its tasks under it. side is the page edge it sits on, so the notch points into the page; onClose shows a close button where it is a drawer, under 1024. part header goes over the step's fields: title is the process name, stepTitle the step's, and with total and onStepsOpen a 4 | 6 counter opens the steps where they are a drawer. part footer goes under the fields: updated is when the work was last saved and actions are the step's buttons in order. The last moves the process on: Continue, which is subtle, or Submit on the last step, which is strong brand and can be type submit with form set to the step's Form id; the rest are minimal. onAction gets the id pressed. From 1024 every action is a Button, under 1024 all but the last fold into a More menu, and under 600 the saved time goes on its own line and the quieter actions show as a row of large icon buttons over the last one, so give them an icon. Every dark part is dark in light and dark themes alike. Place the parts with the GuidedProcessPage pattern.

- Do not use it for a short flow inside a Modal or a Drawer. Use Steps.
- Do not use it for page sections that can be visited in any order. Use Tabs or AnchorNav.
- Do not invent GuidedProcessPanel, GuidedProcessSteps, GuidedProcessHeader, GuidedProcessFooter or a light version of the dark parts.

### Link

Inline text that takes people somewhere: a record, a list or another page.

Props — `children`: `ReactNode`; `href`: `string`; `intent`: `brand` | `neutral` (default `brand`); `external`: boolean (default `false`); `disabled`: boolean (default `false`)

Events — `onClick`

Use Link for text that navigates, inside a sentence or as a value, like a ledger number, a parent account or View recent invoices. It is one component: children is the text, href is where it goes. It takes the size of the text around it. intent brand is the blue that says this is a link; neutral is for links inside quiet text and keeps an underline. external opens it in a new tab and adds the new-tab mark. Without href it acts in place, as a button that looks like a link, like opening a tab on the same page. disabled shows it in faint text that goes nowhere. For a column of links use LinkList; for a link in a table use a link Cell; for anything that changes data use Button.

- Do not use Link for an action that changes data, like Delete or Save. Use Button.
- Do not use Link in a table cell. Use a link Cell.
- Do not stack Links into a list yourself. Use LinkList.

### LinkList

A column of links, one a row with a chevron at the end, like an account's quick links.

Props — `items`: `LinkListItem[]` { id, label, href?, onClick?, icon?, description?, external? }; `label`: `string`

Use LinkList for a short set of places to go from a page, like Quick links in a record's rail or related pages under a heading. It is one component: pass items, each with an id and a label, and href or onClick. icon puts a brand icon before the label; description adds a short line under it; external opens the link in a new tab and swaps the chevron for the new-tab mark. Put it in a Section, which gives it its title and box; the list draws no card of its own and its labels line up with the Section title. label names the list for screen readers, like Quick links. For a single link in text use Link; for actions use Buttons or a Dropdown.

- Do not use it for actions that change data. Use Buttons or a Dropdown.
- Do not use it for page navigation across the app. Use AppNav or Tabs.
- Do not put it in a Card or draw a box round it yourself. Put it in a Section.

### PageHeader

The top of a page's content: where it sits (breadcrumb), what it is (title, badge, and an optional icon) and the page actions.

Props — `title`: `string`; `breadcrumbs`: `BreadcrumbItem[]` { label: string; href?: string; onClick?: () => void }; `back`: `PageHeaderBack` { label: string; href?: string; onClick?: () => void }; `icon`: `string`; `badge`: `string`; `badgeIntent`: `neutral` | `info` | `success` | `warning` | `danger` | `highlight` (default `neutral`); `actions`: `ReactNode`; `moreActions`: `DropdownMenuEntry[]` { id: string; label: string; icon?: string; danger?: boolean } | { divider: true }; `sticky`: boolean (default `false`); `shadow`: boolean (default `true`)

Events — `onMoreSelect`

Put one PageHeader at the top of each page, under the AppHeader. It is one component: breadcrumbs are the page's parents, all links, starting with Home and then its side-nav section; the header closes the trail with the title as the current crumb, so it always reads Home › section › this page (like Home › Accounts › Northwind Traders). Then the title row with an optional badge, an icon before the title only when you pass one (none by default), and the page actions on the end. back puts a minimal arrow_back Button at the start of the title line, for a record page that was opened from a list: its label names where it goes and shows as a tooltip. actions are kit Buttons, size sm, with the one strong brand Button last; moreActions puts less-used actions in a More menu before them. sticky is the compact bar for when the page scrolls: one line whose trail ends in the page title, with a raised shadow unless shadow is false. On a phone-width header, under 640px of its own width, the title row takes the full width and the actions move onto their own row under it, starting at the start edge; the compact sticky bar stays one 52px line, keeping only the page name in its trail, shortened with an ellipsis when it runs long. The bar adds no side padding of its own: the page inset comes from the layout class around it (`02-tokens.md`), so the title lines up with the Sections under it. The bar is the top of the page, so it sits flush against the frame's bar with no page inset above it; the pattern holding it (AppShell, RecordPage) takes care of that.

- Do not invent ContentHeader, PageTitle, TitleBar or a local heading row.
- Do not put the app's logo, search or user in it. That is the AppHeader.
- Do not put more than one strong brand Button in actions, or more than five visible actions.

### Pagination

The bar under a long table that moves between pages, says which rows are showing, and lets people pick how many rows a page holds.

Props — `total`: `number`; `page`: `number`; `defaultPage`: `number`; `pageSize`: `number`; `defaultPageSize`: `number`; `pageSizes`: `number[]`; `showRange`: boolean (default `true`); `showPageSize`: boolean (default `true`); `label`: `string`

Events — `onPageChange`, `onPageSizeChange`

Use Pagination under a Table or DataGrid whose rows don't fit on one page. It is one component: pass total (the number of rows) and read page and pageSize back to slice your rows. Previous and next arrows sit at the start with the page numbers between them; long runs collapse into an ellipsis around the current page. At the end, Showing 1 to 10 of 59 rows and a kit Select to pick 10, 25, 50 or 100 rows per page. Changing the page size keeps the first visible row on screen.

- Do not use it to switch views or steps. Use Tabs.
- Do not build page buttons from a ButtonGroup or loose Buttons. Use Pagination.
- Do not invent a PageSizeSelect or RowsInfo. Turn showPageSize and showRange on or off.

### Steps

A row of numbered steps that shows where a person is in a flow of a few steps: done, current and still to come.

Props — `steps`: `string[]`; `current`: `number`; `size`: `sm` | `md` (default `md`); `fill`: boolean (default `false`); `label`: `string`

Events — `onStepClick`

Use Steps above a flow that is split into a few steps, like a setup wizard or an import: Setup, Map Columns, Billing IDs. It is one component: pass steps as labels and current as the step number, starting at 1. Steps before current are done (green with a check), current is brand with its number, later steps are gray. A current past the last step shows every step done. onStepClick makes done steps buttons, to go back and change them. fill spreads the steps across the full width. The Steps only shows progress; the page shows the step's content and its Back and Next buttons.

- Do not use it for page sections the person can visit in any order. Use Tabs.
- Do not use it for a single amount done. Use Meter.
- Do not put the Back and Next buttons inside it; they belong to the page.

### Tabs

A row of tabs that switches between related views in the same place.

Props — `items`: `TabItem[]`; `label`: `string`; `value`: `string`; `defaultValue`: `string`; `size`: `sm` | `md` | `lg` (default `sm`); `expand`: boolean (default `false`); `border`: boolean (default `true`)

Events — `onChange`

Use Tabs to switch between two or more related views on one page, like the sections of a record or settings. One component: pass items with a label and, optionally, an icon, a count and content. With content, Tabs shows the selected panel under the strip; without it, it is a strip only and you show the view yourself from value and onChange. size sets the height (sm is the default); expand stretches the tabs across the row; border draws the line under the strip. For a small always-visible choice like density or a view switch, use Segmented.

- Do not invent TabList, Tab, TabPanel, TabsTrigger or a local tab strip. It is one component.
- Do not use for app or page navigation. Use the side nav.
- Do not use for a small choice that applies at once, like density or List / Board. Use Segmented.

### Toolbar

The bar above a list or table: find and filter on the left, view and actions on the right, with a filter bar that opens under it.

Props — `filters`: `ReactNode`; `filterCount`: `number`; `filtersOpen`: boolean; `defaultFiltersOpen`: boolean (default `false`); `filterHelp`: `string`; `searchValue`: `string`; `searchPlaceholder`: `string`; `searchGroups`: `CommandGroup[]` { heading?: string; items: { id: string; label: string; description?: string; icon?: string }[] }; `field`: `ReactNode`; `selectedCount`: `number`; `views`: `ToolbarView[]` { id: string; label: string }; `view`: `string`; `moreActions`: `DropdownMenuEntry[]` { id: string; label: string; icon?: string; danger?: boolean } | { divider: true }; `actions`: `ReactNode`; `buttons`: `raised` | `subtle` (default `raised`); `label`: `string`

Events — `onFiltersOpenChange`, `onReset`, `onApply`, `onSearchChange`, `onSearchSelect`, `onSearchViewAll`, `onViewChange`, `onRefresh`, `onMoreSelect`

Put one Toolbar right above a list or table, under the PageHeader. It is one component. Left: a Filters button (when filters are passed), carrying a kit Count of how many filters are on and a search field, which with searchGroups opens a kit GlobalSearch dropdown of quick-navigation results; then, after a divider, the view picker and refresh. Right: a More menu and the actions, kit Buttons size sm with at most one strong brand Button, last. Filters toggles the filter bar under it: the filter chips (kit Dropdown trigger filter), then Reset and Apply filters, and an optional help icon at the end. Every part is optional; leave out what the list does not need. buttons subtle gives the buttons on the bar the bar's own grey instead of white paper, for a quieter bar; the search field keeps its white box either way. On a page that scrolls, the Toolbar stays at the top under the compact PageHeader bar, so what filters and acts on the list is in reach the whole way down; the patterns pin it, not the Toolbar itself. Under 1024px the toolbar keeps to one line: the filters, the search (it narrows first when space is short), the view and refresh, with the actions at the end. Under 640px, the kit's mobile break, the search takes a line of its own and everything else shares the next. When the actions do not fit on that line they fold into one Actions menu that lists them, then More's items after a divider. It is either the whole row of buttons or the one menu, never a wrapped row. If even the Actions button does not fit, it shows as an icon-only more button, still named Actions.

- Do not put a loose label and field, or a count of ticked rows, beside the toolbar. Pass field and selectedCount.
- Do not invent a FilterBar, ListToolbar or a local row of controls above a table.
- Do not open the filter bar when the screen loads. It starts closed; people open it with Filters, and filterCount still says the list is narrowed.

## overlay

### AlertDialog

Overlay that stops the user until they cancel or confirm.

Props — `open`: boolean; `title`: `string`; `description`: `string`; `cancelLabel`: `string`; `actionLabel`: `string`; `actionIntent`: `brand` | `danger` (default `brand`); `size`: `sm` | `md` (default `md`)

Events — `onCancel`, `onAction`

Use AlertDialog when the user must choose before going on, like leaving with unsaved changes or deleting something. Use Callout for a message on the page. Escape cancels. Clicking the backdrop does nothing. A portaled panel takes the theme of whatever opened it, so it is dark with a dark app frame even though it is drawn at the end of the page.

- Do not invent a local confirm dialog or use window.confirm.
- Do not put forms, tables or extra actions inside.
- Do not add a close X or close on backdrop click.

### Drawer

A panel that slides in from the right edge for a detail view or an edit form about something on the page, while the page stays in view behind it.

Props — `open`: boolean; `title`: `string`; `description`: `string`; `size`: `narrow` | `medium` | `wide` | `extended` (default `narrow`); `showClose`: boolean (default `true`); `children`: `ReactNode`; `footer`: `ReactNode`

Events — `onClose`

Use Drawer to show or edit one record next to the list it came from: a detail view, an edit form, related context. It is one component: pass open, title, onClose and the content as children. size picks the width: narrow 360 for quick views, medium 460 for forms, wide 590 for rich details, extended 1100 for side-by-side work. footer holds kit Buttons, size sm, at the end: subtle first, one strong brand Button last. Escape, the close button or a click on the page behind it closes it. The body is the box its content measures, not the window: inside narrow, medium and wide drawers, which are all under the kit's 640 break,.layout-split, the fixed metrics rows and Scoreboard go to one column or their phone shape on their own, and extended keeps columns. Stack blocks in the body with.layout-stack; the drawer has its own 20px padding, so do not put.layout-content inside it. For a decision that must block the page, use Modal or AlertDialog. A portaled panel takes the theme of whatever opened it, so it is dark with a dark app frame even though it is drawn at the end of the page.

- Do not use it for main navigation. Use AppNav.
- Do not open a drawer from inside another drawer.
- Do not use it for a decision that must block the page. Use Modal or AlertDialog.

### Dropdown

A short list of actions or options that opens from a Button or a FilterButton.

Props — `label`: `string`; `items`: `DropdownMenuEntry[]` { id, label, description?, icon?, danger?, disabled?, selected?, checkbox?, count? }; `trigger`: `button` | `filter` | `field` (default `button`); `emphasis`: `strong` | `subtle` | `minimal` (default `subtle`); `intent`: `brand` | `neutral` | `danger` (default `neutral`); `size`: `sm` | `md` | `lg` (default `md`); `icon`: `string`; `iconOnly`: boolean (default `false`); `count`: `number`; `alignment`: `left` | `right` (default `left`); `disabled`: boolean (default `false`); `closeOnSelect`: boolean (default `true`); `open`: boolean; `multiple`: boolean (default `false`); `id`: `string`; `text`: `string`; `muted`: boolean (default `false`); `badge`: `string`; `toggle`: `on` | `off`; `labelledBy`: `string`; `describedBy`: `string`; `searchable`: boolean (default `false`); `searchPlaceholder`: `string`; `empty`: `string`; `menuWidth`: `default` | `field` (default `default`)

Events — `onOpenChange`, `onSelect`, `onToggle`

Use Dropdown for row actions, a More menu, or filter options. trigger button uses the kit Button with a chevron (or an icon-only button); trigger filter uses the kit FilterButton with its count. Items are data: label, optional description, icon, danger, disabled, selected and checkbox, with { divider: true } between groups. For filters, use checkbox items and closeOnSelect false. The panel is a white card with a blue top line, placed under the trigger (above it when there is no room). Long lists scroll past 280px; searchable adds a search field on top. The menu is fixed and placed under its trigger, and it keeps inside the frame it is in: the app frame when the screen sits in one, else the window. It gives up width rather than hanging outside, so a phone-width frame gets a narrower menu, not one over the edge. A portaled panel takes the theme of whatever opened it, so it is dark with a dark app frame even though it is drawn at the end of the page.

- Do not invent DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, MenuDivider, ContextMenu or Popover cousins.
- Do not use for choosing a value in a form. Use Select.
- Do not put page navigation here. Use links.

### HelpPopover

A small help panel with an optional title and a short paragraph, opened from a ? icon beside a label or setting.

Props — `title`: `string`; `content`: `string`; `position`: `above` | `below` | `left` | `right` (default `below`); `delay`: `number`; `open`: boolean; `disabled`: boolean (default `false`); `children`: `ReactElement`

Wrap one focusable trigger, usually a ? help icon, in HelpPopover and pass title and content. It shows on hover and keyboard focus, and a click or tap pins it open until a click elsewhere, Escape, or another click. Form fields already use it: pass help on Input, Textarea, Select, DatePicker, FormulaEditor or FormDisplay and the label becomes the title. For a one-line name on an icon button, use Tooltip. A portaled panel takes the theme of whatever opened it, so it is dark with a dark app frame even though it is drawn at the end of the page.

- Do not invent Popover, HoverCard, InfoTip, ContextInfo or a local help panel.
- Do not use for an icon button's name. Use Tooltip.
- Do not put links, buttons or forms in it. Use Modal.

### Modal

A window over the page for a short task, a form or extra detail.

Props — `open`: boolean; `title`: `string`; `description`: `string`; `icon`: `string`; `size`: `sm` | `md` | `lg` | `xl` | `fullscreen` (default `sm`); `showClose`: boolean (default `true`); `children`: `ReactNode`; `footer`: `ReactNode`

Events — `onClose`

Use Modal for work that can be dismissed: a short form or extra detail. One component: title, description, body (children) and footer come from props. Put kit Buttons in footer, size sm, subtle first and one strong brand Button last. Escape, the close button and a backdrop click all close it. For a must-choose confirm, use AlertDialog. A portaled panel takes the theme of whatever opened it, so it is dark with a dark app frame even though it is drawn at the end of the page.

- Do not invent Dialog, DialogTrigger, DialogContent, ModalCard, Sheet or CommandDialog.
- Do not use for a must-choose confirm. Use AlertDialog.
- Do not put page navigation or long flows in a modal. Use a page.

### Tooltip

Brief extra text on hover or keyboard focus of one trigger.

Props — `content`: `string`; `position`: `above` | `below` | `left` | `right` (default `above`); `delay`: `number`; `open`: boolean; `disabled`: boolean (default `false`); `children`: `ReactElement`

Wrap one focusable kit piece, like a Button or an icon-only Button, in Tooltip and pass content. It shows after a short hover delay and at once on keyboard focus; Escape hides it. Keep it to a few words or one short sentence, and never put anything people must read or click in it. For a ? icon beside a field or setting, use HelpPopover; field help props already do. A portaled panel takes the theme of whatever opened it, so it is dark with a dark app frame even though it is drawn at the end of the page.

- Do not invent Popover, HoverCard, InfoTip or a local tooltip. For a titled help panel, use HelpPopover.
- Do not put required instructions in a tooltip. Use the field's hint.
- Do not put links, buttons or forms in it. Use Modal.
