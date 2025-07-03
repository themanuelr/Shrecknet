import { useEffect, useState } from "react";
import { Download, FileJson, FileText } from "lucide-react";
import { getPage } from "@/app/lib/pagesAPI";
import { useAuth } from "../auth/AuthProvider";
import Image from "next/image";
export default function PageValueRenderer({
  characteristic,
  value,
  worldId,
  conceptid,
  variant = "default",
}) {
  const { token } = useAuth();

  const isList = Array.isArray(value);
  const values = isList ? value : value ? [value] : [];

  // --- PAGE REF: Fetch page details ---
  const [pageDetails, setPageDetails] = useState({});
  const [loadingPages, setLoadingPages] = useState(false);

  useEffect(() => {
    if (characteristic.type === "page_ref" && values.length && token) {
      setLoadingPages(true);
      const fetchDetails = async () => {
        const details = {};
        await Promise.all(
          values.map(async (id) => {
            try {
              const page = await getPage(Number(id), token);
              details[id] = { name: page.name, logo: page.logo };
            } catch {
              details[id] = { name: `Page #${id}` };
            }
          })
        );
        setPageDetails(details);
        setLoadingPages(false);
      };
      fetchDetails();
    }
    // eslint-disable-next-line
  }, [characteristic.type, JSON.stringify(values), token]);

  if (!values.length) {
    return (
      <span className="italic text-sm text-[var(--foreground)]/70">No data</span>
    );
  }

  // --- Helper for file download links ---
  const renderDownloadLink = (val, idx, type, label = null) => {
    const isPdf = type === "pdf";
    const isJson = type === "foundry";


    return (
      <a
        key={idx}
        href={val}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="
          group flex items-center gap-2
          px-4 py-3 rounded-xl transition
          border border-transparent
          hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/30
          w-full text-[var(--primary)] font-semibold text-base
        "
        style={{
          background: "none",
          minHeight: 50,
        }}
      >
        {isPdf ? (
          <FileText className="w-6 h-6" />
        ) : isJson ? (
          <FileJson className="w-6 h-6" />
        ) : (
          <Download className="w-6 h-6" />
        )}
        <span>
          {label ||
            (isPdf
              ? "Download PDF"
              : isJson
              ? "Download Sheet"
              : "Download file")}
        </span>
      </a>
    );
  };

  return (
        <div
          className={
            isList && values.length > 1
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full"
              : "flex w-full"
          }
          style={{
            justifyContent:
              (!isList || values.length === 1) ? "flex-end" : undefined,
            alignItems: "center",
          }}
        >
          {values.map((val, idx) => {
            // IMAGE
            if (characteristic.type === "image" || characteristic.type === "img") {
              return (
                <div key={idx} className="flex w-full justify-end">
                  <Image
                    src={val}
                    alt={characteristic.name}
                    className="w-full max-w-xs rounded-xl border border-[var(--border)] shadow-md object-cover"
                    width={400}
                    height={400}
                  />
                </div>
              );
            }

        // PDF
        if (characteristic.type === "pdf") {
          return renderDownloadLink(
            val,
            idx,
            "pdf",
            isList ? `PDF #${idx + 1}` : characteristic.name || "Download PDF"
          );
        }

        // FOUNDRY JSON
        if (characteristic.type === "foundry") {
          return renderDownloadLink(
            val,
            idx,
            "foundry",
            isList ? `Sheet #${idx + 1}` : characteristic.name || "Download Sheet"
          );
        }

        // VIDEO
        if (characteristic.type === "video" && typeof val === "string") {
          // Try to parse YouTube links
          let embedUrl = null;
          const ytMatch = val.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11,})/);
          if (ytMatch) {
            embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
          }
          // Could add support for Vimeo, etc. here
          return embedUrl ? (
            <iframe
              key={idx}
              src={embedUrl}
              className="w-full max-w-lg aspect-video rounded-xl border border-[var(--border)]"
              allowFullScreen
            />
          ) : (
            <span className="text-red-400">Invalid video link</span>
          );
        }

        // AUDIO
        if (characteristic.type === "audio" && typeof val === "string" && val.includes("spotify.com")) {
          // Extract type and ID from the URL
          let embedUrl = null;
          const match = val.match(/spotify\.com\/(track|album|episode|playlist)\/([a-zA-Z0-9]+)/);
          if (match) {
            embedUrl = `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
          }
          return embedUrl ? (
            <iframe
              key={idx}
              src={embedUrl}
              width="100%"
              height="152"
              frameBorder="0"
              allow="encrypted-media"
              allowFullScreen={false}
              className="rounded-xl border border-[var(--primary)]"
            ></iframe>
          ) : (
            <span className="text-red-400">Invalid Spotify link</span>
          );
        }

        // LINK
        if (characteristic.type === "link") {
          return (
            <a
              key={idx}
              href={val}
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-flex items-center gap-2 w-full
                rounded-xl px-3 py-2 text-[var(--primary)] font-semibold
                border border-transparent
                transition
                hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/30
              "
            >
              <Download className="w-5 h-5 opacity-60" />
              {val}
            </a>
          );
        }

        // DATE
        if (characteristic.type === "date") {
          const date = new Date(val);
          return (
            <span
              key={idx}
              className="inline-block rounded-xl px-3 py-1 text-[var(--primary)]"
            >
              {isNaN(date.getTime()) ? val : date.toLocaleDateString()}
            </span>
          );
        }

        // PAGE REF (with logo/name/link)
        if (characteristic.type === "page_ref") {
          const page = pageDetails[val] || {};
          const isMini = variant === "mini";
          return (
            <a
              key={idx}
              href={
                worldId && conceptid && val
                  ? `/worlds/${worldId}/concept/${conceptid}/page/${val}`
                  : "#"
              }
              className={`
                flex items-center gap-${isMini ? 2 : 4} w-full
                rounded-lg border border-[var(--border)] bg-[var(--surface)]
                px-${isMini ? 2 : 3} py-${isMini ? 2 : 3}
                shadow-sm transition hover:bg-[var(--surface-variant)]
                ${isMini ? "text-xs" : ""}
              `}
              style={{ textDecoration: "none" }}
            >
              {loadingPages ? (
                <span className="italic text-xs text-[var(--primary)]/70">
                  Loading...
                </span>
              ) : (
                <>
                  {page.logo && (
                    <Image
                      src={page.logo}
                      alt={page.name}
                      className={`object-cover bg-white ${isMini ? "w-6 h-6 rounded-md" : "w-10 h-10 rounded-lg"}`}
                      width={400}
                      height={400}
                      style={isMini ? { minWidth: 24, minHeight: 24 } : { minWidth: 40, minHeight: 40 }}
                    />
                  )}
                  <span className={`text-[var(--primary)] font-semibold truncate`}>
                    {page.name || `Page #${val}`}
                  </span>
                </>
              )}
            </a>
          );
        }

        // DEFAULT: plain value
        return (
          <div
            key={idx}
            className={`
              whitespace-pre-line text-[var(--foreground)] w-full
              text-left
            `}
            style={{
              background: "none",
              padding: 0,
              border: "none",
              borderRadius: 0,
              boxShadow: "none",
              fontSize: "1rem",
              lineHeight: "1.7",
            }}
          >
            {val}
          </div>
        );
      })}
    </div>
  );
}
