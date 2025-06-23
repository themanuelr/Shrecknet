// Features.tsx - supports hero theme, 2x2 grid for desktop hero, full responsive
"use client";
import FeatureCard from "./FeatureCard";
import { Globe, Users, Bot, Dice5 } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

export default function Features({ className = "", forceGrid = false }) {
  const { t } = useTranslation();
  const features = [
    {
      icon: <Globe className="w-8 h-8" />,
      title: t("visit_worlds"),
      desc: t("visit_worlds_desc"),
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: t("collaborate"),
      desc: t("collaborate_desc"),
    },
    {
      icon: <Bot className="w-8 h-8" />,
      title: t("talk_elders"),
      desc: t("talk_elders_desc"),
    },
    {
      icon: <Dice5 className="w-8 h-8" />,
      title: t("virtual_table"),
      desc: t("virtual_table_desc"),
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
