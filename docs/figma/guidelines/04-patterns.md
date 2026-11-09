# Agentic BP DS — screen patterns

A pattern is a whole-screen blueprint. When one fits the screen, use it: it already
settles the frame, the page header, the bar, the spacing and the scroll behaviour.
Do not lay a screen out by hand that a pattern covers, and do not change a pattern's
structure to suit one screen.

## AccountFlow

The account provisioning flow: the accounts list, one account with its tabs, a new account, a new product on an account, and configuring that product alone or many products at once, one page at a time.

Use AccountFlow for the screens people move between when they set up and look after accounts. It is a blueprint: each page is a kit pattern the screen builds, and the screen owns which one is showing, the records and what was just saved. list is a kit ListPage: a Toolbar with filters, search, the view picker and refresh, and a Table whose Account ID is a link Cell that opens the account, with Pagination under it; Table View is the default, and List View swaps the Table for a kit ListView of the same accounts whose rows open the account; the page's New and Export go in the AppShell's kit PageHeader, not in the Toolbar.

**Use when**

- Prototyping account screens that link together: find an account, open it, add an account or a product.
- Showing how a list, a record and its create forms hand over to each other.
- Adding products to an account: pick one and configure it, or add many at once in a grid.

**Composes** `Accordion`, `Callout`, `AppShell`, `Badge`, `Cell`, `Checkbox`, `DataGrid`, `DatePicker`, `Drawer`, `EmptyState`, `Form`, `FormDisplay`, `FormPage`, `Input`, `Link`, `LinkList`, `ListPage`, `Lookup`, `PageHeader`, `Pagination`, `RadioGroup`, `RecordPage`, `Scoreboard`, `Section`, `Select`, `Table`, `Tabs`, `Toolbar`

**Do not**

- Do not put the list's New and Export in its Toolbar. Page actions go in the PageHeader; the Toolbar keeps filters, search, the view and refresh.
- Do not show the Account ID as plain text. It is a link Cell, so people can tell it opens the account.
- Do not use Inputs to show saved account values. Use FormDisplay.
- Do not build a second list, record or form layout inside it. Use ListPage, RecordPage and FormPage.
- Do not keep the view or the records in the pattern. The screen owns them.
- Do not put page padding on it. The AppShell page owns that.
- Do not put a second strong brand Button on provisionProduct or bulkProducts: Save draft and Validate stay subtle beside the one Provision.

## AppShell

The frame every product screen sits in: the bar across the top, the rail under it down the side, the page in the middle, and the assistant beside it.

Use AppShell as the outer frame of a screen. It is a blueprint: it composes kit pieces and keeps no state of its own, so the screen decides what is open. Pass the kit AppHeader as header: it runs the full width across the top, and the rail starts under it. Never pass a shorter list or make up links. pageHeader takes a kit PageHeader and stays at the top of the page while the page scrolls under it, flush to the top edge; The frame shrinks it to the kit's compact 52px bar on its own once the top of the page has scrolled away, so a screen passes a plain PageHeader and wires nothing; set sticky on the PageHeader yourself only to override that. children are the page itself, already inside the scrolling content area with its edge padding and the gap between Sections, so screens do not add their own. The frame answers to its own width rather than the window's, so under about 640 the rail goes and an open assistant takes the page's place, whether it is docked in a panel or filling a screen. The frame marks itself, so panels that float out of the bar or the rail — menus, tooltips, the search dropdown — keep inside it rather than over whatever is beside it.

**Use when**

- Any product screen: a list, a record, a dashboard.
- A screen the assistant can be opened beside.
- The assistant's full-screen view, keeping the bar and the side nav.

**Composes** `AppHeader`, `AppNav`, `PageHeader`, `ChatWindow`, `Section`

**Do not**

- Do not add state to it; it is a blueprint. Keep which nav section, which page, whether the assistant is open and whether the page header is compact in the screen.
- Do not build the bar, the rail or the page header inside it. Pass the kit pieces.
- Do not trim, reorder or invent side nav links. Every screen passes the full APP_NAV and APP_NAV_END from @/patterns/AppShell/appNav and marks its own page with current.
- Do not add page padding or a gap between Sections in the screen; the content area already has both.
- Do not swap a full-size ChatWindow into the page area or hide the page header by hand. Set assistantSize full.
- Do not invent a second frame or a per-page grid beside it.
- Do not use raw hex.

