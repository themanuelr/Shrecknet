"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../auth/AuthProvider";
import UserModal from "../user_management/User_Modal";
import Image from "next/image";
import Link from "next/link";

// Material Symbols
import PublicIcon from "@mui/icons-material/Public";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import CasinoRoundedIcon from "@mui/icons-material/CasinoRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import PersonEditAlt1RoundedIcon from "@mui/icons-material/EditRounded";
import { Bot, BookOpenText, PenLine, Sparkles } from "lucide-react";

export default function Sidebar({ mobileOpen = false, setMobileOpen = () => {} }) {
  const { user, token, isLoading: authLoading, refreshUser } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  const pathname = usePathname();

  async function handleProfileSave() {
    if (typeof refreshUser === "function") await refreshUser();
    setProfileModalOpen(false);
    setProfileSuccess("Profile updated with success!");
    setTimeout(() => setProfileSuccess(""), 2000);
  }
  function handleProfileError(msg) {
    setProfileError(msg);
    setTimeout(() => setProfileError(""), 2000);
  }

  // Menu Items
  const menu = [
    {
      label: "Virtual Table",
      icon: <CasinoRoundedIcon fontSize="medium" />,
      href: "https://foundry.shrecknet.club",
      external: true,
      show: true,
    },
    {
      label: "Worlds",
      icon: <PublicIcon fontSize="medium" />,
      href: "/worlds",
      external: false,
      show: true,
    },
    {
      label: "Talk to your Elders",
      icon: <GroupRoundedIcon fontSize="medium" />,
      href: "/elders",
      external: false,
      show: true,
    },
    {
      label: "AI Writer",
      icon: <Bot fontSize="medium" />,
      href: "/agent_writer",
      external: false,
      show: user && ["writer", "system admin"].includes(user.role),
    },
    {
      label: "AI Novelist",
      icon: <PenLine fontSize="medium" />,
      href: "/ai_novelist",
      external: false,
      show: user && ["writer", "system admin"].includes(user.role),
    },
    {
      label: "AI Specialist",
      icon: <Sparkles fontSize="medium" />,
      href: "/ai_specialist",
      external: false,
      show: true,
    },
    {
      label: "All Pages",
      icon: <BookOpenText fontSize="medium" />,
      href: "/all_pages",
      external: false,
      show: user && ["writer", "system admin"].includes(user.role),
    },
    {
      label: "World Builder",
      icon: <BuildRoundedIcon fontSize="medium" />,
      href: "/world_builder",
      external: false,
      show: user && ["world builder", "system admin"].includes(user.role),
    },
 
    
    {
      label: "System Settings",
      icon: <GroupRoundedIcon fontSize="medium" />,
      href: "/system_settings",
      external: false,
      show: user && user.role === "system admin",
    },    
  ];

  // Don't render if not logged in
  if (authLoading || !token) return null;

  // Utility: checks if this route is active
  function isActive(href) {
    return !href.startsWith("http") && pathname.startsWith(href);
  }

  // Sidebar content
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen w-64
          flex flex-col items-stretch
          bg-[var(--sidebar-bg)]
          border-r border-[var(--border)]
          shadow-md
          overflow-y-auto
          transition-all
          md:block ${mobileOpen ? "block" : "hidden"}
        `}
        style={{ minWidth: 120, maxWidth: 220 }}
      >
        {/* Logo only, fills width, with shadow/contrast */}
        <div className="flex items-center justify-center h-24 bg-transparent p-3 border-b border-[var(--border)]">
          
            <Image
              src="/images/logo_dark.png"
              alt="Shrecknet logo"
              width={400}
              height={400}
              className="w-full h-auto max-w-[300px] object-contain drop-shadow-lg"
              priority
            />
          
        </div>

        {/* Menu Items */}
        <nav className="flex-1 flex flex-col gap-1 py-6">
          {menu.filter((m) => m.show).map((m) => (
            m.external ? (
              <a
                key={m.label}
                href={m.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  flex items-center gap-3 px-5 py-3
                  rounded-md font-semibold
                  text-base text-[var(--foreground)]
                  hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]
                  transition
                  border-r-4 border-transparent
                `}
                style={{ outline: "none" }}
              >
                <span className="text-2xl">{m.icon}</span>
                <span>{m.label}</span>
              </a>
            ) : (
              <Link
                key={m.label}
                href={m.href}
                className={`
                  flex items-center gap-3 px-5 py-3
                  rounded-md font-semibold
                  text-base text-[var(--foreground)]
                  hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]
                  transition
                  border-r-4 ${
                    isActive(m.href)
                      ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "border-transparent"
                  }
                `}
                style={{ outline: "none" }}
              >
                <span className="text-2xl">{m.icon}</span>
                <span>{m.label}</span>
              </Link>
            )
          ))}
        </nav>

        {/* User Info at the bottom */}
        <div className="flex flex-col items-center gap-2 pb-6 pt-4 border-t border-[var(--border)] mt-auto w-full">
          <div className="bg-[var(--surface)] rounded-2xl p-1 shadow w-40 h-40 flex items-center justify-center">
            <Image
              src={user?.image_url || "/images/avatars/default.png"}
              alt="avatar"
              width={400}
              height={400}
              className="object-cover w-38 h-38 rounded-2xl border-2 border-[var(--primary)]"
            />
          </div>
          <div className="font-bold text-[var(--primary)] text-lg capitalize flex items-center gap-2">
            {user?.nickname || "Hi!"}
            <button
              className="ml-1 p-1 text-[var(--primary)]/80 hover:text-[var(--primary)] transition"
              title="Personalize"
              onClick={() => setProfileModalOpen(true)}
            >
              <PersonEditAlt1RoundedIcon style={{ fontSize: 20 }} />
            </button>
          </div>
          {profileSuccess && (
            <div className="w-full text-center bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
              {profileSuccess}
            </div>
          )}
          {profileError && (
            <div className="w-full text-center bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
              {profileError}
            </div>
          )}
        </div>
        {/* Profile Modal */}
        {profileModalOpen && user && (
          <UserModal
            user={user}
            onClose={() => setProfileModalOpen(false)}
            onSave={handleProfileSave}
            onDelete={null}
            isProfile={true}
            setError={handleProfileError}
          />
        )}
      </aside>
    </>
  );
}
