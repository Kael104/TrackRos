export interface NavLink {
  href: string;
  label: string;
}

export const navLinks: NavLink[] = [
  { href: "/", label: "Dashboard" },
  { href: "/log", label: "Log" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];
