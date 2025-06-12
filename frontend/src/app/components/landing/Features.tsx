"use client";
import FeatureCard from "./FeatureCard";
import { Globe, Users, Bot, Dice5 } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Forge Worlds",
      desc: "Build and expand rich RPG settings with pages, concepts and groups.",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Collaborate",
      desc: "Invite players and co-writers to shape your adventures together.",
    },
    {
      icon: <Bot className="w-8 h-8" />,
      title: "NPC Agents",
      desc: "Create AI-powered agents to help narrate and manage lore.",
    },
    {
      icon: <Dice5 className="w-8 h-8" />,
      title: "Virtual Table",
      desc: "Jump into your online table powered by Foundry with a single click.",
    },
  ];
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full max-w-4xl mt-10">
      {features.map((f) => (
        <FeatureCard key={f.title} icon={f.icon} title={f.title}>
          {f.desc}
        </FeatureCard>
      ))}
    </div>
  );
}
