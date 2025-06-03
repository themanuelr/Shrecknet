"use client";
import DashboardWorlds from "../components/worlds/DashboardWorlds";
import DashboardLayout from "../components/DashboardLayout";

export default function WorldsPage() {  

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 py-10">
        {/* Splash/Hero */}
        <div className="flex flex-col items-center mb-8">
          <span className="text-5xl md:text-6xl mb-2 drop-shadow-sm">🌍</span>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[var(--primary)] text-center mb-2 tracking-tight">
            Explore Worlds
          </h1>
          <p className="text-base md:text-lg text-[var(--foreground)]/70 text-center max-w-2xl">
            Worlds are unique RPG universes—create, explore, and manage them all from here.
          </p>
        </div>

        {/* Action bar is handled INSIDE DashboardWorlds (no duplicate logic here) */}

        <DashboardWorlds />

        {/* No modals, no hidden buttons, no state here! */}
      </div>
    </DashboardLayout>
  );
}
