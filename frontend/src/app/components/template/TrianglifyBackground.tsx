// components/TrianglifyBackground.tsx
"use client";
import { useEffect, useRef } from "react";
import trianglify from "trianglify";

const lightColors = ['#f6f1fc', '#e0c3fc', '#cbb9fa', '#9156f1', '#7b2ff2'];
const darkColors = ['#291966', '#372653', '#7b2ff2', '#9156f1', '#442813'];

export default function TrianglifyBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect theme (light/dark)
    const getTheme = () =>
      (document.documentElement.getAttribute("data-theme") || "light") as "dark" | "light";

    const renderPattern = () => {
      const theme = getTheme();
      const colors = theme === "dark" ? darkColors : lightColors;
      const pattern = trianglify({
        width: window.innerWidth,
        height: window.innerHeight,
        cellSize: 80,
        variance: 0.7,
        xColors: colors,
        yColors: "match",
        strokeWidth: 1,
      });

      if (ref.current) {
        ref.current.innerHTML = "";
        ref.current.appendChild(pattern.toCanvas());
      }
    };

    renderPattern();

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      renderPattern();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    // Redraw on resize
    window.addEventListener("resize", renderPattern);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", renderPattern);
    };
  }, []);

  // Absolutely fill the background, under all content
  return (
    <div
      ref={ref}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ width: "100vw", height: "100vh", top: 0, left: 0 }}
    />
  );
}