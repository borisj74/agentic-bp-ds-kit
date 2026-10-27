# Agentic BP DS — components

Every component in the library, with its closed property lists. A property value
that is not on its line does not exist: do not add a variant, a size or a colour
the list leaves out.

## base

### Avatar

Photo or initials for one person.

Props — `size`: `xs` | `sm` | `md` | `lg` (default `md`); `shape`: `circle` | `square` (default `circle`); `decorative`: boolean

- Do not invent a local Avatar.
- Do not use for status or category labels.
- Do not make Avatar clickable. Wrap it in a Button or link only with a new contract.

### AvatarGroup

Overlapping row of kit Avatars with a +N count for the rest.

Props — `size`: `xs` | `sm` | `md` | `lg` (default `md`); `shape`: `circle` | `square` (default `circle`)

- Do not invent a local avatar stack.
- Do not put anything but people in the group.
- Do not use for one person. Use Avatar.

### Button

Triggers an action.

Props — `emphasis`: `strong` | `subtle` | `minimal` (default `subtle`); `intent`: `brand` | `neutral` | `danger` (default `neutral`); `size`: `sm` | `md` | `lg` (default `md`); `iconSize`: `sm` | `md` | `lg` | `xl`; `iconOnly`: boolean; `loading`: boolean; `toggle`: boolean; `disabled`: boolean; `fullWidth`: boolean; `type`: `button` | `submit` | `reset` (default `button`)

- Do not use for in-text navigation (use Link).
- Do not put two strong brand Buttons in one view.
- Do not pair an emphasis and an intent outside the allowed pairs (no strong neutral, no subtle brand or danger).

### ButtonGroup

Joined row of kit Buttons that share one size and act as one control cluster.

Props — `size`: `sm` | `md` | `lg` (default `md`); `disabled`: boolean

- Do not invent a local button group or segmented control.
- Do not mix sizes inside one group.
- Do not put more than one strong brand Button in a group or the view.

### FilterButton

Filter chip for lists and tables: shows the filter name or its chosen value, opens its options, and turns an applied filter on or off.

Props — `size`: `sm` | `md` | `lg` (default `md`); `open`: boolean; `disabled`: boolean; `toggle`: `on` | `off`; `hasDropdown`: boolean

- Do not invent a local split button, filter chip or dropdown trigger. Use Dropdown trigger=filter for the menu.
- Do not use for page actions or view switches. Use Button or a Dropdown.
- Do not put more than one word or two in the name.

### Icon

Draws one Material Symbols Outlined glyph at a kit size, colored by the parent text color or a semantic icon role.

Props — `size`: `xs` | `sm` | `md` | `lg` | `xl` (default `md`); `intent`: `inherit` | `neutral` | `subtle` | `brand` | `info` | `success` | `warning` | `danger` (default `inherit`); `filled`: boolean

- Do not inline SVGs or emoji.
- Do not size with custom px; use size enum.

## brand

### Illustration

A piece of drawn artwork from the product, like the picture over an empty page.

Props — `name`: `ai-chip` | `chat-search`; `size`: `sm` | `md` | `lg` (default `md`); `animated`: boolean

- Do not paste an SVG into a screen or a pattern. Add the artwork here instead.
- Do not use it for an icon. Use Icon.
- Do not use it for the product mark. Use Logo or LogoAI.

### Logo

Brand logo: the full wordmark or the mark alone, in fixed brand colors.

Props — `type`: `default` | `symbol` (default `default`)

- Do not recolor, retint or tokenize the logo. Brand colors are fixed.
- Do not redraw it, use an image of it, or paste the SVG into a screen. Use this component.
- Do not stretch or resize it with custom px.

### LogoAI

AI logo for AI features: full logo or icon, in fixed brand colors.

Props — `type`: `default` | `symbol` (default `default`); `intent`: `color` | `monochrome` | `white` | `filled` (default `color`)

- Do not recolor, retint or tokenize the logo. Brand colors are fixed.
- Do not redraw it, use an image of it, or paste the SVG into a screen.
- Do not stretch or resize it with custom px.

## data

### BarChart

Values side by side as bars, one group or stack per category, like invoices by status for each week.

Props — `showHeader`: boolean; `orientation`: `vertical` | `horizontal` (default `vertical`); `highlightIntent`: `green` | `olive` | `cyan` | `orange` | `pink` | `gray` | `purple` | `yellow` | `red` | `mint` (default `orange`); `stacked`: boolean; `barWidth`: `wide` | `thin` (default `wide`); `showValues`: boolean; `showGrid`: boolean; `showLegend`: boolean; `legendPosition`: `top` | `bottom` | `end` (default `bottom`); `animate`: boolean; `format`: `number` | `currency` | `percent` (default `number`)

- Do not use it for a long, smooth trend. Use LineChart.
- Do not use it for one share of a total. Use PieChart.
- Do not draw charts with loose SVG or a chart library. Use the kit charts.