## ChatWindow

The assistant window: its header over the turns, the composer at the foot, and the saved chats coming in beside or over them.

Use ChatWindow for the assistant beside a screen, or for its full-screen view. It is a blueprint: it composes kit pieces and keeps no state of its own, so the screen decides what is shown. The box runs edge to edge at the foot of the window, with one line over it, rather than sitting in the body as a card of its own. size panel is the 395 column beside the page; size full fills the space it is given and sets the chats beside the conversation instead of over it; inside AppShell, pair it with assistantSize full. On a phone-width frame the panel gives up its 395 column and takes the whole width, since the assistant stands in for the page there rather than sitting beside it.

**Use when**

- The assistant docked beside a product screen.
- The assistant's full-screen view, with the saved chats beside it.

**Composes** `ChatHeader`, `ChatMessage`, `ChatComposer`, `ChatList`, `EmptyState`, `Illustration`, `Button`

**Do not**

- Do not add state to it; it is a blueprint. Keep the view, the turns and the panel in the screen.
- Do not build the header, the turns or the box inside it. Pass the kit pieces.
- Do not build the Get Started block from EmptyState, Illustration and Buttons in the screen. Pass starters and art.
- Do not use it as an overlay dialog. Use Drawer or Modal.
- Do not invent a second assistant layout beside it.
- Do not use raw hex.

## Dashboard

The home screen of a job: the numbers that matter, grouped, with the charts and lists that explain them.

Use Dashboard for a home screen that reports rather than lists: accounting, billing, revenue. It is a blueprint: it composes kit pieces and keeps no state of its own, so the screen owns which dashboard is showing, which groups are open and what the filters are. Pass the kit Toolbar as toolbar, with the filters, the search, the view and refresh; it stays at the top under the page header while the groups scroll, with a lift under it once it is holding. A Table too wide for its group scrolls sideways inside its own box instead of moving the page, and then its names rest at the top of that box rather than under the bar. Inside a group, lead with a kit Scoreboard of that group's few numbers, then the tiles that explain them: kit BarChart, LineChart or PieChart, a kit Table with its own Toolbar over it, for the filters and the export that belong to that table alone, a kit Timeline of what happened.

**Use when**

- A home screen that reports on a job: what is owed, what is due, what closed.
- Numbers that need grouping, each group with its own charts and lists.
- A screen where people pick between saved dashboards.

**Composes** `Toolbar`, `Dropdown`, `Section`, `Scoreboard`, `BarChart`, `LineChart`, `PieChart`, `Legend`, `Table`, `Timeline`, `EmptyState`, `Skeleton`

**Do not**

- Do not add state to it; it is a blueprint. Keep the dashboard, the open groups and the filters in the screen.
- Do not build the bar, the groups or the tiles inside it. Pass the kit pieces.
- Do not invent a tile grid, and do not put more than five tiles in a row. Two side by side is.layout-split, three is.layout-split--thirds, four or five is.layout-metrics with --fixed-4 or --fixed-5.
- Do not stack more than one strong brand Button across the whole dashboard.
- Do not use it to list records. Use ListPage.
- Do not add page padding around it. It sits in the AppShell page, which owns that.
- Do not use raw hex.
- Do not repeat the meta stamp in a section description or a table caption. The page carries one.

## FormPage

One record being filled in: its name and the save at the top, anything that has to be read first under that, and the fields in folding groups underneath.

Use FormPage to create or edit one record: a new account, a new invoice, a rate card. It is a blueprint: it composes kit pieces and keeps no state of its own, so the screen owns the values and what is folded away. Pass the kit PageHeader as header, with the trail, what is being made, and the actions: Cancel, then one strong brand Button that saves. columns (1, 2 or 3, default 2) is set on the FormPage and the Form follows it unless it sets its own; each column stops at 554px (--layout-column-max) and the fields stay at the start, so on a wide screen the space past the last column stays empty instead of stretching the fields. Never more than 3 columns, even at 2560px and wider. Do not put a second save at the foot of the page: the one in the header is always in reach.

