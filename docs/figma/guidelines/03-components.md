# Agentic BP DS — components

Every component in the library, with its closed property lists. A property value
that is not on its line does not exist: do not add a variant, a size or a colour
the list leaves out.

How to read a property line. Choices are separated by `|` and the default is marked
with `*` — `size sm|md*|lg` means those three sizes and nothing else, `md` unless
you set it. `name bool` is a flag, `bool*` one that is already on. Anything else is
the type the property takes, with the fields of a row or item in braces after it.
`Functions` are the accessors a screen passes to decide how a row or cell is drawn.
Event handlers are left out: they change nothing you can see in a frame.

## base

### Avatar

Photo or initials for one person.

Props — name string; src string; initials string; size xs|sm|md*|lg; shape circle*|square; decorative bool

A person icon shows only if there are no initials either.

- Do not use for status or category labels.
- Do not make Avatar clickable. Wrap it in a Button or link only with a new contract.

### AvatarGroup

Overlapping row of kit Avatars with a +N count for the rest.

Props — label string; size xs|sm|md*|lg; shape circle*|square; max number; items AvatarGroupItem[] { name, src?, initials? }

Only kit Avatars go in the group.

- Do not put anything but people in the group.
- Do not use for one person. Use Avatar.

### Button

Triggers an action.

Props — emphasis strong|subtle*|minimal; intent brand|neutral*|danger; size sm|md*|lg; iconStart string; iconEnd string; iconSize sm|md|lg|xl; iconOnly bool; loading bool; toggle bool; disabled bool; fullWidth bool; type button*|submit|reset; children ReactNode

- iconSize — Icon size, 16 / 20 / 24 / 32. Leave out to follow the Button: 16 on sm, 20 on md and lg. Use a larger icon on an icon-only lg Button where the icon alone carries the action, like a phone footer.

Intent danger is only for work that cannot be undone. Only these pairs exist: strong with brand or danger, subtle with neutral, minimal with neutral, brand or danger. Accessibility is built in: native button, focus ring, loading and disabled states, and a label for icon-only buttons. This is for a Button standing on the page — a Toolbar, Section, Card or Timeline draws its own controls' blocks and never reaches it.

- Do not use for in-text navigation (use Link).
- Do not put two strong brand Buttons in one view.

### ButtonGroup

Joined row of kit Buttons that share one size and act as one control cluster.

Props — label string; size sm|md*|lg; disabled bool; children Button[]

- size — Applied to every Button in the group. Buttons inside do not set their own size. A surrounding Density changes these sizes through the density tokens (Default values shown).

Only kit Buttons go in a group.

- Do not mix sizes inside one group.
- Do not put more than one strong brand Button in a group or the view.

### FilterButton

Filter chip for lists and tables: shows the filter name or its chosen value, opens its options, and turns an applied filter on or off.

Props — size sm|md*|lg; open bool; disabled bool; count number; value string; toggle on|off; hasDropdown bool*; children string

- Do not use for page actions or view switches. Use Button or a Dropdown.
- Do not put more than one word or two in the name.

### Icon

Draws one Material Symbols Outlined glyph at a kit size, colored by the parent text color or a semantic icon role.

Props — name string; size xs|sm|md*|lg|xl; intent inherit*|neutral|subtle|brand|info|success|warning|danger; filled bool; label string

Pass a label only when the icon means something on its own.

- Do not inline SVGs or emoji.
- Do not size with custom px; use size enum.

## brand

### Illustration

A piece of drawn artwork from the product, like the picture over an empty page.

Props — name ai-chip|chat-search; size sm|md*|lg; animated bool; label string

Use Illustration where a screen needs a drawn picture rather than an icon or a logo: the art over an EmptyState, or the opening of an assistant panel. It is decorative by default and hidden from screen readers; pass label only when the picture is the only thing saying what the block is about. New artwork joins the name list here; do not paste an SVG into a screen.

- Do not paste an SVG into a screen or a pattern. Add the artwork here instead.
- Do not use it for an icon. Use Icon.

### Logo

Brand logo: the full wordmark or the mark alone, in fixed brand colors.

Props — type default*|symbol; label string

- type — default = mark + wordmark (145 x 28). symbol = mark only (22 x 32 frame).

Brand colors are fixed and never follow the theme tokens. In dark theme the wordmark text switches to the white reverse; the mark never changes.

- Do not recolor, retint or tokenize the logo. Brand colors are fixed.
- Do not redraw it, use an image of it, or paste the SVG into a screen. Use this component.

### LogoAI

AI logo for AI features: full logo or icon, in fixed brand colors.

Props — type default*|symbol; intent color*|monochrome|white|filled; label string

- type — default = mark + AI text (55 x 28). symbol = mark only (33 x 28).

- Do not recolor, retint or tokenize the logo. Brand colors are fixed.
- Do not redraw it, use an image of it, or paste the SVG into a screen.

## data

### BarChart

Values side by side as bars, one group or stack per category, like invoices by status for each week.

Props — label string; title string; subtitle string; showHeader bool*; categories string[]; series ChartSeries[] { name, values, intent?, projectedFrom?, axis? }; orientation vertical*|horizontal; highlight number | number[]; highlightIntent green|olive|cyan|orange*|pink|gray|purple|yellow|red|mint; stacked bool; barWidth wide*|thin; showValues bool; showGrid bool*; showLegend bool*; legendPosition top|bottom*|end; animate bool*; format number*|currency|percent; currency string; height number; emptyLabel string; referenceLines ChartReferenceLine[] { value, label, intent?, values?, note?, axis? }; marker ChartMarker { category, label }; selected number | null

- barWidth — wide: bars fill most of their category's space, with square corners. thin: every bar is 8px, like a medium Meter bar, with its rounded ends; a stack rounds only its two outer ends. For long runs of periods, like a month of days. Pointing anywhere in a category still shows its tooltip.
- marker — Upright charts only. A thin line down the chart at one category, counted from 0, with its label over the top, like Today.

- Do not use it for a long, smooth trend. Use LineChart.
- Do not use it for one share of a total. Use PieChart.

### Calendar

A full calendar of events by month, week, day or as a list, where people browse dates, filter calendars and add, edit or delete events.

Props — label string; events CalendarEvent[] { id, title, start, end?, allDay?, calendar?, intent?, note? }; defaultEvents CalendarEvent[]; calendars CalendarSource[] { id, name, intent?, hidden? }; view month|week|day|list; defaultView month*|week|day|list; views CalendarView[]; date string; defaultDate string; weekStart sunday*|monday; startHour number; readOnly bool

It is one component: pass events and, if events belong to calendars, calendars.

- Do not use it to pick one date or a range in a form. Use DatePicker.
- Do not use it for a timeline of one record's history or a list of due dates. Use Table.

### Card

One item in a grid or list of options people compare and pick, like a proposal line, product or plan: title, details, a price and a status note, with an optional image and a select checkbox.

Props — title string; overline string; badge string; badgeIntent BadgeIntent; description string; amount string; message string; messageIntent success*|warning|danger|info; image string; imageAlt string; icon string; selectable bool; selected bool; defaultSelected bool; disabled bool; href string; actions CardAction[] { id, label, icon }; menu DropdownMenuEntry[]

- title — The item name, an h3. Two lines at most. Without it, the overline (or else the description) names the card and its checkbox.
- actions — Icon buttons at the end of the footer, named by the action and the card. Two at most.

description is two lines at most. Give a Card the same actions as the record's Table row and ListView row, so switching views never changes what can be done.

- Do not build a card from a div with a border, or add a ProductCard, ProposalCard or CardFooter. Use Card.
- Do not use it for page sections. Use Section.

### Cell

Content for one table cell: text, a number, a date, a link, a redirect to another page, a person, a file, a status, a trend, progress, a switch, row actions or a row menu, a tree row, with an optional row checkbox.

Props — type text*|link|avatar|avatarGroup|file|payment|badge|badges|trendPositive|trendNegative|progress|actions|actionIcons|actionMenu|checkbox|tree|number|date|status|switch|popupTrigger|textBlock|redirect; size sm|md*; alignment start*|center|end; text bool*; checkbox bool; label string; href string; name string; src string; people CellPerson[] { name, src? }; icon string; intent BadgeIntent; badges CellBadge[] { label, intent? }; value string | number; actions CellAction[] { label, icon?, emphasis?, intent?, onClick? }; menu CellAction[]; checked bool; defaultChecked bool; level number; expanded bool; showLines bool*; treeToggle chevron|box*

