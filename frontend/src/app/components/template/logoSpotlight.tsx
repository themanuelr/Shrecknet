import Image from "next/image";

export default function LogoSpotlight() {
  return (
    <div className="relative flex flex-col items-center w-full z-20">
      {/* Radial gradient background */}
      <div
        className="absolute"
        style={{
        //   width: "100%",
        //   height: 280, // adjust as needed
          left: 0,
          top: 0,
          zIndex: 1,
          pointerEvents: "none",
        //   background: `radial-gradient(circle at 50% 38%, rgba(55, 22, 90, 0.97) 0%, rgba(55, 22, 90, 0.84) 40%, rgba(55, 22, 90, 0.3) 85%, rgba(55, 22, 90, 0.10) 100%)`,
        //   filter: "blur(1px)",
        }}
      />
      {/* Logo (fills width, little/no top margin) */}
      <div className="relative flex flex-col items-center z-10 w-full">
        <Image
          src="/images/logo.svg" // adjust as needed
          alt="Shrecknet logo"
          width={720}
          height={720}
          className="w-full max-w-[420px] h-auto mb-0 mt-[-18px] drop-shadow-xl"
          priority
        />
        {/* Dramatic tagline */}
        <div
          className="mt-2 mb-12 text-center"
          style={{
            fontFamily: "'Great Vibes', 'Cinzel', cursive, serif",
            fontSize: "2rem",
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
      </div>
    </div>
  );
}