**Use when**

- Making a new record from a page of its own, not from a Modal.
- Editing a record's fields on a page, where the groups of fields are long enough to fold.
- The save has to be in reach while a long form is scrolled.

**Composes** `PageHeader`, `Callout`, `Form`, `Section`, `Input`, `Select`, `Checkbox`, `DatePicker`, `Lookup`

**Do not**

- Do not invent CreatePage, EditPage, NewRecordPage or FormLayout.
- Do not put a Form inside every Section yourself. One Form holds the groups as sections, so one press saves the page.
- Do not add a second save bar at the foot. The header keeps the save in reach.
- Do not put page padding on it. The AppShell page owns that.
- Do not use it for a short form. Two or three fields belong in a Modal or a Drawer.
- Do not keep the fold state or the values in the pattern. The screen owns them.
- Do not set a width on the Form or stretch its columns to fill a wide page. Pass columns to the FormPage; each column stops at 480px.
- Do not use more than 3 columns, even on a 2560px or wider screen.

## GuidedProcessPage

A process walked one page per step: a dark column per step before it starts, then each step's fields with every step on a dark panel at the start or end edge of the page.

Use GuidedProcessPage for a process of a few steps that each need a page, like importing usage, registering a supplier or setting up a billing run. It is a blueprint: it only places kit GuidedProcess parts and keeps no state of its own, so the screen owns whether it has started, which step is on, what has been saved and whether the steps drawer is open. view intro is before the process starts: pass intro, one GuidedProcess panel per step, with shade 1 to 5 along the way and the first carrying the process name, Start and Cancel; from 1024 of box width they stand as columns across the page and scroll sideways when there are more than fit, and under 1024 they stack. Only the step scrolls; the footer stays under it.

**Use when**

- A process of a few steps done in order where each step is a page of fields.
- Work that can be saved and picked up again part way through.

**Composes** `GuidedProcess`, `Form`, `Callout`

**Do not**

- Do not invent WizardPage, StepPage, a steps panel or a footer bar of your own. The parts are GuidedProcess.
- Do not put a PageHeader over it. The header part names the step.
- Do not use it for a short flow; two or three fields belong in a Modal with Steps.
- Do not put page padding on it. It fills the AppShell page.
- Do not give the steps part a different side from the page.
- Do not keep whether it has started, the current step, the saved time or the open drawer in the pattern. The screen owns them.

## ListDetail

A list with the picked record beside it: a ListView on one side and the record in a pane on the other, or one at a time on a phone.

Use ListDetail when people go through records one after another without leaving the list: an invoice queue, an inbox, approvals. It is a blueprint: it composes kit pieces and keeps no state of its own. list is a kit ListView, usually with selection single and interaction drill; its onOpen tells the screen which record is open.

**Use when**

- Going through records one after another: an invoice queue, an inbox, approvals.
- A record short enough to read in a pane beside the list.
- A list that must stay in view while its records are read.
- Records under other records, like an account's invoices: a nested ListView steps in, and the leaf opens beside it.
- A long queue split by status: a grouped ListView keeps what needs attention on top.
- Stacked when the list is short and the record needs the full width; inline when people read one record at a time and want the rest of the list to stay in place around it.

**Composes** `ListView`, `Section`, `FormDisplay`, `EmptyState`, `Button`

**Do not**

- Do not add state to it; it is a blueprint. The screen keeps which record is open.
- Do not use it for records with a lot to show or edit. Drill into a RecordPage instead.
- Do not build the list inside it. Pass a kit ListView.
- Do not put the page's name inside it. That is the PageHeader in the frame around it.
- Do not use raw hex.

## ListPage

A list of records: the bar to find and filter them, the rows themselves, and the pages under them.