### Calendar

A full calendar of events by month, week, day or as a list, where people browse dates, filter calendars and add, edit or delete events.

Props — `view`: `month` | `week` | `day` | `list`; `defaultView`: `month` | `week` | `day` | `list` (default `month`); `weekStart`: `sunday` | `monday` (default `sunday`); `readOnly`: boolean

- Do not use it to pick one date or a range in a form. Use DatePicker.
- Do not use it for a timeline of one record's history or a list of due dates. Use Table.
- Do not build a local month grid, week grid or event chip. Use Calendar.

### Card

One item in a grid or list of options people compare and pick, like a proposal line, product or plan: title, details, a price and a status note, with an optional image and a select checkbox.

Props — `messageIntent`: `success` | `warning` | `danger` | `info` (default `success`); `selectable`: boolean; `selected`: boolean; `defaultSelected`: boolean; `disabled`: boolean

- Do not build a card from a div with a border, or add a ProductCard, ProposalCard or CardFooter. Use Card.
- Do not use it for page sections. Use Section.
- Do not use it for key numbers. Use Scoreboard.

### Cell

Content for one table cell: text, a number, a date, a link, a redirect to another page, a person, a file, a status, a trend, progress, a switch, row actions or a row menu, a tree row, with an optional row checkbox.

Props — `type`: `text` | `link` | `avatar` | `avatarGroup` | `file` | `payment` | `badge` | `badges` | `trendPositive` | `trendNegative` | `progress` | `actions` | `actionIcons` | `actionMenu` | `checkbox` | `tree` | `number` | `date` | `status` | `switch` | `popupTrigger` | `textBlock` | `redirect` (default `text`); `size`: `sm` | `md` (default `md`); `alignment`: `start` | `center` | `end` (default `start`); `text`: boolean; `checkbox`: boolean; `checked`: boolean; `defaultChecked`: boolean; `expanded`: boolean; `showLines`: boolean; `treeToggle`: `chevron` | `box` (default `box`)

- Do not invent a local table cell, Tag, Trend, FileIcon, PaymentMethod or ActionCell.
- Do not draw a progress bar in a cell. Use type progress; it is a kit Meter.
- Do not use Badge for trends. Use a trend type.

### ChatMessage

One turn in a chat with the assistant: what the person asked, or what the assistant answered, with its workings, buttons and suggestions.

Props — `author`: `user` | `assistant`; `bubble`: boolean

- Do not build a bubble from your own divs, or add a ChatBubble, MessageRow or AiAvatar. Pass the props.
- Do not use it for an alert or a system notice. Use Callout or Toast.
- Do not put more than one action row on a turn.

### DataGrid

An editable table: people click a cell to add or change its content, like rule conditions, line items or mappings.

Props — `size`: `sm` | `md` (default `md`); `line`: `medium` | `thin` (default `medium`); `rowNumbers`: boolean; `canAddRows`: boolean; `canRemoveRows`: boolean; `canDeleteRows`: boolean; `canInsertRows`: boolean; `stickyFirstColumn`: boolean

- Do not use it to show data people only read. Use Table.
- Do not invent an EditableCell, GridRow or a table of loose inputs. Pass columns with a type.
- Do not build your own expand arrows or a second table under a row. Pass detail.

### HeaderCell

Column title for a data table: uppercase label, optional select-all checkbox, optional sort, with a brand-faint bottom border, 2px or 1px.

Props — `size`: `sm` | `md` (default `md`); `alignment`: `start` | `center` | `end` (default `start`); `line`: `medium` | `thin` (default `medium`); `checkbox`: boolean; `checked`: boolean; `defaultChecked`: boolean; `indeterminate`: boolean; `sortable`: boolean; `sort`: `none` | `asc` | `desc` (default `none`)

- Do not invent a local th, TableHeader, ColumnTitle or SortButton.
- Do not use Cell for column titles, or HeaderCell in body rows.
- Do not mix HeaderCell and Cell sizes in one table.

### Legend

The key to a drawing: a small colour mark per name, so people can read what each colour means.

Props — `orientation`: `horizontal` | `vertical` (default `horizontal`); `alignment`: `start` | `center` | `end` (default `center`); `shape`: `square` | `line` | `dot` (default `square`); `size`: `sm` | `md` (default `md`); `decorative`: boolean

- Do not add a second legend under a kit chart; the chart draws its own. Use showLegend and legendPosition to place it.
- Do not use it as a list of filters or tags. Use Badge or FilterButton.
- Do not write the colour yourself; pick an intent.

### LineChart

How values change over time as lines or filled areas, one per series, like revenue by month or invoices approved by day.