- size — Row height 36 / 40 px. sm holds one line only (a textBlock at sm stops at the cell edge with an ellipsis); content with a second line (a name over an email) uses md. Side padding 12 px at both sizes, same as HeaderCell. Avatars stay xs (24 px), Badge and Checkbox small (20 / 16 px), so rows keep their height. A surrounding Density changes these sizes through the density tokens (Default values shown).
- alignment — Same as HeaderCell: end for numbers and amounts, center for a checkbox-only column. type number defaults to end.
- checkbox — Leading row Checkbox before the value, labeled Select {label or name}. For a column with only the Checkbox, use type checkbox.
- actions — For actions (labeled, up to 3), actionIcons (icon only, up to 3, label becomes the name and a kit Tooltip) and actionMenu (menu items, danger intent becomes a danger item). onClick runs when picked.

Pick the type from the data: text for plain values, number for amounts and counts (end-aligned, even-width digits), date for a day, textBlock for a note that wraps over several lines (md only), link to open a record, redirect to go to another page in the app (brand link text with an outward arrow), popupTrigger for grey underlined text with an open_in_full mark that opens a popup the screen owns, avatar for a person, badge for status, status for a coloured dot and a label, trend for change, progress for how far along something is, actions for row buttons, actionMenu for a More menu, switch to turn a row setting on or off right away, checkbox for a column with only the row Checkbox, tree for the first cell of parent and child rows (an indent per level, faint guide lines and the outlined plus or minus square to open and close its children; treeToggle chevron swaps the square for a chevron button). Cell composes kit Avatar, AvatarGroup, Badge, Button, ButtonGroup, Checkbox, Dropdown, Icon, Link, Meter and Switch; it never draws its own. In a box narrower than 640px, the kit's mobile break, the icon buttons fold into that More menu and the cell keeps one button, so the row's own values get the width; only one of the two is in the layout, so nothing is reached twice by the keyboard.

- Do not draw a progress bar in a cell. Use type progress; it is a kit Meter.
- Do not use Badge for trends. Use a trend type.

### ChatMessage

One turn in a chat with the assistant: what the person asked, or what the assistant answered, with its workings, buttons and suggestions.

Props — author user|assistant; text string; children ReactNode; bubble bool; status string; sections ChatMessageSection[] { id, label, count?, content, defaultOpen? }; actions ChatMessageActionId[]; pressed ChatMessageActionId[]; suggestions ChatSuggestion[] { id, label }; menu DropdownMenuEntry[]; person { name?: string; src?: string; initials?: string }; label string

- apply — One action that puts the answer to work where it was asked, like Insert into formula on a suggested formula. It is a kit Button under the answer, before the suggestions, and there is only ever one: the icon row (copy, good, needs work, share, read aloud) stays what it is. Only an assistant answer takes it.

Functions — apply

actions draws the row of buttons at the very bottom of an answer (copy, good work, needs work, share, read aloud), after the workings and the suggestions, never above the answer, and pressed keeps the one that was picked lit.

- Do not build a bubble from your own divs, or add a ChatBubble, MessageRow or AiAvatar. Pass the props.
- Do not use it for an alert or a system notice. Use Callout or Toast.

### DataGrid

An editable table: people click a cell to add or change its content, like rule conditions, line items or mappings.

Props — columns DataGridColumn[] { key, header, type?, options?, searchable?, searchPlaceholder?, placeholder?, readOnly?, hug?, width?, fields?, onCalculate?, setForAll?, opensDetail? }; rows DataGridRow[] { id, [key] }; defaultRows DataGridRow[]; size sm|md*; line medium*|thin; rowNumbers bool*; canAddRows bool; canRemoveRows bool; canDeleteRows bool; canInsertRows bool; insertLabel string; selectable bool; selected string[]; defaultSelected string[]; rowLabel string; emptyLabel string; label string; stickyFirstColumn bool*; expanded string[]; defaultExpanded string[]; collapsed string[]; defaultCollapsed string[]; totalRow DataGridRow; legend DataGridLegendItem[] { intent, label, icon? }

- columns — type defaults to text. options for select. date cells are always a kit DatePicker (size sm); their value is an ISO date, YYYY-MM-DD, shown formatted, and placeholder fills the empty field. A readOnly date column has no picker: it writes the same formatted date as plain text in the row's own font, so a column people cannot change does not read as code. fields and onCalculate for formula, passed to the FormulaEditor. hug makes the column only as wide as its content; otherwise it is at least 160 wide. width is a CSS width. searchable adds a search field at the top of a select column's list that filters options by label, for long lists like a product catalog; searchPlaceholder names it (default Search). setForAll adds a Set for all menu under the column title: Use row 1 value copies the first row's value to every row, Clear all rows empties the column. opensDetail (on a readOnly column, with detail and detailCount) puts a kit Button holding a Count of the other values after the cell's value that opens and closes the row's detail, and the grid drops its toggle column. The open detail lines up under that column (at least --data-grid-detail-min wide, 360px) and slides back toward the start when it would run past the grid's visible edge: use it when the cell shows the first of several values, like the first rate band.
- canRemoveRows — An X button in the action column, named Remove row 2 by a kit Tooltip. It takes the row out of this grid only; nothing else in the app changes. For a row that holds a saved record, pair it with canDeleteRows.
- canDeleteRows — A trash button in the action column, named Delete row 2 by a kit Tooltip. It is the destructive one: the row goes, and so does the record behind it, everywhere in the app. It asks first in a kit AlertDialog — the grid owns that — and only on Delete does the row go and onDeleteRow run. With insert and remove also on it is the action that moves into the More menu.
- totalRow — A row at the bottom that adds the others up, like Period total: read only, on bg-neutral-subtle, medium weight. Its value per column key; it is never selectable, grouped or given actions.

Functions — deleteConfirm, actionsFor, detail, detailCount, rowParent, cellStatus, cellReadOnly, cellLink

