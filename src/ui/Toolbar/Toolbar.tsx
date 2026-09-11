"use client";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "../Button/Button";
import { Command, type CommandGroup } from "../Command/Command";
import { DropdownMenu, type DropdownMenuEntry } from "../DropdownMenu/DropdownMenu";
import { HelpPopover } from "../HelpPopover/HelpPopover";
import { Icon } from "../Icon/Icon";
import { Input } from "../Input/Input";
// The search trigger reuses Input's small field box, so it looks like the plain search field.
import field from "../Input/Input.module.css";
import { Tooltip } from "../Tooltip/Tooltip";
import { useFloating, useInBrowser } from "../Tooltip/useFloating";
import styles from "./Toolbar.module.css";

export interface ToolbarView { id: string; label: string }

export interface ToolbarProps {
  filters?: ReactNode;
  filtersOpen?: boolean;
  defaultFiltersOpen?: boolean;
  onFiltersOpenChange?: (open: boolean) => void;
  onReset?: () => void;
  onApply?: () => void;
  filterHelp?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchGroups?: CommandGroup[];
  onSearchSelect?: (id: string) => void;
  onSearchViewAll?: (query: string) => void;
  views?: ToolbarView[];
  view?: string;
  onViewChange?: (id: string) => void;
  onRefresh?: () => void;
  moreActions?: DropdownMenuEntry[];
  onMoreSelect?: (id: string) => void;
  actions?: ReactNode;
  label?: string;
}

// Figma toolbar 6057:15099 and filters-bar 3579:30240. Controls are size sm (28px) in a 44px bar.
export function Toolbar({
  filters, filtersOpen: openProp, defaultFiltersOpen = false, onFiltersOpenChange, onReset, onApply, filterHelp,
  searchValue, onSearchChange, searchPlaceholder = "Search in list", searchGroups, onSearchSelect, onSearchViewAll,
  views = [], view: viewProp, onViewChange, onRefresh, moreActions, onMoreSelect, actions, label = "List tools",
}: ToolbarProps) {
  const barId = useId();
  const [innerOpen, setInnerOpen] = useState(defaultFiltersOpen);
  const [innerView, setInnerView] = useState(views[0]?.id);
  const open = Boolean(filters) && (openProp ?? innerOpen);
  const view = viewProp ?? innerView;
  const current = views.find((v) => v.id === view) ?? views[0];

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setInnerOpen(next);
    onFiltersOpenChange?.(next);
  };
  const pickView = (id: string) => {
    if (viewProp === undefined) setInnerView(id);
    onViewChange?.(id);
  };

  // Search dropdown: with searchGroups the field is a trigger that opens a kit Command laid exactly over it, same
  // width, so the field seems to grow down into the results. Like the AppHeader search, in the small size.
  const searchRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inBrowser = useInBrowser();
  const [searchOpen, setSearchOpen] = useState(false);
  const [fit, setFit] = useState({ gap: 0, width: 0 });
  const [lastQuery, setLastQuery] = useState("");
  const shown = searchValue ?? lastQuery;
  const dropdown = inBrowser && Boolean(searchGroups) && searchOpen;
  useFloating(dropdown, searchRef, panelRef, "bottom", fit.gap);

  const openSearch = () => {
    const trigger = searchRef.current?.querySelector("button");
    if (trigger) setFit({ gap: -trigger.offsetHeight, width: trigger.offsetWidth });
    setSearchOpen(true);
  };
  const closeSearch = (refocus: boolean) => {
    setSearchOpen(false);
    if (refocus) searchRef.current?.querySelector("button")?.focus();
  };
  useEffect(() => {
    if (!dropdown) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !searchRef.current?.contains(t)) setSearchOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [dropdown]);
  // Escape closes once the query is empty (Command clears it first).
  const onPanelKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || e.defaultPrevented) return;
    e.preventDefault();
    closeSearch(true);
  };

  const hasSearch = Boolean(onSearchChange) || Boolean(searchGroups);
  const find = Boolean(filters) || hasSearch;
  const viewing = views.length > 0 || Boolean(onRefresh);
  const hasEnd = Boolean(moreActions?.length) || Boolean(actions);

  return (
    <div className={styles.toolbar} role="group" aria-label={label}>
      <div className={styles.bar}>
        <div className={styles.start}>
          {filters && (
            <Button
              size="sm" iconStart="filter_list" pressed={open}
              aria-expanded={open} aria-controls={barId} onClick={() => setOpen(!open)}
            >
              Filters
            </Button>
          )}
          {searchGroups ? (
            <div ref={searchRef} className={[styles.search, field.sm].join(" ")}>
              <button
                type="button" className={[field.field, styles.searchTrigger].join(" ")}
                aria-haspopup="dialog" aria-expanded={searchOpen} onClick={() => (searchOpen ? closeSearch(false) : openSearch())}
              >
                <Icon name="search" size="sm" className={styles.searchIcon} />
                <span className={shown ? styles.searchText : styles.searchPlaceholder}>{shown || searchPlaceholder}</span>
              </button>
            </div>
          ) : onSearchChange && (
            <div className={styles.search}>
              <Input
                size="sm" type="search" hideLabel label={searchPlaceholder} placeholder={searchPlaceholder}
                iconStart="search" value={searchValue} onChange={onSearchChange}
              />
            </div>
          )}
          {find && viewing && <span className={styles.divider} aria-hidden="true" />}
          {current && (
            <DropdownMenu
              label={current.label} size="sm"
              items={views.map((v) => ({ id: v.id, label: v.label, selected: v.id === current.id }))}
              onSelect={pickView}
            />
          )}
          {onRefresh && (
            <Tooltip content="Refresh" placement="bottom">
              <Button size="sm" iconOnly iconStart="cached" onClick={onRefresh}>Refresh</Button>
            </Tooltip>
          )}
        </div>
        {hasEnd && (
          // Same order as the PageHeader: More (overflow) first, then the actions with the one primary last.
          <div className={styles.end}>
            {moreActions && moreActions.length > 0 && (
              <DropdownMenu label="More" variant="tertiary" size="sm" align="end" items={moreActions} onSelect={onMoreSelect} />
            )}
            {actions}
          </div>
        )}
      </div>
      {dropdown && searchGroups && createPortal(
        <div ref={panelRef} role="dialog" aria-label={searchPlaceholder} className={styles.searchPanel} style={{ width: fit.width }} onKeyDown={onPanelKey}>
          <Command
            groups={searchGroups} size="sm" iconStyle="plain" hints={false} autoFocus
            label={searchPlaceholder} placeholder={searchPlaceholder} defaultQuery={shown}
            onSelect={(id) => { closeSearch(true); onSearchSelect?.(id); }}
            onViewAll={onSearchViewAll ? (q) => { setLastQuery(q); onSearchChange?.(q); closeSearch(true); onSearchViewAll(q); } : undefined}
          />
        </div>,
        document.body,
      )}
      {open && (
        <div id={barId} className={styles.filters} role="group" aria-label="Filters">
          <div className={styles.chips}>
            {filters}
            {(onReset || onApply) && (
              <span className={styles.apply}>
                {onReset && <Button variant="tertiary" size="sm" onClick={onReset}>Reset</Button>}
                {onApply && <Button variant="tertiary" size="sm" iconStart="check" onClick={onApply}>Apply filters</Button>}
              </span>
            )}
          </div>
          {filterHelp && (
            <HelpPopover title="Filters" content={filterHelp} placement="left">
              <Button variant="tertiary" size="sm" iconOnly iconStart="help_center">Filter help</Button>
            </HelpPopover>
          )}
        </div>
      )}
    </div>
  );
}
