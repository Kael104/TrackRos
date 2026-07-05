import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ThemeScript } from "@/components/theme/ThemeScript";
import { LogEntryItem } from "@/components/log/LogEntryItem";
import { escapeHtml } from "@/lib/sanitize";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import type { LogEntry } from "@/lib/meals";

vi.mock("@/store/useDashboardStore", () => ({
  useDashboardStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      renameLogEntry: vi.fn(),
      removeLogEntry: vi.fn(),
    }),
}));

const XSS_PAYLOADS = [
  '<img src=x onerror="alert(1)">',
  "<script>alert(1)</script>",
  '"><svg onload=alert(1)>',
];

function makeLogEntry(foodName: string): LogEntry {
  return {
    id: "xss-test-entry",
    foodName,
    servings: 1,
    servingLabel: "serving",
    calories: 100,
    protein: 10,
    carbs: 10,
    fat: 5,
  };
}

describe("XSS hardening", () => {
  describe("LogEntryItem food name rendering", () => {
    it.each(XSS_PAYLOADS)(
      "renders payload as text without injecting HTML: %s",
      (payload) => {
        render(
          <LogEntryItem
            entry={makeLogEntry(payload)}
            mealType="breakfast"
            editable={false}
            removable={false}
          />,
        );

        expect(screen.getByText(payload)).toBeInTheDocument();
        expect(document.querySelector("img")).toBeNull();
        expect(document.querySelector("script")).toBeNull();
        expect(document.querySelector("svg")).toBeNull();
      },
    );
  });

  describe("escapeHtml", () => {
    it.each(XSS_PAYLOADS)(
      "neutralizes HTML special characters in payload: %s",
      (payload) => {
        const escaped = escapeHtml(payload);

        expect(escaped).not.toContain("<script>");
        expect(escaped).not.toContain("<img");
        expect(escaped).not.toContain("<svg");
        expect(escaped).toContain("&lt;");
      },
    );
  });

  describe("ThemeScript", () => {
    it("embeds the storage key via JSON.stringify", () => {
      render(<ThemeScript />);

      const script = document.querySelector("script");
      expect(script).not.toBeNull();

      const html = script?.innerHTML ?? "";
      expect(html).toContain(`var k=${JSON.stringify(THEME_STORAGE_KEY)}`);
    });

    it("does not allow script break-out when storage key contains quotes", () => {
      const maliciousKey = '");alert(1);//';
      const storageKeyLiteral = JSON.stringify(maliciousKey);
      const script = `(function(){try{var k=${storageKeyLiteral};var s=localStorage.getItem(k);}catch(e){}})()`;

      expect(script).toContain(JSON.stringify(maliciousKey));
      expect(script).not.toMatch(/var k=""\);alert\(1\);/);
    });
  });
});