Props — `showHeader`: boolean; `area`: boolean; `stacked`: boolean; `showPoints`: boolean; `showValues`: boolean; `showGrid`: boolean; `showLegend`: boolean; `legendPosition`: `top` | `bottom` | `end` (default `bottom`); `animate`: boolean; `format`: `number` | `currency` | `percent` (default `number`)

- Do not use it for categories without an order, like regions. Use BarChart.
- Do not use it for one share of a total. Use PieChart.
- Do not fake a limit or target with an extra series. It shows in the legend, the tooltip and the table as data. Use referenceLines.

### ListView

A list of records, one a row: a primary and a secondary line with an avatar, icon or image before them, and badges, actions, a chevron or a drag handle after, grouped under headers when the list is long, and stepping into nested lists in place.

Props — `size`: `sm` | `md` | `lg` (default `md`); `collapsible`: boolean; `stickyGroups`: boolean; `selection`: `none` | `single` | `multiple` (default `none`); `interaction`: `none` | `drill` | `drag` (default `none`); `nesting`: `step` | `expand` (default `step`)

- Do not use it for values people compare across columns. Use Table or DataGrid.
- Do not use it for a short set of links. Use LinkList.
- Do not nest deeper than three levels, or use it for a tree people need to see at once. Use TreeView.

### NavTile

A way in to somewhere: the name of a place, a line about what is in it, and a colored icon square.

Props — `intent`: `brand` | `green` | `olive` | `cyan` | `orange` | `pink` | `gray` | `purple` | `yellow` | `red` | `mint` (default `brand`); `disabled`: boolean

- Do not use it to compare or pick options; that is Card.
- Do not put buttons or fields inside it. The whole tile is one link.
- Do not give a grid of tiles one intent; give each its own so the colors mean something.

### PieChart

How a whole splits into a few parts, as a donut or a solid pie, like payments by method.

Props — `showHeader`: boolean; `donut`: boolean; `size`: `sm` | `md` | `lg` (default `md`); `showTotal`: boolean; `showLegend`: boolean; `legendPosition`: `end` | `bottom` (default `end`); `alignment`: `start` | `center` (default `start`); `animate`: boolean; `format`: `number` | `currency` | `percent` (default `number`)

- Do not use it for many parts or values over time. Use BarChart or LineChart.
- Do not switch the legend to bottom only to centre the chart. Use alignment center.
- Do not use it to compare parts that don't add up to a whole.

### Scoreboard

A strip of key numbers at the top of a screen, like open invoices, revenue or overdue amount, each with an optional trend and spark chart.

Props — `selectable`: boolean; `scroll`: boolean

- Do not build a metric row from your own divs or cards, or add a MetricCard, ScoreCard or Sparkline. Pass items.
- Do not use the chart as a real chart; it only shows the shape of the trend. Use a chart for readable data.
- Do not pair direction none with a success or danger status.

### Table

A semantic table of rows and columns, like invoices or accounts, with optional row selection, a caption and a total.

Props — `size`: `sm` | `md` (default `md`); `line`: `medium` | `thin` (default `medium`); `selectable`: boolean

- Do not invent TableHeader, TableRow, TableCell or a local grid of divs. Pass columns and rows.
- Do not draw cell content yourself. Use kit Cell types for badges, people, links and row actions.
- Do not put search or filters in the table. Use a Toolbar above it.

### Timeline

What happened on a record, newest first: a circled icon per entry joined by a line, with the note, links and action for each one.

Props — `size`: `sm` | `md` (default `md`)

- Do not build a feed from your own divs, or add a TimelineItem, ActivityCard or FeedRow. Pass items.
- Do not use it for steps in a flow. Use Steps.
- Do not use it for a list of records people sort and filter. Use Table.

### TreeView

A nested list people open and close level by level, like teams in an organization, project folders or account hierarchies, to pick, check or reorder items.

Props — `selection`: `none` | `single` | `multiple` (default `single`); `showIcons`: boolean; `showLines`: boolean; `reorderable`: boolean; `size`: `sm` | `md` | `lg`

- Do not use it for a flat list. Use Table, Select or RadioGroup.
- Do not use it for main app navigation. Use AppNav.
- Do not use it for sections of one page that open and close. Use Accordion.

### UsageList

A list of usage limits, one a row: the limit's name, how much is used of it, a bar, and a short note, like API calls, storage and seats on a plan.

- Do not build usage rows from a Table with a Meter column, or from loose bars and text. Use UsageList.
- Do not use it for task progress, like an upload or a setup checklist. Use Meter or Steps.
- Do not use it to compare records across columns. Use Table.

## feedback

### Badge

Short status or category label.

Props — `intent`: `neutral` | `hollow` | `info` | `success` | `warning` | `danger` | `highlight` (default `neutral`); `emphasis`: `subtle` | `strong` | `faint` (default `subtle`); `size`: `sm` | `md` | `lg` (default `sm`); `iconOnly`: boolean; `removable`: boolean; `disabled`: boolean

