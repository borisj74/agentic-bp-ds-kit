"use client";
import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "../Avatar/Avatar";
import { Badge, type BadgeTone } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { Command, type CommandGroup, type CommandIconStyle, type CommandScope, type CommandVariant } from "../Command/Command";
import { useDensity, type DensitySize } from "../Density/Density";
import { DropdownMenu } from "../DropdownMenu/DropdownMenu";
import { Icon } from "../Icon/Icon";
import { Logo } from "../Logo/Logo";
import { SegmentedControl } from "../SegmentedControl/SegmentedControl";
import { Switch } from "../Switch/Switch";
import { Tooltip } from "../Tooltip/Tooltip";
import { useFloating, useInBrowser } from "../Tooltip/useFloating";
import styles from "./AppHeader.module.css";

export type AppHeaderEnvironmentTone = Exclude<BadgeTone, "hollow">;
export type AppHeaderDensity = "compact" | "default" | "comfortable";
export interface AppHeaderAction { id: string; label: string; icon: string }
export interface AppHeaderUser { name: string; src?: string }
export interface AppHeaderCompany { name: string; logo?: ReactNode }

export interface AppHeaderProps {
  onNavToggle?: () => void;
  navOpen?: boolean;
  logo?: ReactNode;
  homeHref?: string;
  environment?: string;
  environmentTone?: AppHeaderEnvironmentTone;
  search?: boolean;
  searchPlaceholder?: string;
  searchShortcut?: string;
  onSearch?: () => void;
  searchGroups?: CommandGroup[];
  searchVariant?: CommandVariant;
  searchIconStyle?: CommandIconStyle;
  onSearchSelect?: (id: string) => void;
  searchScopes?: CommandScope[];
  searchScope?: string;
  onSearchScopeChange?: (scope: string) => void;
  actions?: AppHeaderAction[];
  onAction?: (id: string) => void;
  user?: AppHeaderUser;
  company?: AppHeaderCompany;
  onUserSettings?: () => void;
  darkMode?: boolean;
  onDarkModeChange?: (on: boolean) => void;
  density?: AppHeaderDensity;
  onDensityChange?: (density: AppHeaderDensity) => void;
  onLogout?: () => void;
}

const DENSITIES: { value: AppHeaderDensity; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "default", label: "Default" },
  { value: "comfortable", label: "Comfortable" },
];
const MENU_GAP = 4; // px between a trigger and its panel
const COMMAND_ROW = 44; // the kit Command search row is --control-large tall
// The header follows density too: its buttons use the kit sizes, and the bar and search change height in CSS.
const CONTROL: Record<AppHeaderDensity, DensitySize> = { compact: "sm", default: "md", comfortable: "lg" };

