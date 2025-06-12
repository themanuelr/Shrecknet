"use client";
import { useAuth } from "./components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import AuthCard from "./components/auth/AuthCard";
import Starfield from "./components/template/Starfield";
import Features from "./components/landing/Features";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/worlds");
    }
  }, [loading, user, router]);

  if (loading) {
    return <div className="w-full text-center py-10 text-primary">Loading...</div>;
  }
  if (user) return null;

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">
      
      <Image
        src="/images/background.png"  // use the correct static or public path
        alt="Galaxy background"
        fill
        priority
        className="object-cover object-center z-0 pointer-events-none"
        style={{
          filter: "brightness(0.9) blur(1.5px)", // adjust for darkening or softening
        }}
      />
      {/* <div className="absolute inset-0 bg-gradient-to-br from-[#291966cc] via-[#7b2ff299] to-[#222222bb] z-0 pointer-events-none" /> */}

      {/* Sparkling stars! */}
      <Starfield numStars={300} />
      
      {/* Login Card */}
      <section
  className="
    relative z-10 flex flex-col items-center 
    w-full max-w-md 
    px-0 sm:px-8 pb-10
    rounded-[2rem] 
    bg-[var(--card-bg)]/20 
    shadow-2xl border border-white/20 
    backdrop-blur-[20px] 
    animate-fadeIn
  "
  style={{
    background: `radial-gradient(circle at 50% 35%, rgba(55, 22, 90, 0.10) 0%, rgba(55, 22, 90, 0.85) 40%, rgba(55, 22, 90, 0.5) 70%, rgba(55, 22, 90, 0.01) 100%)`,
  }}
>
    
      {/* Logo and Tagline */}
      <Image
        src="/images/logo.svg"
        alt="Shrecknet logo"
        width={720}
        height={720}
        className="w-full max-w-full h-full mb-0 mt-4 drop-shadow-xl"
        priority
      />
              {/* Dramatic tagline */}
              <div
  className="mt-4 mb-8 text-center"
  style={{
    fontFamily: "'Great Vibes', 'Cinzel', cursive, serif",
    fontSize: "1.7rem",
    fontWeight: 700,
    color: "transparent",
    background: "linear-gradient(90deg,#e0c3fc 25%,#7b2ff2 70%)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow: "0 1.5px 6px #36205a66, 0 2px 16px #cbb9fa33",
    letterSpacing: ".03em",
  }}
>
                You Build, We Forge!
              </div>
      <div className="relative z-10 w-full flex flex-col items-center">

      <AuthCard />
      </div>
      {/* Auth Form */}

</section>

      {/* Feature cards */}
      <section className="relative z-10 w-full flex justify-center px-4 mt-6">
        <Features />
      </section>
    </main>
  );
}