- Do not invent a local Badge, Tag, Chip or Pill.
- Do not use as a button or link. Only the close button is interactive.
- Do not use for people. Use Avatar.

### BadgeAlt

Alternate status or category label: tinted fill with a matching border, in three sizes.

Props — `intent`: `neutral` | `brand` | `success` | `warning` | `danger` | `info` (default `neutral`); `size`: `sm` | `md` | `lg` (default `md`); `removable`: boolean; `disabled`: boolean

- Do not use BadgeAlt where Badge fits. Badge is the default.
- Do not mix Badge and BadgeAlt on one screen.
- Do not use as a button or link. Only the X is interactive.

### Callout

Inline message that stays on the page, with an optional action and dismiss.

Props — `intent`: `info` | `success` | `warning` | `danger` (default `info`); `closeButton`: boolean

- Do not invent a local Callout, Banner or Notice.
- Do not use for short status labels on rows or cards.
- Do not use for pop-up messages that disappear on their own.

### Count

Small number badge for counts, like unread items on a nav link or tab.

Props — `intent`: `info` | `danger` | `neutral` (default `info`); `size`: `sm` | `md` | `lg` (default `md`); `subtle`: boolean; `disabled`: boolean

- Do not invent a local counter or notification dot.
- Do not put words in a Count. Use Badge.
- Do not use Count as a button.

### EmptyState

What a list, page or panel shows when it has nothing yet: an icon, a title, a line of help and the action that fills it.

Props — `iconStyle`: `well` | `plain` (default `well`); `outlined`: boolean; `headingLevel`: `2` | `3` | `4` (default `3`)

- Do not invent EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription or EmptyContent. Pass props.
- Do not use it for page messages like errors or warnings. Use Callout.
- Do not use it while content is loading.

### Meter

How far along or how full something is, from 0 to 100, as a bar, a ring or a half ring, with optional red, amber and green zones.

Props — `shape`: `bar` | `circle` | `semicircle` (default `bar`); `size`: `sm` | `md` | `lg` (default `md`); `thresholds`: `none` | `bar` | `plotArea` | `all` (default `none`); `intent`: `info` | `success` | `warning` | `danger`; `referenceLines`: boolean; `showValue`: boolean

- Do not use it for a short wait of unknown length in the spot that is loading. Show a Spinner. indeterminate is for a bar that sits with the work, like a loading Toast, or that will get a value later.
- Do not use indeterminate with circle or semicircle; it is bar only.
- Do not draw bars or rings from divs or SVG. Use Meter.

### ProgressBar

The older 20-tall progress bar with its percent written on or beside it, for screens that still use the legacy look.

Props — `showLabel`: boolean; `labelPosition`: `center` | `right` (default `center`)

- Do not use it for waits of unknown length. Show a spinner instead.
- Do not stack several bars for one process. Use one bar with a clear label.
- Do not draw a progress bar from divs. Use this or the kit progress bar.

### Skeleton

Gray placeholder shapes in the layout of content that is still loading, like lines of text, an avatar or an image, so the page keeps its shape until the data arrives.

Props — `shape`: `text` | `circle` | `rect` (default `text`); `size`: `sm` | `md` | `lg` (default `md`); `animation`: `shimmer` | `pulse` | `none` (default `shimmer`); `loading`: boolean

- Do not use it for a short status line. Use TextLoader.
- Do not use it when the amount done is known. Use Meter.
- Do not leave it up when the load failed; show a Callout or an EmptyState.

### Spinner

A small ring of ticks in the brand color that turns while something loads and the wait is short and unknown.

Props — `size`: `sm` | `md` | `lg` (default `md`); `showLabel`: boolean

- Do not put it in a Button. Use Button loading.
- Do not use it when the amount done is known. Use Meter.
- Do not use it for content with a known layout. Use Skeleton.

### TextLoader

Short text with a soft wave of light running through it, for a moment of work whose end is unknown, like Generating response… or Syncing invoices….

Props — `size`: `sm` | `md` | `lg` (default `md`); `speed`: `slow` | `normal` | `fast` (default `normal`)

- Do not use it for headings or body copy.
- Do not use it for long text; keep it to a few words.
- Do not use it when the amount done is known. Use Meter.

### Toast

A short note that floats in after an action, like Saved successfully, and goes away on its own after a few seconds, with an optional Undo.

Props — `open`: boolean; `intent`: `info` | `success` | `warning` | `danger` (default `info`)

- Do not use it for errors people must fix or read later. Use Callout on the page.
- Do not put more than one action in a toast.
- Do not make duration shorter than people need to read it and reach the action.

## form

### Cascader

Pick one item from options that nest several levels deep by walking columns left to right, like a field on a related object (Invoice / Account / Owner) or a region / country / city.