export function AppHeader({
  onNavToggle, navOpen = false, logo, homeHref, environment, environmentTone = "success",
  search = true, searchPlaceholder = "Search", searchShortcut, onSearch,
  searchGroups, searchVariant = "list", searchIconStyle = "tile", onSearchSelect, searchScopes, searchScope, onSearchScopeChange,
  actions = [], onAction, user, company,
  onUserSettings, darkMode = false, onDarkModeChange, density: densityProp, onDensityChange, onLogout,
}: AppHeaderProps) {
  // Its own density prop (the value in the account menu) wins, else a surrounding Density.
  const surrounding = useDensity();
  const density = densityProp ?? surrounding;
  const ctl = CONTROL[density];
  const menuId = useId();
  const userRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const inBrowser = useInBrowser();
  // The avatar always opens something: the account menu, built from whichever handlers are passed.
  const hasMenu = Boolean(user && (onUserSettings || onDarkModeChange || onDensityChange || onLogout));
  const open = inBrowser && hasMenu && menuOpen;
  const who = user || company;

  useFloating(open, userRef, menuRef, "bottom", MENU_GAP);

  // Search dropdown: with searchGroups the trigger (wide field or compact icon) opens a kit Command under it.
  const centerRef = useRef<HTMLDivElement>(null);
  const compactRef = useRef<HTMLSpanElement>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFit, setSearchFit] = useState<{ gap: number; width?: number }>({ gap: MENU_GAP });
  const searchIsOpen = inBrowser && Boolean(searchGroups) && searchOpen;
  useFloating(searchIsOpen, anchorRef, searchPanelRef, "bottom", searchFit.gap);

  // One search box: from the wide field, the Command's own search row lays exactly over the header field
  // (same width, centred on it), so the field seems to grow down into the dropdown. From the compact icon
  // there is no field in the bar, so the dropdown opens just below the icon with its search row on top.
  const openSearch = (anchor: HTMLElement | null, cover: boolean) => {
    if (!searchGroups) {
      onSearch?.();
      return;
    }
    anchorRef.current = anchor;
    const field = anchor?.querySelector("button");
    setSearchFit(cover && field ? { gap: -(field.offsetHeight / 2 + COMMAND_ROW / 2), width: field.offsetWidth } : { gap: MENU_GAP });
    setSearchOpen((o) => !o);
  };
  const closeSearch = (refocus: boolean) => {
    setSearchOpen(false);
    if (refocus) anchorRef.current?.querySelector("button")?.focus();
  };
  // A click outside closes it. The scope menu is portaled as well, so a click in an open menu counts as inside.
  useEffect(() => {
    if (!searchIsOpen) return;
    const away = (e: PointerEvent) => {
      const target = e.target as Element;
      if (searchPanelRef.current?.contains(target) || anchorRef.current?.contains(target) || target.closest?.('[role="menu"]')) return;
      setSearchOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [searchIsOpen]);
  // Escape closes once the query is empty (Command clears it first) and the scope menu is shut.
  const onSearchKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || e.defaultPrevented) return;
    e.preventDefault();
    closeSearch(true);
  };
  const searchPopup = searchGroups ? { "aria-haspopup": "dialog" as const, "aria-expanded": searchOpen } : {};

  const avatarButton = () => userRef.current?.querySelector("button");
  const closeMenu = (refocus: boolean) => {
    setMenuOpen(false);
    if (refocus) avatarButton()?.focus();
  };

  // Opening moves focus to the first control in the menu.
  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLElement>('button:not([disabled]), [tabindex="0"]')?.focus();
  }, [open]);

  // A click anywhere else closes it without moving focus.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || userRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  // Escape closes and returns focus to the avatar. preventDefault keeps an enclosing Modal open.
  const onMenuKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    closeMenu(true);
  };
  // Tabbing out of the menu closes it.
  const onMenuBlur = (e: FocusEvent) => {
    const next = e.relatedTarget as Node | null;
    if (next && !menuRef.current?.contains(next) && !userRef.current?.contains(next)) setMenuOpen(false);
  };

  // The kit Logo drops to its symbol on narrow bars. A custom logo stays as passed.
  const brand = logo ?? (
    <>
      <span className={styles.brandFull}><Logo /></span>
      <span className={styles.brandSymbol}><Logo variant="symbol" /></span>
    </>
  );
  const avatar = user && <Avatar name={user.name} src={user.src} size={density === "comfortable" ? "md" : "sm"} />;

  return (
    <header className={[styles.header, density !== "default" ? styles[density] : ""].join(" ")}>
      <div className={styles.bar}>
        {/* Start: the side-nav toggle, brand, then the environment tag (UAT, Sandbox...) so people know where they are. */}
        <div className={styles.start}>
          {onNavToggle && (
            // The toggle stands over the rail it opens, so it takes the rail's width and centres in it.
            <span className={styles.toggle}>
              <Button variant="tertiary" size={ctl} iconOnly iconStart="menu" aria-expanded={navOpen} onClick={onNavToggle}>Navigation</Button>
            </span>
          )}
          {homeHref ? <a href={homeHref} className={styles.home} aria-label="Home">{brand}</a> : <span className={styles.home}>{brand}</span>}
          {/* The tag goes on a phone-width bar: the brand and the toggle come first there. */}
          {environment && (
            <span className={styles.env}>
              <Badge tone={environmentTone} emphasis="strong" size={density === "comfortable" ? "md" : "sm"}>{environment}</Badge>
            </span>
          )}
        </div>

        {/* Centre: the global search trigger. It opens search; the shortcut label is shown, not bound (yet). */}
        <div ref={centerRef} className={styles.center}>
          {search && (
            <button type="button" className={styles.search} {...searchPopup} onClick={() => openSearch(centerRef.current, true)}>
              <Icon name="search" size="md" className={styles.searchIcon} />
              <span className={styles.searchText}>{searchPlaceholder}</span>
              {searchShortcut && <kbd className={styles.shortcut} aria-hidden="true">{searchShortcut}</kbd>}
            </button>
          )}
        </div>

        {/* End: utility icon buttons, a divider, then who and where: the user and their company.
            On narrow bars the search moves here as an icon button. */}
        <div className={styles.end}>
          {search && (
            <span ref={compactRef} className={styles.searchCompact}>
              <Tooltip content={searchPlaceholder} placement="bottom">
                <Button variant="tertiary" size={ctl} iconOnly iconStart="search" {...searchPopup} onClick={() => openSearch(compactRef.current, false)}>{searchPlaceholder}</Button>
              </Tooltip>
            </span>
          )}
          {search && actions.length > 0 && <span className={`${styles.divider} ${styles.dividerCompact}`} aria-hidden="true" />}
          {actions.length > 0 && (
            <div className={styles.actions}>
              {actions.map((a) => (
                <Tooltip key={a.id} content={a.label} placement="bottom">
                  <Button variant="tertiary" size={ctl} iconOnly iconStart={a.icon} onClick={() => onAction?.(a.id)}>{a.label}</Button>
                </Tooltip>
              ))}
            </div>
          )}
          {/* On a phone-width bar there is no room for a row of icons, so the same actions go behind one more
              button. Only one of the two is ever shown, so neither adds a stop for the keyboard twice. */}
          {actions.length > 0 && (
            <div className={styles.actionsMenu}>
              <DropdownMenu
                label="More actions" icon="more_vert" iconOnly variant="tertiary" size={ctl} align="end"
                items={actions.map((a) => ({ id: a.id, label: a.label, icon: a.icon }))}
                onSelect={(id) => onAction?.(id)}
              />
            </div>
          )}
          {actions.length > 0 && who && <span className={styles.divider} aria-hidden="true" />}
          {who && (
            <div className={styles.who}>
              {user && (
                <span ref={userRef} className={styles.userWrap}>
                  {hasMenu ? (
                    <button
                      type="button" className={styles.user} aria-label={`Account: ${user.name}`}
                      aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls={menuOpen ? menuId : undefined}
                      onClick={() => setMenuOpen((o) => !o)}
                    >
                      {avatar}
                    </button>
                  ) : (
                    <span className={styles.user}>{avatar}</span>
                  )}
                </span>
              )}
              {company && (
                <span className={styles.company} title={company.name}>
                  {company.logo ?? <span className={styles.companyName}>{company.name}</span>}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search dropdown: the kit Command, fixed and portaled under the search trigger. Non-modal. */}
      {searchIsOpen && searchGroups && createPortal(
        <div ref={searchPanelRef} role="dialog" aria-label={searchPlaceholder} className={styles.searchPanel} style={{ width: searchFit.width }} onKeyDown={onSearchKey}>
          <Command
            groups={searchGroups} variant={searchVariant} iconStyle={searchIconStyle} label={searchPlaceholder} scopes={searchScopes} scope={searchScope} onScopeChange={onSearchScopeChange} autoFocus
            onSelect={(id) => { closeSearch(true); onSearchSelect?.(id); }}
          />
        </div>,
        document.body,
      )}

      {/* Account menu: fixed and portaled like DropdownMenu. A non-modal panel, since it holds a switch and a choice. */}
      {open && user && createPortal(
        <div ref={menuRef} id={menuId} role="dialog" aria-label={`Account: ${user.name}`} className={styles.menu} onKeyDown={onMenuKey} onBlur={onMenuBlur}>
          <p className={styles.menuName}>{user.name}</p>
          {onUserSettings && (
            <button type="button" className={styles.menuItem} onClick={() => { closeMenu(false); onUserSettings(); }}>
              <Icon name="settings" size="md" className={styles.menuIcon} />User settings
            </button>
          )}
          {onDarkModeChange && (
            <div className={styles.menuRow}><Switch label="Dark mode" size="md" checked={darkMode} onChange={onDarkModeChange} /></div>
          )}
          {onDensityChange && (
            <div className={styles.menuRow}>
              <SegmentedControl label="Density & text size" size="sm" options={DENSITIES} value={density} onChange={(v) => onDensityChange(v as AppHeaderDensity)} fullWidth />
            </div>
          )}
          {onLogout && (
            <>
              <hr className={styles.menuDivider} />
              <button type="button" className={styles.menuItem} onClick={() => { closeMenu(false); onLogout(); }}>
                <Icon name="logout" size="md" className={styles.menuIcon} />Log out
              </button>
            </>
          )}
        </div>,
        document.body,
      )}
    </header>
  );
}
