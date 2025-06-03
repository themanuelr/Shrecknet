"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "dark",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    // On first mount, try to load theme from localStorage
    const stored = localStorage.getItem("theme");
    if (stored) setTheme(stored);
    // Optionally, check system preference
    else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) setTheme("dark");
    else setTheme("light");
  }, []);

  useEffect(() => {
    // Persist theme to localStorage
    localStorage.setItem("theme", theme);
    // Optionally, set a data-theme on the html element for CSS
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
