// Features.tsx - supports hero theme, 2x2 grid for desktop hero, full responsive
"use client";
import FeatureCard from "./FeatureCard";
import { Globe, Users, Bot, Dice5 } from "lucide-react";

export default function Features({ className = "", forceGrid = false }) {
  const features = [
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Visit Worlds",
      desc: "Visit our ever-expanding rich RPG settings with pages, concepts and groups.",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Collaborate",
      desc: "Invite players and co-writers to shape our adventures together.",
    },
    {
      icon: <Bot className="w-8 h-8" />,
      title: "Talk to our Elders",
      desc: "Talk to our Agentic AI NPCs about the worlds, the game rules or anything you wish.",
    },
    {
      icon: <Dice5 className="w-8 h-8" />,
      title: "Virtual Table",
      desc: "Jump into your online table powered by Foundry with a single click.",
    },
  ];
  return (
    <div
      className={`
        grid gap-6
        ${forceGrid ? "grid-cols-2 grid-rows-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}
        w-full max-w-4xl mt-0 md:mt-6
        ${className}
      `}
    >
      {features.map((f) => (
        <FeatureCard
          key={f.title}
          icon={f.icon}
          title={f.title}
        >
          {f.desc}
        </FeatureCard>
      ))}
    </div>
  );
}
