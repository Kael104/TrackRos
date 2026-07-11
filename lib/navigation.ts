export interface NavLink {
  href: string;
  label: string;
}

export const dashboardHref = "/";

export const navLinks: NavLink[] = [
  { href: dashboardHref, label: "Dashboard" },
  { href: "/meal-builder", label: "Meal Builder" },
  { href: "/food-data", label: "Food Data" },
  { href: "/calendar", label: "Calendar" },
  { href: "/settings", label: "Settings" },
];