Each column has a type: text and number cells edit in place with a kit Input, select cells are a kit Select, formula cells open a kit FormulaEditor in the cell, date cells are a kit DatePicker, and readOnly columns only show. Keep remove and delete apart: a row people only meant to take off a quote is removed, not deleted. Delete asks first in a kit AlertDialog and only then calls onDeleteRow. For read-only lists use Table. Inside a loading page it draws its own skeleton in place: the real grid, with its own columns and their widths, its header row and its line, a 64x8 bar for every column name and a 10px bar instead of a value or an editor in every data cell — one body row per row it has, to the same ceiling of twelve a booting Table keeps, or three when it has none yet — at its own row heights (38 / 40, not Table's 36 / 40), so nothing moves when the rows land. Add row stays as a block its own size under the grid, and totalRow and legend keep their row with bars, only when they were passed.

- Do not use it to show data people only read. Use Table.
- Do not put loose checkboxes beside the grid to pick rows. Pass selectable.

### FunnelChart

Steps that narrow, as one solid stack: how many of the ones who started a flow reached each step, like quotes to orders to invoices to payments.

Props — label string; title string; subtitle string; showHeader bool*; steps FunnelStep[] { label, value, intent? }; direction funnel*|pyramid; labels legend*|beside; showValues bool*; rate none|ofFirst*|ofPrevious; showLegend bool*; legendPosition top|bottom*|end; animate bool*; format number*|currency|percent; currency string; height number; emptyLabel string

direction funnel narrows down from the first step; pyramid is the same stack the other way up, building to its base, for tiers of a base rather than a flow.

- Do not use it for steps that are not subsets of each other. If someone can skip a step or come back, it is not a funnel: use BarChart.
- Do not use it for a trend over time. Use LineChart.

### HeaderCell

Column title for a data table: uppercase label, optional select-all checkbox, optional sort, with a brand-faint bottom border, 2px or 1px.

Props — label string; size sm|md*; alignment start*|center|end; line medium*|thin; checkbox bool; checked bool; defaultChecked bool; indeterminate bool; sortable bool; sort none*|asc|desc

- label — Column title, shown uppercase. Omit for a checkbox-only or empty column.
- alignment — end for numbers and amounts. center for a checkbox-only or actions column.

Use HeaderCell inside th scope=col, one per column, above Cell rows. Use alignment end for number columns and center for a checkbox-only or actions column.

- Do not use Cell for column titles, or HeaderCell in body rows.
- Do not mix HeaderCell and Cell sizes in one table.

### Heatmap

A grid where the weight of each cell is its value, like API calls by day and hour, so the busy patches show at a glance.

Props — label string; title string; subtitle string; showHeader bool*; rows string[]; columns string[]; values (number | null)[][]; intent green|olive|cyan|orange|pink|gray|purple|yellow|red|mint; size sm|md*|lg; showValues bool; showLegend bool*; lowLabel string; highLabel string; format number*|currency|percent; currency string; emptyLabel string

One intent carries five steps of weight up to the highest value in the grid, so the colour never changes, only how much of it there is; a cell with no value draws empty.

- Do not use it when people need the exact numbers. A Table or DataGrid says them; a heatmap shows where they cluster.
- Do not use it for one row of values. Use BarChart, or Sparkline in a cell.

### Legend

The key to a drawing: a small colour mark per name, so people can read what each colour means.

Props — items LegendKey[] { id?, label, intent?, value?, shape?, strong? }; orientation horizontal*|vertical; alignment start|center*|end; shape square*|line|dot|outline; size sm|md*; hidden string[]; defaultHidden string[]; label string; decorative bool

An outline key is the empty box, for what is left rather than used — a usage bar keys what is still to spend that way beside its filled parts — and it takes no intent.

- Do not add a second legend under a kit chart; the chart draws its own. Use showLegend and legendPosition to place it.
- Do not use it as a list of filters or tags. Use Badge or FilterButton.

### LineChart

How values change over time as lines or filled areas, one per series, like revenue by month or invoices approved by day.

Props — label string; title string; subtitle string; showHeader bool*; categories string[]; series ChartSeries[] { name, values, intent?, projectedFrom?, curve? }; area bool; stacked bool; showPoints bool; showValues bool; showGrid bool*; showLegend bool*; legendPosition top|bottom*|end; animate bool*; format number*|currency|percent; currency string; height number; emptyLabel string; referenceLines ChartReferenceLine[] { value, label, intent?, values?, note? }; marker ChartMarker { category, label }

A reference label keeps clear of the marker's line and label, other reference labels and the points near the end of a line: it moves to the other side of its line, or slides left, rather than drawing over them.

- Do not use it for categories without an order, like regions. Use BarChart.
- Do not use it for one share of a total. Use PieChart.

### ListView

A list of records, one a row: a primary and a secondary line with an avatar, icon or image before them, and badges, actions, a chevron or a drag handle after, grouped under headers when the list is long, and stepping into nested lists in place.

Props — label string; items ListViewItem[] { id, primary, secondary?, group?, avatar?, icon?, image?, badge?, badgeIntent?, badgePosition?, unread?, message?, messageIntent?, actions?, disabled?, children?, menu? }; groups ListViewGroup[] { id, title }; size sm|md*|lg; collapsible bool; stickyGroups bool; collapsed string[]; defaultCollapsed string[]; selection none*|single|multiple; selected string[]; defaultSelected string[]; interaction none*|drill|drag; path string[]; defaultPath string[]; nesting step*|expand; expanded string[]; defaultExpanded string[]; detail ReactNode

- selection — single: a click picks one row, shown light blue between brand lines. multiple: a checkbox on each row; checked rows are light blue. none: rows only show, open or move.

Use ListView when each record reads best as a line or two of text rather than as columns: people, invoices, messages, tasks, files. To show a picked record beside the list rather than going to its page, put the ListView in the ListDetail pattern. Rows are spaced like a kit Table: inset 12 at every width, the checkbox takes only its own width, and the text starts 24 after it, so a ListView and a Table of the same records line up when a screen switches between them. It draws at most twelve rows, however long the list is: twelve 44px rows is about a screenful, and the rest would only pulse below the fold.

- Do not use it for values people compare across columns. Use Table or DataGrid.
- Do not use it for a short set of links. Use LinkList.

### NavTile

A way in to somewhere: the name of a place, a line about what is in it, and a colored icon square.

Props — title string; description string; icon string; intent brand*|green|olive|cyan|orange|pink|gray|purple|yellow|red|mint; href string; disabled bool

Lay a set of them out with the.layout-metrics class from `02-tokens.md`, never a grid of your own.

- Do not use it to compare or pick options; that is Card.
- Do not put buttons or fields inside it. The whole tile is one link.

### PieChart

How a whole splits into a few parts, as a donut or a solid pie, like payments by method.

Props — label string; title string; subtitle string; showHeader bool*; data PieChartSlice[] { label, value, intent? }; donut bool*; size sm|md*|lg; showTotal bool*; totalLabel string; showLegend bool*; legendPosition end*|bottom; alignment start*|center; maxSlices number; otherLabel string; animate bool*; format number*|currency|percent; currency string; emptyLabel string

- Do not use it for many parts or values over time. Use BarChart or LineChart.
- Do not switch the legend to bottom only to centre the chart. Use alignment center.

### RadarChart

Several measures on one shape: each point of the web is a measure, each series an outline across all of them, so two things can be compared on every measure at once.

Props — label string; title string; subtitle string; showHeader bool*; axes string[]; series RadarSeries[] { name, values, intent? }; levels number; max number; fill bool*; showScale bool; showLegend bool*; legendPosition top|bottom*|end; animate bool*; format number*|currency|percent; currency string; height number; emptyLabel string

- Do not use it for measures in different units. Every point shares one scale, so money beside a percent is a lie.
- Do not use it for a trend over time. Use LineChart.

### ScatterChart

Two measures against each other, one dot per record, so a pattern between them shows: spend against usage, days late against balance.

Props — label string; title string; subtitle string; showHeader bool*; series ScatterSeries[] { name, intent?, points }; xName string; yName string; xFormat number*|currency|percent; yFormat number*|currency|percent; currency string; showGrid bool*; showLegend bool*; animate bool*; height number; emptyLabel string

- Do not use it for a trend over time. Time belongs on an ordered axis: use LineChart.
- Do not use it for a handful of records. Three dots are a Table; a scatter earns its place past a few dozen.

### Scoreboard

A strip of key numbers at the top of a screen, like open invoices, revenue or overdue amount, each with an optional trend and spark chart.

Props — items ScoreboardItem[] { id, title, metric, metadata?, badge?, trend?, chart? }; selectable bool; selected string | null; defaultSelected string | null; scroll bool*; label string

Past four cards the Scoreboard puts itself in a Conveyor, so arrows at both ends move the row; the arrows show only when the cards do not fit. On a box narrower than 640px, the kit's mobile break, the cards take a smaller minimum so two are in view, the strip snaps card by card, and the Conveyor's arrows give way to swiping.

- Do not build a metric row from your own divs or cards, or add a MetricCard, ScoreCard or Sparkline. Pass items.
- Do not use the chart as a real chart; it only shows the shape of the trend. Use a chart for readable data.

### Sparkline

A trend small enough to sit in a table cell or on a tile: the shape of the last few periods, with no axes and no numbers.

Props — label string; values number[]; kind line*|area|bar; intent green|olive|cyan|orange|pink|gray|purple|yellow|red|mint; size sm|md*|lg; showLast bool; showBaseline bool; format number*|currency|percent; currency string; emptyLabel string

- Do not use it as the chart on a page. Use LineChart or BarChart.
- Do not use it on a Scoreboard tile. A Scoreboard card draws its own trend: pass chart.points on the item.

### Table

A semantic table of rows and columns, like invoices or accounts, with optional row selection, a caption and a total.

Props — columns TableColumn[] { key, header?, alignment?, numeric?, emphasis?, width?, maxWidth?, opensDetail? }; rows TableRow[] { id?, [key] }; size sm|md*; line medium*|thin; caption string; footer TableFooter { label, value }; emptyLabel string; selectable bool; selected string[]; defaultSelected string[]; rowLabel string

- columns — key picks the row value. numeric aligns to the end with tabular digits. emphasis makes the column's text medium weight, like the record id. width is a CSS width, like 30%. maxWidth is a CSS width, like 240px: a long text or link value stops there and ends with an ellipsis instead of widening the table, and the whole value shows on hover and stays for screen readers. opensDetail (with detail and detailCount) puts a kit Button holding a Count of the row's other values after the cell's value; it opens and closes the row's detail under the row, lined up under that column.

Functions — detail, detailCount

selectable adds a checkbox column: each row gets a checkbox Cell and the header a select-all that shows a dash when only some rows are picked. Search, filters and actions belong in a Toolbar above it. Every cell keeps its value on one line at any width, so a name, a contract, a date or an amount never wraps down its cell. When the columns need more room than the box has, the box itself takes the sideways scroll — the page never slides — and the first column, which names the row, freezes against the start edge while the rest of the row slides under it; with selectable, the checkbox column freezes with it, so a row can still be ticked while it is read. That is a trade rather than a setting: a cell can only hold still against whatever scrolls, so once the box scrolls, the names hold at the top of the box rather than at the top of the page. For parent and child rows, put a Cell type tree in the first column and list only the rows whose parents are open. Inside a loading page it draws its own skeleton in place: the real table, with a 64x8 bar for every column name and a 10px bar instead of a value in every body cell — one body row per row it has, to a ceiling of twelve — about a screenful of 44px rows, so a list of hundreds does not animate hundreds of bars below the fold — or three when it has none yet, and nothing over the tick cell or a column with no name, at the heights and between the lines the table always keeps (BP COBALT "Skeleton / list row"), so a related list under a form arrives in the shape its skeleton held.

- Do not draw cell content yourself. Use kit Cell types for badges, people, links and row actions.
- Do not put search or filters in the table. Use a Toolbar above it.

### Timeline

What happened on a record, newest first: a circled icon per entry joined by a line, with the note, links and action for each one.

Props — items TimelineItem[] { id, title, timestamp?, subtitle?, icon?, intent?, notes?, links, action?, menu? }; size sm|md*; label string

It draws at most twelve entries, however long the thread is: twelve 44px rows is about a screenful, and the rest would only pulse below the fold.

- Do not build a feed from your own divs, or add a TimelineItem, ActivityCard or FeedRow. Pass items.
- Do not use it for steps in a flow. Use Steps.

### TreeView

A nested list people open and close level by level, like teams in an organization, project folders or account hierarchies, to pick, check or reorder items.

Props — label string; items TreeItem[] { id, label, icon?, disabled?, children? }; defaultItems TreeItem[]; selection none|single*|multiple; selected string[]; defaultSelected string[]; expanded string[]; defaultExpanded string[]; showIcons bool; showLines bool*; reorderable bool; size sm|md|lg

- selection — single: one highlighted row. multiple: a checkbox on each row; a folder checks its whole branch. none: rows only open and close.

selection single highlights one row (clicking a folder also opens it); multiple adds a checkbox to each row that checks a folder's whole branch and shows a dash when only part of it is checked; none only opens and closes.

- Do not use it for a flat list. Use Table, Select or RadioGroup.
- Do not use it for main app navigation. Use AppNav.

### UsageBar

One bar for everything available in a period, split into the parts it is made of: what each part used, what is left, and anything spent past the allowance.

Props — segments UsageBarSegment[] { id, value, kind?, intent?, label?, note?, recent?, legend? }; figures UsageBarFigure[] { value, label, at, intent? }; showLegend bool*; label string

- figures — Up to three, one per place. Leave it out for a bar with no figures above it.

The legend under the bar is the kit Legend, one key per used intent plus Left to use, keyed as an outline rather than a colour, and, when there is one, Over the allowance; turn it off with showLegend false.

- Do not use it for one limit with one number. Use Meter, or UsageList for several limits each with their own bar.
- Do not use it to compare periods or trends. Use BarChart or LineChart.

### UsageList

A list of usage limits, one a row: the limit's name, how much is used of it, a bar, and a short note, like API calls, storage and seats on a plan.

Props — items UsageListItem[] { id, label, used, limit, unit?, note? }; label string

- Do not build usage rows from a Table with a Meter column, or from loose bars and text. Use UsageList.
- Do not use it for task progress, like an upload or a setup checklist. Use Meter or Steps.

### WaterfallChart

How a balance got from one total to another: an opening total, the rises and falls that moved it, and the closing total.

Props — label string; title string; subtitle string; showHeader bool*; items WaterfallItem[] { label, value, kind?, intent? }; riseIntent green|olive|cyan*|orange|pink|gray|purple|yellow|red|mint; fallIntent green|olive|cyan|orange*|pink|gray|purple|yellow|red|mint; totalIntent green|olive|cyan|orange|pink|gray*|purple|yellow|red|mint; showValues bool*; showConnectors bool*; showGrid bool*; showLegend bool; animate bool*; format number*|currency|percent; currency string; height number; emptyLabel string

It is one component: pass items, one per bar, in the order they happened.

- Do not use it for a trend over time. Every bar here is a step in one sum, not a period: use LineChart or BarChart.
- Do not use it for parts of a total that do not run in an order. Use PieChart or a stacked BarChart.

## feedback

### Badge

Short status or category label.

Props — intent neutral*|hollow|info|success|warning|danger|highlight; emphasis subtle*|strong|faint; size sm*|md|lg; icon string; iconOnly bool; removable bool; disabled bool; children string

- intent — hollow = outline only. highlight = purple, for new or featured.
- icon — Material Symbols name. Leading icon (12px, 16px at lg), or the only content when iconOnly.
- children — One to three words. Also the label for icon-only badges.

Pick the intent from meaning and the emphasis from how loud it should be: subtle is the default, strong for the one thing that must stand out, faint for quiet lists. Only dismissible filters are removable.

- Do not use as a button or link. Only the close button is interactive.
- Do not use for people. Use Avatar.

### BadgeAlt

Alternate status or category label: tinted fill with a matching border, in three sizes.

Props — intent neutral*|brand|success|warning|danger|info; size sm|md*|lg; removable bool; disabled bool; children string

Use Badge by default; use BadgeAlt only where a screen already uses this style. Do not mix Badge and BadgeAlt on one screen. Only dismissible filters are removable.

- Do not use BadgeAlt where Badge fits. Badge is the default.
- Do not mix Badge and BadgeAlt on one screen.

### Callout

Inline message that stays on the page, with an optional action and dismiss.

Props — intent info*|success|warning|danger; title string; actionLabel string; closeButton bool; children ReactNode

Keep it to one or two sentences and at most one action.

- Do not use for short status labels on rows or cards.
- Do not use for pop-up messages that disappear on their own.

### Count

Small number badge for counts, like unread items on a nav link or tab.

Props — intent info*|danger|neutral; size sm|md*|lg; subtle bool; disabled bool; count number; max number; label string

- Do not put words in a Count. Use Badge.
- Do not use Count as a button.

### EmptyState

What a list, page or panel shows when it has nothing yet: an icon, a title, a line of help and the action that fills it.

Props — title string; description string; icon string; iconStyle well*|plain; media ReactNode; actions ReactNode; outlined bool; headingLevel 2|3|4

- Do not use it for page messages like errors or warnings. Use Callout.
- Do not use it while content is loading.

### LoadingLine

A 2px line with a short brand bar sliding across it, saying a whole page or panel is still arriving when there is no amount done to report.

Props — loading bool*; track line*|none; label string

It never shows how far along the load is. A page that lands inside the first 200ms never shows a skeleton at all, and a skeleton that has appeared is never blinked away the moment the data arrives.

- Do not use it when the amount done is known. Use Meter.
- Do not use it as the legacy 20px determinate bar. Use ProgressBar.

### Meter

How far along or how full something is, from 0 to 100, as a bar, a ring or a half ring, with optional red, amber and green zones.

Props — value number | "indeterminate"; label string; shape bar*|circle|semicircle; size sm|md*|lg; thresholds none*|bar|plotArea|all; intent info|success|warning|danger; referenceLines bool; showValue bool; datatip string

- Do not use it for a short wait of unknown length in the spot that is loading. Show a Spinner. indeterminate is for a bar that sits with the work, like a loading Toast, or that will get a value later.
- Do not use indeterminate with circle or semicircle; it is bar only.

### ProgressBar

The older 20-tall progress bar with its percent written on or beside it, for screens that still use the legacy look.

Props — value number; label string; valueLabel string; showLabel bool*; labelPosition center*|right

Use ProgressBar only to match screens built with the older progress bar.

- Do not use it for waits of unknown length. Show a spinner instead.
- Do not stack several bars for one process. Use one bar with a clear label.

### Skeleton

Gray placeholder shapes in the layout of content that is still loading, like lines of text, an avatar or an image, so the page keeps its shape until the data arrives.

Props — shape text*|circle|rect; lines number; size sm|md*|lg; width string | number; height string | number; animation shimmer*|pulse|none; tone default*|band|brand; loading bool*; children ReactNode; label string

Inside a booting AppShell a skeleton follows the frame's sequence rather than its own clock: it waits out the line's first 200ms and is then held at least 400ms.

- Do not use it for a short status line. Use TextLoader.
- Do not use it when the amount done is known. Use Meter.

### Spinner

A small ring of ticks in the brand color that turns while something loads and the wait is short and unknown.

Props — size sm|md*|lg; label string; showLabel bool

- Do not put it in a Button. Use Button loading.
- Do not use it when the amount done is known. Use Meter.

### TextLoader

Short text with a soft wave of light running through it, for a moment of work whose end is unknown, like Generating response… or Syncing invoices….

Props — children string; size sm|md*|lg; speed slow|normal*|fast

- Do not use it for headings or body copy.
- Do not use it for long text; keep it to a few words.

### Toast

A short note that floats in after an action, like Saved successfully, and goes away on its own after a few seconds, with an optional Undo.

Props — open bool; title string; description string; intent info*|success|warning|danger; actionLabel string; progress number | "indeterminate"; duration number | null

It has no countdown and never closes itself, and Escape does not close it: actionLabel, like Cancel, is the way out (onAction runs, then onClose), and the screen sets open to false when the work is done. For messages that must stay on the page, use Callout. A toast is not opened by anything in particular, so it follows the page's own theme rather than a frame's.

- Do not use it for errors people must fix or read later. Use Callout on the page.
- Do not put more than one action in a toast.

## form

### Cascader

Pick one item from options that nest several levels deep by walking columns left to right, like a field on a related object (Invoice / Account / Owner) or a region / country / city.

Props — label string; options CascaderOption[] { value, label, path?, type?, relation?, disabled?, children? }; value string[]; defaultValue string[]; variant field*|panel; changeOnSelect bool; searchable bool; hasLegend bool*; placeholder string; size sm|md|lg; labelPosition top|start; labelWidth sm|md*|lg; hideLabel bool; name string; required bool; disabled bool; invalid bool; error string; hint string; help string; emptyLabel string

- hasLegend — The legend bar under the columns, explaining the relation marks. Shows only when some option has a relation.

Only the last level can be picked unless changeOnSelect lets any level be the answer.

- Do not use it for a flat list. Use Select.
- Do not use it to browse or arrange a hierarchy without picking. Use TreeView.

### ChatComposer

The box people write to the assistant in: what the question is about, what is attached, the words, and the toolbar that sends it.

Props — value string; defaultValue string; placeholder string; hints string[]; scopeLabel string; scoped bool; defaultScoped bool; attachments ChatComposerAttachment[] { id, label }; addMenu DropdownMenuEntry[]; selecting bool; dictating bool; mode quick*|deep; disabled bool; label string

- scopeLabel — What the question can be scoped to, like Accounts page. Pass it only on a screen there is something to scope to; without it there is no scope row.
- mode — quick answers fast; deep thinks longer. The button stays lit on deep. It only shows when onModeChange is set.

- Do not build the box from Textarea and Buttons, or add a MessageBox, PromptInput or SendButton. Use this.
- Do not use it for an ordinary form field. Use Textarea.

### Checkbox

Checkbox for multi-select and confirmations.

Props — size sm|md*|lg; checked bool; defaultChecked bool; indeterminate bool; error bool; disabled bool; hideLabel bool; label string; name string; id string

Indeterminate is only for a parent that reflects mixed children.

- Do not use for one choice from several.
- Do not use as a submit action. Use Button.

### DatePicker

A date field that opens a calendar to pick one date, or a range between two dates.

Props — label string; type single*|dual; size sm|md*|lg; labelPosition top*|start; labelWidth sm|md*|lg; hideLabel bool; placeholder string; value string | DatePickerRange; defaultValue string | DatePickerRange; minDate string; maxDate string; presets bool*; monthYear title*|menus; name string; id string; required bool; disabled bool; invalid bool; error string; hint string; help string

- presets — Type dual only: Today, Yesterday, This week, Last week, This month, Last month, This year, Last year.

- Do not use two DatePickers for a start and end. Use type dual.
- Do not use for time. There is no time picker yet.

### Form

One form: an optional title, kit fields (or titled sections of them) and the actions that save it.

Props — title string; description string; variant plain*|card; labelPosition top*|start; labelWidth sm|md*|lg; columns 1|2|3; children ReactNode; sections FormSection[] { title, help?, actions?, content, line?, collapsible?, expanded?, defaultExpanded?, onExpandedChange? }; actions ReactNode; error string; id string

- labelWidth — How wide the start-label column is: sm 140px for a form of short names (Email, Status, Currency), md 234px, the product's own column, which fits a name as long as Account Ledger Number on one line, and lg 320px where the names run longer than that. Pick one for the whole form: the fields inside read the Form's column, so setting labelWidth on a field in a form makes the labels down that column stop lining up. A field's own labelWidth is for one standing outside a Form. The field beside the label stays 308px at every step, so the column itself narrows or widens, and the points where the labels go back on top and where columns give way move with it: labels go on top under 460px (sm), 554px (md) or 640px (lg). Read only with labelPosition="start"; with labels on top there is no column to size.
- columns — 2 puts fields side by side, left to right; 3 puts them in threes, for a long form on a wide page. A Textarea spans the row, and so does a DataGrid (like a product's rate bands), which needs the width for its columns; with start labels the grid starts at the section's edge, since its column headers stand in for a label. Set, each column is at most 554px (--layout-column-max) and the fields stay at the start: on a wide page the space past the last column stays empty. Unset, the Form takes the columns of the FormPage or RecordPage it is in; outside one, the fields stack in one column that fills the form, as in a Modal or Drawer. Never more than 3. Columns give way as the form narrows: three become two under 720px (1301px with start labels), and two become one under 560px (867px with start labels). A narrower or wider labelWidth moves the start numbers with it: three become two under 1019px (sm) or 1559px (lg), two become one under 679px (sm) or 1039px (lg). Below 1280px of viewport the fields are one column whatever room the box has, which is where BP COBALT puts the record's and the form's break; above it the box decides.

Read-only values go in FormDisplay rows; back-to-back rows sit flush as one list. Once columns is set (1, 2 or 3), each column stops at 554px (--layout-column-max) and the fields stay at the start, so a wide page leaves the space on the right empty instead of stretching the fields; with columns unset, the fields fill the form, as in a Modal or Drawer.

- Do not put a Form inside another Form.
- Do not put more than one strong brand Button in actions.

### FormDisplay

A read-only label and value, like a form field that shows data instead of editing it.

Props — label string; value ReactNode; labelPosition top*|start; labelWidth sm|md*|lg; help string; empty string

Inside a Section, wrap the stack in one div, or the Section's gap spaces the rows apart; the exception is a Section with columns (or one in a RecordPage, which gives its Sections columns), where the rows go straight in as children and flow into columns left to right, each at most 554px and kept at the start, with no gap between rows.

- Do not put a gap or margin between stacked FormDisplays, or pass them to a Section one by one. Wrap the stack in one plain div, unless the Section has columns: then pass the rows straight in.
- Do not lay rows side by side with your own grid or flex. Use Section or Form columns.

### FormulaEditor

A monospace field for writing formulas and rules, with a toolbar that inserts fields, operators and functions and checks the syntax.

Props — label string; hideLabel bool; labelPosition top*|start; labelWidth sm|md*|lg; size sm*|md|lg; placeholder string; value string; defaultValue string; fields FormulaField[] { id, label }; functions FormulaFunction[] { name, syntax?, description? }; aiActive bool; name string; id string; required bool; disabled bool; readOnly bool; invalid bool; error string; hint string; help string

- aiActive — The assistant is open for this field: the AI assistant button shows toggle on, so it is clear which field the answer will land in. The screen owns it, since only it knows what the assistant is attached to.

- Do not use for prose or notes. Use Textarea.
- Do not use for one-line values. Use Input.

### Input

Single-line text entry with its own label, hint, error and character count.

Props — label string; hideLabel bool; labelPosition top*|start; labelWidth sm|md*|lg; size sm|md*|lg; type text*|email|password|search|number|tel|url|file; placeholder string; value string; defaultValue string; accept string; multiple bool; name string; id string; autoComplete string; required bool; disabled bool; readOnly bool; invalid bool; error string; hint string; help string; prefix string; suffix string; iconStart string; iconEnd string; maxLength number

- type — file opens the native file picker. value, defaultValue, placeholder, prefix, suffix and maxLength do not apply to it. number shows kit up and down chevrons at the end instead of the browser spinner; arrow keys still step by 1.

- Do not use a placeholder as the label. Pass label, and hideLabel if it must not show.
- Do not use for long text. Use Textarea.

### Lookup

A form field for picking one record from a long list, like a product or an account, through a searchable table in a wide Modal.

Props — label string; columns TableColumn[]; rows LookupRow[]; value string | null; defaultValue string | null; labelKey string; title string; icon string; searchPlaceholder string; pageSize number; clearable bool*; placeholder string; emptyLabel string; size sm|md|lg; labelPosition top|start; labelWidth sm|md*|lg; hideLabel bool; name string; required bool; disabled bool; invalid bool; error string; hint string; help string; multiple bool; trigger field*|button; buttonIcon string; confirmLabel string

Functions — detail, detailCount

With trigger button a kit Button opens it instead of a field, for adding a batch of records to a list or grid.

- Do not use it for a short list of plain options. Use Select.
- Do not use it for a path through nested levels. Use Cascader.

### RadioGroup

Pick exactly one option from a short visible list.

Props — size sm|md*|lg; orientation vertical*|horizontal; layout list*|card; disabled bool; hideLegend bool; labelPosition top*|start; labelWidth sm|md*|lg; legend string; name string; value string; defaultValue string; error string; hint string; options RadioGroupOption[] { value, label, description?, badge?, badgeIntent?, disabled?, hideLabel? }

- orientation — Horizontal only for two or three short labels. Card layout is always vertical.
- options — Two to six. description and badge show in card layout. hideLabel keeps an option's label for screen readers only and shows the bare circle (list layout), for a choice whose row already says it.

The legend names the group; hide it only when a heading already names it.

- Do not use for independent yes/no choices. Use Checkbox.
- Do not use for long lists of options.

### Segmented

One choice from two to five options, shown as kit minimal Buttons side by side.

Props — label string; hideLabel bool; options SegmentedControlOption[] { value, label, icon?, disabled? }; value string; defaultValue string; size sm|md*|lg; iconOnly bool; fullWidth bool; disabled bool; name string

- iconOnly — Takes the words off the options and leaves their marks, for a switcher that needs no reading, like light and dark. Give every option an icon: one without keeps its label. The label is still the option's name for screen readers, the way an iconOnly Button keeps its children.

- Do not use for more than five options or long labels. Use Select.
- Do not use iconOnly without an icon on every option, or for options whose marks do not say what they are on their own.

### Select

Choose one or several options from a list.

Props — label string; options SelectOption[] { value, label, disabled? }; size sm|md*|lg; labelPosition top*|start; labelWidth sm|md*|lg; itemCheck check*|checkbox; hideLabel bool; multiple bool; placeholder string; value string | string[]; defaultValue string | string[]; maxVisible number; searchable bool; searchPlaceholder string; name string; id string; required bool; disabled bool; invalid bool; error string; hint string; help string; menuWidth default*|field

- menuWidth — default: the menu is at least 200 wide. field: the menu is only as wide as the field, for a narrow Select like rows per page.

- Do not use a native select.
- Do not use for actions from a button. Use Dropdown.

### Switch

An on/off setting that takes effect right away.

Props — label string; hideLabel bool; description string; size sm|md*|lg; checked bool; defaultChecked bool; disabled bool; name string; id string

- hideLabel — Track only, like in a table cell. The switch keeps its natural width.

- Do not use for choices that wait for a Save button, or for agreeing to terms. Use Checkbox.
- Do not use for picking one of several options. Use RadioGroup.

### Textarea

Multi-line text entry for notes, descriptions and code, with its own label, hint, error and character count.

Props — label string; hideLabel bool; labelPosition top*|start; labelWidth sm|md*|lg; size sm|md*|lg; type text*|code; placeholder string; value string; defaultValue string; name string; id string; required bool; disabled bool; readOnly bool; invalid bool; error string; hint string; help string; maxLength number

- Do not use for one-line values. Use Input.
- Do not use for rich text or syntax highlighting. That is out of scope.

## layout

### Accordion

List of short sections where one opens at a time.

Props — defaultExpanded string; items AccordionItem[] { id, title, content }

- Do not open more than one item at a time.
- Do not use for switching between peer views of the same data.

### Carousel

A track of slides people page through with previous and next buttons, swipe or the arrow keys, like a gallery or featured cards.

Props — items ReactNode[]; orientation horizontal*|vertical; slidesPerView 1|2|3|4; alignment start*|center; loop bool; showControls bool*; showIndex bool; label string

- Do not add CarouselContent, CarouselItem, CarouselPrevious or CarouselNext. Pass items.
- Do not use it to switch views. Use Tabs.

### Conveyor

Arrows at both ends of a row or column that is too long to fit, so people can move it along without a scrollbar.

Props — children ReactNode; orientation horizontal*|vertical; step number; label string

The arrows show only when there is something to scroll, and each one turns off at its end. A Scoreboard past four cards already puts itself in one, so wrap a Scoreboard by hand only when you want other settings, and pass it scroll off. In a box narrower than 640px, the kit's mobile break, the two arrows would take a third of the room, so they give way to swiping: the track keeps the whole width and comes to rest on a whole piece.

- Do not use it for paged slides or a gallery. Use Carousel.
- Do not use it to page a table. Use Pagination.

### Density

Sets the density tokens for everything inside it: Compact, Default or Comfortable spacing, control and icon sizes, and font sizes, like the BP Foundations density modes.

Props — value compact|default*|comfortable; children ReactNode

Radius, border widths and the 24px minimum click target do not change.

- Do not set size on every control to fake a density. Wrap them in Density.
- Do not set data-density by hand on screens. Use Density.

### Section

A titled block of a page, like Account information or Recent invoices: a header with a line under it, optional help and buttons, and the content below.

Props — title string; help string; actions ReactNode; children ReactNode; line medium*|thin|none; columns 1|2|3; collapsible bool; expanded bool; defaultExpanded bool*; heading md|sm|xs; spacing default*|tight; loading bool

- children — The section's content. Leave it out for a header only: the title row and its line, with nothing below.
- line — The line under the header. medium is 2px, thin is 1px, both in the brand-faint color; none drops it, for a block inside a section that reads as one part of it. It applies to this Section's own header only; a Section inside it sets its own.
- columns — Lays FormDisplay rows or kit fields, passed straight in as children, out in 1, 2 or 3 columns, left to right, each at most 554px (--layout-column-max) and kept at the start. A Textarea spans the row. Unset, the Section takes the columns of the RecordPage it is in; outside one, the content stacks at full width as before. Only rows and fields go into columns: a Section of a Table or anything else stays full width. Below 1280px of viewport the fields are one column whatever room the box has, which is where BP COBALT puts the record's and the form's break; above it the box decides.

It is one component: pass title and the content as children, or leave children out for a header only, like a heading above content laid out by the page. Columns give way as the Section narrows, like Form columns: three become two under 1301px with start labels (720px with labels on top), and two become one under 867px with start labels (560px on top). A Table, Scoreboard or anything else that is not a field or a FormDisplay is never put in columns: a Section of those keeps the full width. A folded section is its header only.

- Do not override the header line with CSS or draw a border above the content. Use line.
- Do not write a line of text under a section title. A section title stands on its own: put the sentence in the section's content, where the reader is already looking, or make it the help icon's text. Only PageHeader carries a line under its title.

## navigation

### AnchorNav

A list of the sections on one long page, which jumps to a section and shows the one the page is at.

Props — items AnchorNavItem[] { id, label }; active string; defaultActive string; variant rail*|menu; spy bool*; offset number; label string

- Do not use it for app navigation. Use AppNav.
- Do not use it to switch views on one screen. Use Tabs.

### AppHeader

The product's top bar: logo and environment on the start, global search in the centre, utility icons, the user and their company on the end.

Props — navOpen bool; logo ReactNode; homeHref string; environment string; environmentIntent success*|info|warning|danger|highlight|neutral; search bool*; searchPlaceholder string; searchShortcut string; searchGroups CommandGroup[] { heading?, items }; searchVariant list*|tabs; searchIconStyle tile*|plain; searchScopes CommandScope[] { value, label }; searchScope string; assistant AppHeaderAssistant { label?, open?, onToggle }; actions AppHeaderAction[] { id, label, icon }; user AppHeaderUser { name, src? }; company AppHeaderCompany { name, logo? }; darkMode bool; density compact|default|comfortable; loading bool

- logo — Defaults to the kit Logo, which drops to its symbol on narrow bars. Pass your own only for a white-label product.
- searchShortcut — Hint on the right of the search, like Ctrl+K. Shown only; it is not a key binding yet. Hidden under 1000px.
- assistant — The BP AI button, before the utility icons: the AI mark and its name (label, BP AI by default) in the AI brand blend. onToggle opens and closes the AppShell assistant; pass open (the screen's assistantOpen) so it shows pressed while the assistant is open. The bar never moves when the assistant opens, so this is the one place to open it from on every screen. On a phone-width bar only the mark shows; the name stays its accessible name.
- actions — Up to three icon buttons, each named by a Tooltip. On a phone-width bar they move behind one more button; only one of the two is shown, so neither is reached twice by the keyboard.

With searchGroups, the search opens a kit GlobalSearch in its place: one search box that grows down into the results (Recent items, scopes, arrow keys and Enter); otherwise it runs onSearch; searchShortcut only shows a hint. The avatar opens an account menu with the name, User settings, Dark mode, Density & text size and Log out; each row shows only when its handler is passed. Page titles, breadcrumbs and page actions belong in the page, not here.

- Do not put the page title, breadcrumbs or page actions in it. They belong in the page.
- Do not put more than three icon actions in it.

### AppNav

The app's main navigation: a brand rail of sections on the left, each with an optional second-level menu that flies out beside it.

Props — items SideNavEntry[] { id, label, icon, href?, children?, divider }; endItems SideNavItem[]; current string; defaultCurrent string; expanded bool; pinned bool; defaultPinned bool; label string; loading bool

- items — Rail sections, top to bottom. In the app shell this is always the full app nav, APP_NAV from @/patterns/AppShell/appNav (with APP_NAV_END as endItems); never a shorter or made-up list. icon is a Material Symbols name. children is the second-level menu, made of { id, label, href? } links, { label, items } groups (a named folder of links) and { divider: true } lines. A menu can mix all three. A group holds links only: no group inside a group.

Every menu is the same width, the longest link in the whole nav (within --side-nav-panel-min and --side-nav-panel-max), so the menu never resizes as people move from one section to another, whether the rail is expanded or not. Groups start open and a collapse lasts only while the menu is out.

- Do not put page actions, filters or tabs in it. Those belong in the page.
- Do not nest a third level. A section has one menu of links, split by dividers.

### Breadcrumb

Path to the current page as a trail of links.

Props — separator slash*|chevron; maxItems number; items BreadcrumbItem[] { label, href?, onClick? }; current bool*

The last crumb is the current page and is never a link.

- Do not make the current page a link.
- Do not use Breadcrumb as the sidebar or as tabs.

### ChatHeader

The bar at the top of the assistant: its mark and name, then start a new chat, go full screen, the options menu and close.

Props — title string; expanded bool; chatsCount number; playbooksCount number; planMode bool; menu DropdownMenuEntry[]; label string

- planMode — Plan Mode is on: its row in the menu is ticked and a Plan Mode badge sits beside the name. On a bar narrower than 480px the badge shows its icon only, still named Plan Mode, so the title stays whole.

It is one component: pass the handlers for the buttons you want, and the ones you leave out do not show. On a narrow bar, like the side panel, the badge gives way first and shows its icon only, so the title is never cut short.

- Do not use it as the app's top bar. Use AppHeader.
- Do not use it as a page title. Use PageHeader.

### ChatList

The saved chats or playbooks beside the assistant: a titled panel with a search box and rows that open what they name.

Props — title string; items ChatListItem[] { id, label, icon?, menu? }; groups ChatListGroup[] { id, label, items, defaultOpen? }; selected string; searchable bool*; searchPlaceholder string; query string; createLabel string; closeLabel string; emptyLabel string

Functions — more

- Do not use it for app navigation. Use AppNav.
- Do not use it for a list of records people sort and filter. Use Table.

### GlobalSearch

A search field over a grouped list of pages, records and actions.

Props — groups CommandGroup[] { heading?, items }; variant list*|tabs; iconStyle tile*|plain; size sm|md*; label string; placeholder string; empty string; defaultQuery string; hints bool*; scopes CommandScope[] { value, label }; scope string; defaultScope string; autoFocus bool

- variant — list shows every group with its heading. tabs adds a kit Tabs strip under the search: All, then one tab per group heading, like Records / Reports / Sections. A heading tab shows only that group; with a query each tab shows its result count.

It shows inline, and a ⌘K palette is this component inside a kit Modal, never a local overlay: title Search, size md, autoFocus on the search, and onSelect closing the Modal before it goes.

- Do not use for a short list of actions from a button. Use Dropdown.
- Do not use for choosing a form value. Use RadioGroup, or Select when it exists.

### GuidedProcess

The pieces of a process walked one step at a time: a dark panel for a step, the dark list of every step beside the page, the header over a step, and the footer under it.

Props — part panel*|steps|header|footer; title string; subtitle string; steps GuidedProcessStep[] { title, status?, statusText?, tasks }; current number; started bool*; placement auto*|side|band; shade 1|2|3|4|5; startLabel string; side start|end*; stepTitle string; total number; actions GuidedProcessAction[] { id, label, icon?, emphasis?, intent?, type?, form?, disabled? }; updated string

- part — panel is one step as a dark column; steps is every step beside the page; header goes over the step; footer goes under it. Each part takes only its own props.
- title — Panel: the process name, over the first column only. Header: required, the process name over the step title.
- actions — Footer. The step's buttons in order; the last moves the process on. From 600 to 1023 of box width every one but the last goes in a More menu; under 600 those with an icon are a row of lg icon-only Buttons with xl icons over the last action and the rest share a More menu.

It is one component with four parts, picked by part, and each part takes only its own props.

- Do not use it for a short flow inside a Modal or a Drawer. Use Steps.
- Do not use it for page sections that can be visited in any order. Use Tabs or AnchorNav.

### Link

Inline text that takes people somewhere: a record, a list or another page.

Props — children ReactNode; href string; intent brand*|neutral; external bool; disabled bool

- Do not use Link for an action that changes data, like Delete or Save. Use Button.
- Do not use Link in a table cell. Use a link Cell.

### LinkList

A column of links, one a row with a chevron at the end, like an account's quick links.

Props — items LinkListItem[] { id, label, href?, onClick?, icon?, description?, external? }; label string

- Do not use it for actions that change data. Use Buttons or a Dropdown.
- Do not use it for page navigation across the app. Use AppNav or Tabs.

### PageHeader

The top of a page's content: where it sits (breadcrumb), what it is (title, badge, and an optional icon) and the page actions.

Props — title string; breadcrumbs BreadcrumbItem[] { label, href?, onClick? }; back PageHeaderBack { label, href?, onClick? }; icon string; badge string; badgeIntent neutral*|info|success|warning|danger|highlight; actions ReactNode; moreActions DropdownMenuEntry[] { id, label, icon?, danger?, divider }; sticky bool; shadow bool*; loading bool

- breadcrumbs — The parents of this page, all links: Home first, then the side-nav section, then any parent record. PageHeader adds the title as the last, current crumb, so the trail always reads Home › section › this page. On the section's own page, like the Accounts list, the title is the section itself, so pass only Home and the trail reads Home › Accounts.
- back — Optional. A minimal icon-only Button (arrow_back, drawn one size up at icon md) at the start of the title line, before the icon, that goes back to where the page was opened from. label is its accessible name and its tooltip, so write where it goes, like Back to accounts. onClick wins; otherwise href is followed; with neither, it goes back one step in history. The breadcrumb is still the page's place in the app, so pass back only as a shortcut beside it, never instead of it. In sticky it moves to the start of the compact bar, before the trail.
- icon — Optional. Leave it out by default: the title stands on its own. Pass a Material Symbols name, like folder_open, only when the page wants an icon before the title; the kit Icon draws it at size lg in the brand color.
- shadow — With sticky, a subtle line and a shadow that falls downward only, so the full-width bar does not read as a floating card.

Then the title row with an optional badge, an icon before the title only when you pass one (none by default), and the page actions on the end. On a phone-width header, under 640px of its own width, the title row takes the full width and the actions move onto their own row under it, starting at the start edge; the compact sticky bar stays one 52px line, keeping only the page name in its trail, shortened with an ellipsis when it runs long.

- Do not put the app's logo, search or user in it. That is the AppHeader.
- Do not put more than one strong brand Button in actions, or more than five visible actions.

### Pagination

The bar under a long table that moves between pages, says which rows are showing, and lets people pick how many rows a page holds.

Props — total number; page number; defaultPage number; pageSize number; defaultPageSize number; pageSizes number[]; showRange bool*; showPageSize bool*; label string

- Do not use it to switch views or steps. Use Tabs.
- Do not build page buttons from a ButtonGroup or loose Buttons. Use Pagination.

### Steps

A row of numbered steps that shows where a person is in a flow of a few steps: done, current and still to come.

Props — steps string[]; current number; size sm|md*; fill bool; label string

The Steps only shows progress; the page shows the step's content and its Back and Next buttons.

- Do not use it for page sections the person can visit in any order. Use Tabs.
- Do not use it for a single amount done. Use Meter.

### Tabs

A row of tabs that switches between related views in the same place.

Props — items TabItem[] { id, label, icon?, count?, countLabel?, disabled?, content? }; label string; value string; defaultValue string; size sm*|md|lg; expand bool; border bool*

With content, Tabs shows the selected panel under the strip; without it, it is a strip only and you show the view yourself from value and onChange.

- Do not use for app or page navigation. Use the side nav.
- Do not use for a small choice that applies at once, like density or List / Board. Use Segmented.

### Toolbar

The bar above a list or table: find and filter on the left, view and actions on the right, with a filter bar that opens under it.

Props — filters ReactNode; filterCount number; filtersOpen bool; defaultFiltersOpen bool; filterHelp string; searchValue string; searchPlaceholder string; searchGroups CommandGroup[] { heading?, items }; field ReactNode; selectedCount number; views ToolbarView[] { id, label }; view string; moreActions DropdownMenuEntry[] { id, label, icon?, danger?, divider }; actions ReactNode; buttons raised*|subtle; loading bool; label string

- field — One more control after the search: a kit DatePicker or Select, size sm, with labelPosition start, like Effective on. For a value that narrows the rows and changes often enough to stay on the bar instead of in the filter bar. It can hold more than one control: the slot is a row spaced like the rest of the bar, so pass them in a fragment rather than spacing them yourself.
- actions — Kit Buttons size sm: subtle first, one strong brand Button last. At most five visible actions including More. To fold into the Actions menu on a narrow bar, each must be a kit Button whose children are its text label (an icon-only Button already passes its name that way); picked from the menu, its onClick runs with no event. Anything else and the actions stay a row that wraps.

Right: a More menu and the actions, kit Buttons size sm with at most one strong brand Button, last. buttons subtle gives the buttons on the bar the bar's own grey instead of white paper, for a quieter bar; the search field keeps its white box either way. Only the one strong Button is a step darker, so the bar still says where the main action will land. This is a deliberate change from BP COBALT "Skeleton / button" (node 2046:29482), which draws the outline buttons and the search box as white bordered boxes with a bar inside: on the real bar they read as real, empty controls rather than as controls still on their way. When the actions do not fit on that line they fold into one Actions menu that lists them, then More's items after a divider. It is either the whole row of buttons or the one menu, never a wrapped row. If even the Actions button does not fit, it shows as an icon-only more button, still named Actions.

- Do not put a loose label and field, or a count of ticked rows, beside the toolbar. Pass field and selectedCount.
- Do not open the filter bar when the screen loads. It starts closed; people open it with Filters, and filterCount still says the list is narrowed.

## overlay

### AlertDialog

Overlay that stops the user until they cancel or confirm.

Props — open bool; title string; description string; cancelLabel string; actionLabel string; actionIntent brand*|danger; size sm|md*

Use AlertDialog when the user must choose before going on, like leaving with unsaved changes or deleting something.

- Do not put forms, tables or extra actions inside.
- Do not add a close X or close on backdrop click.

### Drawer

A panel that slides in from the right edge for a detail view or an edit form about something on the page, while the page stays in view behind it.

Props — open bool; title string; description string; size narrow*|medium|wide|extended; showClose bool*; children ReactNode; footer ReactNode

- size — Width 360 / 460 / 590 / 1100, never wider than the screen. Full height; the body scrolls.

Stack blocks in the body with.layout-stack; the drawer has its own 20px padding, so do not put.layout-content inside it. For a decision that must block the page, use Modal or AlertDialog.

- Do not use it for main navigation. Use AppNav.
- Do not open a drawer from inside another drawer.

### Dropdown

A short list of actions or options that opens from a Button or a FilterButton.

Props — label string; items DropdownMenuEntry[] { id, label, description?, icon?, danger?, disabled?, selected?, checkbox?, count? }; trigger button*|filter|field; emphasis strong|subtle*|minimal; intent brand|neutral*|danger; iconStyle tile*|plain; size sm|md*|lg; icon string; iconOnly bool; count number; alignment left*|right; disabled bool; closeOnSelect bool*; open bool; multiple bool; id string; text string; muted bool; badge string; toggle on|off; labelledBy string; describedBy string; searchable bool; searchPlaceholder string; empty string; menuWidth default*|field

- emphasis — Button trigger only. Same pairs as Button: strong with brand or danger, subtle with neutral, minimal with neutral, brand or danger.
- intent — Button trigger only. Required with emphasis strong.
- icon — Leading icon on the Button trigger. Icon-only defaults to more_vert.
- iconOnly — Icon-only Button trigger, like a row More menu. label stays as its name.
- count — Filter trigger only. Applied filters shown as a Count.
- toggle — trigger filter only: the filter's on/off state. See FilterButton.
- menuWidth — default: the menu is at least 200 wide. field: the menu is only as wide as the trigger. Select passes it through.

trigger button uses the kit Button with a chevron (or an icon-only button); trigger filter uses the kit FilterButton with its count. It gives up width rather than hanging outside, so a phone-width frame gets a narrower menu, not one over the edge.

- Do not use for choosing a value in a form. Use Select.
- Do not put page navigation here. Use links.

### HelpPopover

A small help panel with an optional title and a short paragraph, opened from a ? icon beside a label or setting.

Props — title string; content string; position above|below*|left|right; delay number; open bool; disabled bool; children ReactElement

- title — Bold header on a faint band. Leave it out for body text only.

- Do not use for an icon button's name. Use Tooltip.
- Do not put links, buttons or forms in it. Use Modal.

### Modal

A window over the page for a short task, a form or extra detail.

Props — open bool; title string; description string; icon string; size sm*|md|lg|xl|fullscreen; showClose bool*; children ReactNode; footer ReactNode

For a must-choose confirm, use AlertDialog.

- Do not use for a must-choose confirm. Use AlertDialog.
- Do not put page navigation or long flows in a modal. Use a page.

### Tooltip

Brief extra text on hover or keyboard focus of one trigger.

Props — content string; position above*|below|left|right; delay number; open bool; disabled bool; children ReactElement

Wrap one focusable kit piece, like a Button or an icon-only Button, in Tooltip and pass content. Keep it to a few words or one short sentence, and never put anything people must read or click in it.

- Do not put required instructions in a tooltip. Use the field's hint.
- Do not put links, buttons or forms in it. Use Modal.
