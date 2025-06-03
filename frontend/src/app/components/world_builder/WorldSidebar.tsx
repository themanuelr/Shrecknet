"use client";
import Link from "next/link";
import Image from "next/image";
export default function WorldsSidebar({ worlds, currentId }) {
  
  return (
    <nav className="flex flex-col gap-2 items-center w-full">
      {worlds.map((w) => {
        const selected = String(w.id) === String(currentId);
        return (
          <Link
            key={w.id}
            href={`/world_builder/${w.id}`}
            className={`
              group flex flex-col items-center justify-center w-[100px] h-[80px]
              rounded-xl border-2
              ${selected
                ? "border-[var(--primary)] bg-[var(--primary)]/15 shadow-lg"
                : "border-transparent hover:bg-[var(--primary)]/10"}
              transition
            `}
            style={{
              boxShadow: selected ? "0 2px 14px 0 var(--primary)" : undefined,
            }}
            aria-current={selected ? "page" : undefined}
            title={w.name}
          >
            <Image
              src={w.logo || "/images/worlds/new_game.png"}
              alt={w.name}
              width={400}
              height={400}
              className={`w-12 h-12 rounded-full mb-1 border ${selected ? "border-[var(--primary)]" : "border-[var(--primary)]/20"} object-cover`}
              draggable={false}
            />
            <span
              className={`text-[10px] text-center truncate w-full px-1 font-bold ${selected ? "text-[var(--primary)]" : "text-[var(--primary)]/60"}`}
              style={{
                fontWeight: selected ? 700 : 500,
                letterSpacing: ".02em",
              }}
            >
              {w.name.length > 15 ? w.name.slice(0, 15) + "…" : w.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
