"use client";

import Image from "next/image";
import { useState } from "react";
import ModalContainer from "../template/modalContainer";
import SettingsDisplay from "./SettingsDisplay"; // Update the path if needed

export default function PageTitleBar({
  pageName,
  logo,
  settings, // { allowCrosslinks, ignoreCrosslink, allowCrossworld, onEdit, canEdit }
}) {
  const [zoomOpen, setZoomOpen] = useState(false);

  return (
    <div className="flex items-start gap-4 md:gap-7 w-full mb-2">
      {/* --- Logo with modal zoom --- */}
      {logo && (
        <>
          <button
            type="button"
            aria-label="Zoom page logo"
            onClick={() => setZoomOpen(true)}
            className="
              border border-[var(--primary)] shadow-md
              rounded-3xl p-0 m-0 focus:outline-none transition
              hover:scale-105 active:scale-100
              bg-white
            "
            style={{
              boxShadow: "0 2px 24px 0 rgba(123,47,242,0.10)"
            }}
          >
            <Image
              src={logo}
              alt="Page Logo"
              width={400}
              height={400}
              className="object-cover rounded-3xl"
              style={{
                width: 120,
                height: 120,
                minWidth: 64,
                minHeight: 64,
                background: "white"
              }}
              priority
            />
          </button>
          {zoomOpen && (
            <ModalContainer
              title={pageName}
              onClose={() => setZoomOpen(false)}
              className="max-w-2xl"
            >
              <Image
                src={logo}
                alt={pageName}
                className="w-full h-auto max-h-[70vh] rounded-3xl border-4 border-[var(--primary)] object-contain mx-auto shadow-2xl"
                width={400}
                height={400}
              />
            </ModalContainer>
          )}
        </>
      )}

      {/* --- Title & Settings block --- */}
      <div className="flex-1 flex flex-col min-w-0">
        <h1
          className="
            text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight
            text-[var(--primary)] drop-shadow-md
            mb-1
            truncate
          "
          style={{
            fontVariationSettings: "'wght' 650, 'wdth' 110",
            lineHeight: 1.1,
            letterSpacing: "-0.02em"
          }}
        >
          {pageName}
        </h1>
        {/* --- SettingsDisplay below title --- */}
        <div className="w-full">
          <SettingsDisplay
            allowCrosslinks={settings.allowCrosslinks}
            ignoreCrosslink={settings.ignoreCrosslink}
            allowCrossworld={settings.allowCrossworld}
            canEdit={settings.canEdit}
            onEdit={settings.onEdit}
          />
        </div>
      </div>
    </div>
  );
}