Props — `variant`: `field` | `panel` (default `field`); `changeOnSelect`: boolean; `searchable`: boolean; `hasLegend`: boolean; `size`: `sm` | `md` | `lg`; `labelPosition`: `top` | `start`; `hideLabel`: boolean; `required`: boolean; `disabled`: boolean; `invalid`: boolean

- Do not use it for a flat list. Use Select.
- Do not use it to browse or arrange a hierarchy without picking. Use TreeView.
- Do not nest Selects to fake levels, or build local columns. Use Cascader.

### ChatComposer

The box people write to the assistant in: what the question is about, what is attached, the words, and the toolbar that sends it.

Props — `scoped`: boolean; `defaultScoped`: boolean; `selecting`: boolean; `dictating`: boolean; `mode`: `quick` | `deep` (default `quick`); `disabled`: boolean

- Do not build the box from Textarea and Buttons, or add a MessageBox, PromptInput or SendButton. Use this.
- Do not use it for an ordinary form field. Use Textarea.
- Do not show the scope row on a screen with nothing to scope to, and do not name a page the person is not on.

### Checkbox

Checkbox for multi-select and confirmations.

Props — `size`: `sm` | `md` | `lg` (default `md`); `checked`: boolean; `defaultChecked`: boolean; `indeterminate`: boolean; `error`: boolean; `disabled`: boolean; `hideLabel`: boolean

- Do not invent a local Checkbox.
- Do not use for one choice from several.
- Do not use as a submit action. Use Button.

### DatePicker

A date field that opens a calendar to pick one date, or a range between two dates.

Props — `type`: `single` | `dual` (default `single`); `size`: `sm` | `md` | `lg` (default `md`); `labelPosition`: `top` | `start` (default `top`); `hideLabel`: boolean; `presets`: boolean; `monthYear`: `title` | `menus` (default `title`); `required`: boolean; `disabled`: boolean; `invalid`: boolean

- Do not invent a local Calendar, DateRangePicker, Popover or native input type=date.
- Do not use two DatePickers for a start and end. Use type dual.
- Do not use for time. There is no time picker yet.

### Form

One form: an optional title, kit fields (or titled sections of them) and the actions that save it.

Props — `variant`: `plain` | `card` (default `plain`); `labelPosition`: `top` | `start` (default `top`); `columns`: `1` | `2` | `3`

- Do not invent FieldSet, FieldGroup, FieldLegend, FormSection, FormActions or a local <form> wrapper.
- Do not put a Form inside another Form.
- Do not put more than one strong brand Button in actions.

### FormDisplay

A read-only label and value, like a form field that shows data instead of editing it.

Props — `labelPosition`: `top` | `start` (default `top`)

- Do not put a gap or margin between stacked FormDisplays, or pass them to a Section one by one. Wrap the stack in one plain div, unless the Section has columns: then pass the rows straight in.
- Do not lay rows side by side with your own grid or flex. Use Section or Form columns.
- Do not invent DescriptionList, KeyValue, DetailRow, ReadOnlyField or a local label and value pair.

### FormulaEditor

A monospace field for writing formulas and rules, with a toolbar that inserts fields, operators and functions and checks the syntax.

Props — `hideLabel`: boolean; `labelPosition`: `top` | `start` (default `top`); `size`: `sm` | `md` | `lg` (default `sm`); `aiActive`: boolean; `required`: boolean; `disabled`: boolean; `readOnly`: boolean; `invalid`: boolean

- Do not invent CodeEditor, ExpressionInput, a formula toolbar or a Textarea with buttons above it.
- Do not use for prose or notes. Use Textarea.
- Do not use for one-line values. Use Input.

### Input

Single-line text entry with its own label, hint, error and character count.

Props — `hideLabel`: boolean; `labelPosition`: `top` | `start` (default `top`); `size`: `sm` | `md` | `lg` (default `md`); `type`: `text` | `email` | `password` | `search` | `number` | `tel` | `url` | `file` (default `text`); `multiple`: boolean; `required`: boolean; `disabled`: boolean; `readOnly`: boolean; `invalid`: boolean

- Do not invent a local Field, FieldLabel, FieldDescription, FieldError, FormItem, InputGroup or SearchInput.
- Do not build a local tooltip for help. Pass help; it shows in the kit HelpPopover.
- Do not use a placeholder as the label. Pass label, and hideLabel if it must not show.

### Lookup

A form field for picking one record from a long list, like a product or an account, through a searchable table in a wide Modal.

Props — `clearable`: boolean; `size`: `sm` | `md` | `lg`; `labelPosition`: `top` | `start`; `hideLabel`: boolean; `required`: boolean; `disabled`: boolean; `invalid`: boolean; `multiple`: boolean; `trigger`: `field` | `button` (default `field`)

- Do not use it for a short list of plain options. Use Select.
- Do not use it for a path through nested levels. Use Cascader.
- Do not build a local lookup dialog, table picker or search field with a button. Use Lookup.

