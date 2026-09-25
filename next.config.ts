import type { NextConfig } from "next";

// Catalog pages renamed in A3 (BP names). Old links keep working: each old slug sends you to the new page.
const RENAMED_COMPONENTS: Record<string, string> = {
  alert: "callout",
  empty: "emptystate",
  progress: "meter",
  progresslegacy: "progressbar",
  buttonfilter: "filterbutton",
  segmentedcontrol: "segmented",
  stepper: "steps",
  dropdownmenu: "dropdown",
  shimmertext: "textloader",
  command: "globalsearch",
  tile: "navtile",
  sidenav: "appnav",
};

const nextConfig: NextConfig = {
  redirects() {
    return Object.entries(RENAMED_COMPONENTS).map(([from, to]) => ({
      source: `/components/${from}`,
      destination: `/components/${to}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
