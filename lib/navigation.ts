export interface NavLink {
  href: string;
  label: string;
}

export const dashboardHref = "/";

export const navLinks: NavLink[] = [
  { href: dashboardHref, label: "Dashboard" },
  { href: "/meal-builder", label: "Meal Builder" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];