### RadioGroup

Pick exactly one option from a short visible list.

Props — `size`: `sm` | `md` | `lg` (default `md`); `orientation`: `vertical` | `horizontal` (default `vertical`); `layout`: `list` | `card` (default `list`); `disabled`: boolean; `hideLegend`: boolean; `labelPosition`: `top` | `start` (default `top`)

- Do not invent a Radio, RadioItem or RadioLegend cousin.
- Do not use for independent yes/no choices. Use Checkbox.
- Do not use for long lists of options.

### Segmented

One choice from two to five options, shown as kit minimal Buttons side by side.

Props — `hideLabel`: boolean; `size`: `sm` | `md` | `lg` (default `md`); `fullWidth`: boolean; `disabled`: boolean

- Do not invent ToggleGroup, ToggleButtons, Segmented or a ButtonGroup with a pressed button. Options are already kit Buttons.
- Do not use for more than five options or long labels. Use Select.
- Do not use for on/off. Use Switch.

### Select

Choose one or several options from a list.

Props — `size`: `sm` | `md` | `lg` (default `md`); `labelPosition`: `top` | `start` (default `top`); `itemCheck`: `check` | `checkbox` (default `check`); `hideLabel`: boolean; `multiple`: boolean; `searchable`: boolean; `required`: boolean; `disabled`: boolean; `invalid`: boolean; `menuWidth`: `default` | `field` (default `default`)

- Do not use a native select.
- Do not invent SelectTrigger, SelectContent, SelectItem, MultiSelect, Combobox or Tag.
- Do not use for actions from a button. Use Dropdown.

### Switch

An on/off setting that takes effect right away.

Props — `hideLabel`: boolean; `size`: `sm` | `md` | `lg` (default `md`); `checked`: boolean; `defaultChecked`: boolean; `disabled`: boolean

- Do not invent Toggle, ToggleGroup, SwitchGroup or a local pill switch.
- Do not use for choices that wait for a Save button, or for agreeing to terms. Use Checkbox.
- Do not use for picking one of several options. Use RadioGroup.

### Textarea

Multi-line text entry for notes, descriptions and code, with its own label, hint, error and character count.

Props — `hideLabel`: boolean; `labelPosition`: `top` | `start` (default `top`); `size`: `sm` | `md` | `lg` (default `md`); `type`: `text` | `code` (default `text`); `required`: boolean; `disabled`: boolean; `readOnly`: boolean; `invalid`: boolean

- Do not invent a local Field, FieldLabel, FieldError, CodeEditor or NotesBox.
- Do not use for one-line values. Use Input.
- Do not use for rich text or syntax highlighting. That is out of scope.

## layout

### Accordion

List of short sections where one opens at a time.

- Do not invent a local Accordion, Collapse or Disclosure.
- Do not open more than one item at a time.
- Do not use for switching between peer views of the same data.

### Carousel

A track of slides people page through with previous and next buttons, swipe or the arrow keys, like a gallery or featured cards.

Props — `orientation`: `horizontal` | `vertical` (default `horizontal`); `slidesPerView`: `1` | `2` | `3` | `4` (default `1`); `alignment`: `start` | `center` (default `start`); `loop`: boolean; `showControls`: boolean; `showIndex`: boolean

- Do not add CarouselContent, CarouselItem, CarouselPrevious or CarouselNext. Pass items.
- Do not use it to switch views. Use Tabs.
- Do not use it to page a list or table. Show the rows.

### Conveyor

Arrows at both ends of a row or column that is too long to fit, so people can move it along without a scrollbar.

Props — `orientation`: `horizontal` | `vertical` (default `horizontal`)

- Do not use it for paged slides or a gallery. Use Carousel.
- Do not use it to page a table. Use Pagination.
- Do not put a second scrolling box inside it; turn that one's scrolling off.

### Density

Sets the density tokens for everything inside it: Compact, Default or Comfortable spacing, control and icon sizes, and font sizes, like the BP Foundations density modes.

Props — `value`: `compact` | `default` | `comfortable` (default `default`)

- Do not set size on every control to fake a density. Wrap them in Density.
- Do not invent DensityProvider, SizeProvider or a local size context.
- Do not set data-density by hand on screens. Use Density.

### Section

A titled block of a page, like Account information or Recent invoices: a header with a line under it, optional help and buttons, and the content below.

Props — `line`: `medium` | `thin` | `none` (default `medium`); `columns`: `1` | `2` | `3`; `collapsible`: boolean; `expanded`: boolean; `defaultExpanded`: boolean; `heading`: `md` | `sm` | `xs`; `spacing`: `default` | `tight` (default `default`)

- Do not invent a SectionHeader, SectionTitle or a heading with a border. Use Section.
- Do not override the header line with CSS or draw a border above the content. Use line.
- Do not use it for the page title. Use PageHeader.

