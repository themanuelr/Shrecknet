"use client";

import PageValueRenderer from "./PageValueRenderer";

export default function TitleSection({ values, worldId }) {
  if (!values.length) return null;

  return (
    <section className="w-full mb-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {values.map(({ characteristic, value }) => (
          <div key={characteristic.id} className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[var(--primary)] tracking-wide">
              {characteristic.name}
            </span>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 shadow-sm text-sm">
              <PageValueRenderer
                characteristic={characteristic}
                value={value}
                variant="mini"
                worldId={worldId}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
