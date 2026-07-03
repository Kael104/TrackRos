export interface NavLink {
  href: string;
  label: string;
}

export const navLinks: NavLink[] = [
  { href: "/", label: "Dashboard" },
  { href: "/log", label: "Log" },
  { href: "/meal-builder", label: "Meal Builder" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];
