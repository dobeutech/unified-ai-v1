"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shadow-border-small bg-background/80 backdrop-blur-sm border-0"
        aria-label="Theme"
        disabled
      >
        <Sun className="h-4 w-4" aria-hidden />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";
  const next = isDark ? "light" : "dark";
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => setTheme(next)}
      className="h-9 w-9 shadow-border-small hover:shadow-border-medium bg-background/80 backdrop-blur-sm border-0 hover:bg-background hover:scale-[1.02] transition-all duration-150 ease"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
    >
      {isDark ? (
        <Sun className="h-4 w-4" aria-hidden />
      ) : (
        <Moon className="h-4 w-4" aria-hidden />
      )}
    </Button>
  );
}