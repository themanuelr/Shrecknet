"use client";
import { useTheme } from "../../hooks/useThemes";
import { Sun, Moon } from "lucide-react"; // Use your favorite icons!

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/40 transition z-20"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="text-yellow-300" /> : <Moon className="text-purple-700" />}
    </button>
  );
}