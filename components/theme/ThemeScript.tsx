import { THEME_STORAGE_KEY } from "@/lib/theme";

export function ThemeScript() {
  const storageKeyLiteral = JSON.stringify(THEME_STORAGE_KEY);
  const script = `(function(){try{var k=${storageKeyLiteral};var s=localStorage.getItem(k);var t=s==="light"||s==="dark"?s:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}})()`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
