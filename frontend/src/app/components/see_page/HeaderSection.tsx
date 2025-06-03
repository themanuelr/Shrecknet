"use client";
import PageValueRenderer from "./PageValueRenderer";

export default function HeaderSection({ values , worldId, conceptid }) {
  if (!values.length) return null;

  return (
    <div className="w-full max-w-xs">
      
        {/* Card Title */}
        <div className="
          px-5 py-3
          font-bold text-[var(--primary)]
          text-xs tracking-widest uppercase
          bg-[var(--primary)]/[0.08]
          rounded-t-2xl
          border-b border-[var(--primary)]/[0.10]
        ">
          Details
        </div>
        <div className="flex flex-col gap-2 px-5 pt-2">


          {values.map(({ characteristic, value }, idx) => (
            <div key={characteristic.id} className="mb-2">
              <div className="text-xs font-semibold text-[var(--primary)] mb-1">
                {characteristic.name}
              </div>            
                <PageValueRenderer characteristic={characteristic} value={value}  worldId={worldId} conceptid={conceptid} />

              {/* Optional divider, but light */}
              {idx !== values.length - 1 && (
                <div className="h-[1px] bg-[var(--primary)]/10 my-2 w-full"></div>
              )}
            </div>
          ))}
          
        </div>

    </div>
  );
}