## navigation

### AnchorNav

A list of the sections on one long page, which jumps to a section and shows the one the page is at.

Props — `variant`: `rail` | `menu` (default `rail`); `spy`: boolean

- Do not use it for app navigation. Use AppNav.
- Do not use it to switch views on one screen. Use Tabs.
- Do not use it for steps in a flow. Use Steps.

### AppHeader

The product's top bar: logo and environment on the start, global search in the centre, utility icons, the user and their company on the end.

Props — `navOpen`: boolean; `environmentIntent`: `success` | `info` | `warning` | `danger` | `highlight` | `neutral` (default `success`); `search`: boolean; `searchVariant`: `list` | `tabs` (default `list`); `searchIconStyle`: `tile` | `plain` (default `tile`); `darkMode`: boolean; `density`: `compact` | `default` | `comfortable`

- Do not invent TopBar, NavBar, Header, GlobalSearch, UserBadge, UserMenu or CompanyBadge.
- Do not put the page title, breadcrumbs or page actions in it. They belong in the page.
- Do not put more than three icon actions in it.

### AppNav

The app's main navigation: a brand rail of sections on the left, each with an optional second-level menu that flies out beside it.

Props — `expanded`: boolean; `pinned`: boolean; `defaultPinned`: boolean

- Do not invent a Sidebar, NavRail, Flyout or local menu beside it.
- Do not put page actions, filters or tabs in it. Those belong in the page.
- Do not nest a third level. A section has one menu of links, split by dividers.

### Breadcrumb

Path to the current page as a trail of links.

Props — `separator`: `slash` | `chevron` (default `slash`); `current`: boolean

- Do not invent a local Breadcrumb, BreadcrumbItem or BreadcrumbLink.
- Do not make the current page a link.
- Do not use Breadcrumb as the sidebar or as tabs.

### ChatHeader

The bar at the top of the assistant: its mark and name, then start a new chat, go full screen, the options menu and close.

Props — `expanded`: boolean; `planMode`: boolean

- Do not use it as the app's top bar. Use AppHeader.
- Do not use it as a page title. Use PageHeader.
- Do not build the bar from Buttons and a Logo, or add an AiHeader or CopilotBar. Use this.

### ChatList

The saved chats or playbooks beside the assistant: a titled panel with a search box and rows that open what they name.

Props — `searchable`: boolean

- Do not use it for app navigation. Use AppNav.
- Do not use it for a list of records people sort and filter. Use Table.
- Do not build the rows from your own divs, or add a ChatRow or PlaybookItem. Pass items.

### GlobalSearch

A search field over a grouped list of pages, records and actions.

Props — `variant`: `list` | `tabs` (default `list`); `iconStyle`: `tile` | `plain` (default `tile`); `size`: `sm` | `md` (default `md`); `hints`: boolean; `autoFocus`: boolean

- Do not invent CommandInput, CommandList, CommandItem, CommandGroup, CommandEmpty, CommandDialog or SearchPanel.
- Do not use for a short list of actions from a button. Use Dropdown.
- Do not use for choosing a form value. Use RadioGroup, or Select when it exists.

### GuidedProcess

The pieces of a process walked one step at a time: a dark panel for a step, the dark list of every step beside the page, the header over a step, and the footer under it.

Props — `part`: `panel` | `steps` | `header` | `footer` (default `panel`); `started`: boolean; `placement`: `auto` | `side` | `band` (default `auto`); `shade`: `1` | `2` | `3` | `4` | `5` (default `1`); `side`: `start` | `end` (default `end`)

- Do not use it for a short flow inside a Modal or a Drawer. Use Steps.
- Do not use it for page sections that can be visited in any order. Use Tabs or AnchorNav.
- Do not invent GuidedProcessPanel, GuidedProcessSteps, GuidedProcessHeader, GuidedProcessFooter or a light version of the dark parts.

### Link

Inline text that takes people somewhere: a record, a list or another page.

Props — `intent`: `brand` | `neutral` (default `brand`); `external`: boolean; `disabled`: boolean

- Do not use Link for an action that changes data, like Delete or Save. Use Button.
- Do not use Link in a table cell. Use a link Cell.
- Do not stack Links into a list yourself. Use LinkList.

### LinkList

A column of links, one a row with a chevron at the end, like an account's quick links.

- Do not use it for actions that change data. Use Buttons or a Dropdown.
- Do not use it for page navigation across the app. Use AppNav or Tabs.
- Do not put it in a Card or draw a box round it yourself. Put it in a Section.

### PageHeader

The top of a page's content: where it sits (breadcrumb), what it is (title, badge, and an optional icon) and the page actions.

Props — `badgeIntent`: `neutral` | `info` | `success` | `warning` | `danger` | `highlight` (default `neutral`); `sticky`: boolean; `shadow`: boolean