Use ListPage for any screen that lists records: invoices, accounts, quotes. It is a blueprint: it composes kit pieces and keeps no state of its own, so the screen owns the filters, the rows and which page is showing. Pass the kit Toolbar as toolbar and the list itself as children. A Table too wide for the page is the one thing that scrolls sideways on its own, inside its own box, and then its column names hold at the top of that box rather than under the Toolbar — a cell can only hold still against whatever scrolls. The page itself never slides sideways. Under that band is the scroll shadow: a lift that reaches both page edges while the bar and the table keep the page's side padding, drawn only once the band has pinned, and the column names give up their own line while it is. bulk is the bar of actions for the rows that are ticked; it takes the toolbar's place while something is selected, so the two are never both there.

**Use when**

- A screen that lists records with a search, filters and pages.
- A list that has to show loading, empty and failed states.
- A list people can lay out more than one way.

**Composes** `Toolbar`, `Table`, `ListView`, `Card`, `Pagination`, `EmptyState`, `Skeleton`, `Callout`

**Do not**

- Do not add state to it; it is a blueprint. Keep the filters, the rows, the selection and the page in the screen.
- Do not build the bar, the rows or the pages inside it. Pass the kit pieces.
- Do not show the bulk bar and the toolbar at once; passing bulk swaps them.
- Do not add page padding around it. It sits in the AppShell page, which owns that.
- Do not use it for one record's details. That is a record screen.
- Do not use raw hex.
- Do not give the table a caption that repeats label; the list is already named.
- Do not repeat the meta stamp in a table caption or a section description. The page carries one.

## RecordPage

One record: its name and actions at the top, the tabs of what belongs to it, the numbers that matter, and its details in sections underneath.

Use RecordPage for a single record: an account, an invoice, a quote. It is a blueprint: it composes kit pieces and keeps no state of its own, so the screen owns the tab, the sections and what is open. Pass the kit PageHeader as header, with the trail, the record name, its status Badge and the record actions. columns (1, 2 or 3, default 2) and labelPosition (default start) are set once on the RecordPage and every Section of rows, or Form, inside the details follows them unless it sets its own; each column stops at 554px (--layout-column-max) and the rows stay at the start, so on a wide screen the space past the last column stays empty instead of stretching the rows. Never more than 3 columns, even at 2560px and wider. One too wide for the record scrolls sideways inside its own box rather than moving the page, and then its names hold at the top of that box instead of under the bar.

**Use when**

- One record with its details in sections.
- A record whose related lists live behind tabs.

**Composes** `PageHeader`, `Tabs`, `Callout`, `Toolbar`, `Scoreboard`, `Section`, `Form`, `FormDisplay`, `Table`

**Do not**

- Do not add state to it; it is a blueprint. Keep the tab, the sections and the notice in the screen.
- Do not build the header, the tabs or the bar inside it. Pass the kit pieces.
- Do not put page padding around it. It sits in the AppShell page, which owns that.
- Do not use it for a list of records. Use ListPage.
- Do not stack more than one Callout over the record; say the one thing that matters.
- Do not use raw hex.
- Do not wrap the details in a Form just to get columns, or set a width on them. Pass columns to the RecordPage; the Sections follow.
- Do not use more than 3 columns, even on a 2560px or wider screen.
- Do not put a related Table into columns. A Section holding a Table stays full width on its own.

## SettingsPage

The settings home: a grid of the places people can go from here, each with its own icon and color.

Use SettingsPage for a home that sends people onwards rather than showing them data: the settings home, or another home shaped like it, such as a reports home. It is a blueprint: it composes kit pieces and keeps no state of its own. children are kit NavTiles, one per place, each with its own intent so the colors become part of how people find the same place again.

**Use when**

- The settings home: a page whose job is to send people on.
- Another home shaped the same way, like a reports home.
- A set of places where the icon and its color help people find the same one again.

**Composes** `NavTile`, `Section`, `Callout`

**Do not**

- Do not add state to it; it is a blueprint.
- Do not build the tiles inside it. Pass kit Tiles.
- Do not use kit Cards as the tiles; a Card is for comparing and picking, a NavTile is a way in.
- Do not put the page's name inside it. That is the PageHeader in the frame around it.
- Do not add a grid of your own or page padding around it.
- Do not use raw hex.