- Do not invent ContentHeader, PageTitle, TitleBar or a local heading row.
- Do not put the app's logo, search or user in it. That is the AppHeader.
- Do not put more than one strong brand Button in actions, or more than five visible actions.

### Pagination

The bar under a long table that moves between pages, says which rows are showing, and lets people pick how many rows a page holds.

Props — `showRange`: boolean; `showPageSize`: boolean

- Do not use it to switch views or steps. Use Tabs.
- Do not build page buttons from a ButtonGroup or loose Buttons. Use Pagination.
- Do not invent a PageSizeSelect or RowsInfo. Turn showPageSize and showRange on or off.

### Steps

A row of numbered steps that shows where a person is in a flow of a few steps: done, current and still to come.

Props — `size`: `sm` | `md` (default `md`); `fill`: boolean

- Do not use it for page sections the person can visit in any order. Use Tabs.
- Do not use it for a single amount done. Use Meter.
- Do not put the Back and Next buttons inside it; they belong to the page.

### Tabs

A row of tabs that switches between related views in the same place.

Props — `size`: `sm` | `md` | `lg` (default `sm`); `expand`: boolean; `border`: boolean

- Do not invent TabList, Tab, TabPanel, TabsTrigger or a local tab strip. It is one component.
- Do not use for app or page navigation. Use the side nav.
- Do not use for a small choice that applies at once, like density or List / Board. Use Segmented.

### Toolbar

The bar above a list or table: find and filter on the left, view and actions on the right, with a filter bar that opens under it.

Props — `filtersOpen`: boolean; `defaultFiltersOpen`: boolean; `buttons`: `raised` | `subtle` (default `raised`)

- Do not invent a FilterBar, ListToolbar or a local row of controls above a table.
- Do not open the filter bar when the screen loads. It starts closed; people open it with Filters, and filterCount still says the list is narrowed.
- Do not put more than one strong brand Button in actions.

## overlay

### AlertDialog

Overlay that stops the user until they cancel or confirm.

Props — `open`: boolean; `actionIntent`: `brand` | `danger` (default `brand`); `size`: `sm` | `md` (default `md`)

- Do not invent a local confirm dialog or use window.confirm.
- Do not put forms, tables or extra actions inside.
- Do not add a close X or close on backdrop click.

### Drawer

A panel that slides in from the right edge for a detail view or an edit form about something on the page, while the page stays in view behind it.

Props — `open`: boolean; `size`: `narrow` | `medium` | `wide` | `extended` (default `narrow`); `showClose`: boolean

- Do not use it for main navigation. Use AppNav.
- Do not open a drawer from inside another drawer.
- Do not use it for a decision that must block the page. Use Modal or AlertDialog.

### Dropdown

A short list of actions or options that opens from a Button or a FilterButton.

Props — `trigger`: `button` | `filter` | `field` (default `button`); `emphasis`: `strong` | `subtle` | `minimal` (default `subtle`); `intent`: `brand` | `neutral` | `danger` (default `neutral`); `size`: `sm` | `md` | `lg` (default `md`); `iconOnly`: boolean; `alignment`: `left` | `right` (default `left`); `disabled`: boolean; `closeOnSelect`: boolean; `open`: boolean; `multiple`: boolean; `muted`: boolean; `toggle`: `on` | `off`; `searchable`: boolean; `menuWidth`: `default` | `field` (default `default`)

- Do not invent DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, MenuDivider, ContextMenu or Popover cousins.
- Do not use for choosing a value in a form. Use Select.
- Do not put page navigation here. Use links.

### HelpPopover

A small help panel with an optional title and a short paragraph, opened from a ? icon beside a label or setting.

Props — `position`: `above` | `below` | `left` | `right` (default `below`); `open`: boolean; `disabled`: boolean

- Do not invent Popover, HoverCard, InfoTip, ContextInfo or a local help panel.
- Do not use for an icon button's name. Use Tooltip.
- Do not put links, buttons or forms in it. Use Modal.

### Modal

A window over the page for a short task, a form or extra detail.

Props — `open`: boolean; `size`: `sm` | `md` | `lg` | `xl` | `fullscreen` (default `sm`); `showClose`: boolean

- Do not invent Dialog, DialogTrigger, DialogContent, ModalCard, Sheet or CommandDialog.
- Do not use for a must-choose confirm. Use AlertDialog.
- Do not put page navigation or long flows in a modal. Use a page.

### Tooltip

Brief extra text on hover or keyboard focus of one trigger.

Props — `position`: `above` | `below` | `left` | `right` (default `above`); `open`: boolean; `disabled`: boolean

- Do not invent Popover, HoverCard, InfoTip or a local tooltip. For a titled help panel, use HelpPopover.
- Do not put required instructions in a tooltip. Use the field's hint.
- Do not put links, buttons or forms in it. Use Modal.
