"use client";
import { FaComments } from "react-icons/fa";
import { useState } from "react";

export default function ChatPanel({ open, onOpen, onClose }) {
  const PANEL_WIDTH = 420; // px, can use % if preferred
  const BAR_WIDTH = 54; // px
  const BAR_HEIGHT = 200; // px

  // For hover effect
  const [btnHover, setBtnHover] = useState(false);

  // Mobile: Floating FAB
  const mobileOpenButton = !open ? (
    <button
      className="fixed bottom-8 right-8 z-50 md:hidden bg-purple-700 text-white p-4 rounded-full shadow-lg"
      onClick={onOpen}
    >
      <FaComments size={24} />
    </button>
  ) : null;

  // --- DESKTOP: Sticky sliding container ---
  return (
    <>
      {/* Mobile only */}
      {mobileOpenButton}

      {/* Desktop: sticky bar and panel in a sliding container */}
      <div
        className="hidden md:flex fixed top-0 right-0 h-screen z-50"
        style={{
          width: `${BAR_WIDTH + PANEL_WIDTH}px`,
          pointerEvents: "none", // so only bar/panel are interactive
          // Slide container left when open, keep it off-screen when closed
          transform: open
            ? "translateX(0)"
            : `translateX(${BAR_WIDTH + PANEL_WIDTH - BAR_WIDTH}px)`, // keep only bar visible when closed
          transition: "transform 0.4s cubic-bezier(.55,.1,.45,.9)",
        }}
      >
        {/* --- Toggle Bar (always visible, "sticks" to panel) --- */}
        <div
          style={{
            width: `${BAR_WIDTH}px`,
            height: `${BAR_HEIGHT}px`,
            position: "relative",
            top: "calc(50vh - 100px)",
            left: 0,
            background:
              "linear-gradient(120deg,rgba(255,255,255,0.97) 80%,rgba(170,140,255,0.16) 100%)",
            borderRadius: "1.4rem 0 0 1.4rem",
            border: "2px solid #e0d7f9",
            boxShadow: "0 2px 18px 0 rgba(180,120,255,0.10)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            userSelect: "none",
            zIndex: 2,
            pointerEvents: "auto",
            transition: "background 0.2s, box-shadow 0.2s",
          }}
          className="group hover:shadow-xl hover:bg-white/95 transition-all"
          onClick={open ? onClose : onOpen}
          tabIndex={0}
          title={open ? "Close chat" : "Call the chat!"}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
          onFocus={() => setBtnHover(true)}
          onBlur={() => setBtnHover(false)}
        >
          <FaComments
            className="text-purple-600 text-2xl mb-3 group-hover:scale-110 transition-transform"
          />
          <span
            className="font-semibold text-xs text-purple-800 tracking-wider"
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              letterSpacing: "0.13em",
              userSelect: "none",
              marginTop: "2px",
            }}
          >
            Call the chat!
          </span>
          <span
            style={{
              display: "block",
              position: "absolute",
              width: "56px",
              height: "56px",
              left: "-8px",
              top: "calc(50% - 28px)",
              pointerEvents: "none",
              opacity: btnHover ? 1 : 0,
              background:
                "radial-gradient(circle,rgba(180,120,255,0.19) 0,rgba(160,110,240,0.13) 60%,transparent 100%)",
              filter: "blur(1.5px)",
              transition: "opacity 0.22s cubic-bezier(.55,.1,.45,.85)",
              borderRadius: "50%",
              zIndex: 1,
            }}
          />
        </div>

        {/* --- Chat Panel --- */}
        <div
          style={{
            width: `${PANEL_WIDTH}px`,
            height: "100vh",
            background:
              "linear-gradient(120deg,rgba(255,255,255,0.96) 80%,rgba(225,195,255,0.24) 100%)",
            backdropFilter: "blur(10px)",
            boxShadow: "-4px 0 28px 0 rgba(100,80,140,0.13)",
            display: "flex",
            flexDirection: "column",
            borderLeft: "2px solid #e0d7f9",
            pointerEvents: open ? "auto" : "none",
            zIndex: 1,
            transition: "box-shadow 0.2s",
          }}
        >
          {!open ? null : (
            <div className="flex-1 flex flex-col p-4 pt-8 overflow-y-auto">
              <div className="bg-purple-50/60 rounded-xl p-6 text-purple-600 shadow text-center my-12">
                Chat with your world builder assistant will be available here soon!
              </div>
              {/* Place your chat UI/components here */}
            </div>
          )}
        </div>
      </div>

      {/* On mobile: full-screen overlay when open */}
      <div
        className={`fixed right-0 top-0 h-full w-full z-50 flex flex-col md:hidden transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background:
            "linear-gradient(120deg,rgba(255,255,255,0.97) 80%,rgba(170,140,255,0.16) 100%)",
          backdropFilter: "blur(8px)",
          boxShadow: "-4px 0 28px 0 rgba(100,80,140,0.11)",
        }}
      >
        {open && (
          <div className="flex items-center justify-between p-4 border-b border-purple-100">
            <span className="text-lg font-bold text-purple-900">Chat Assistant</span>
            <button
              onClick={onClose}
              className="text-purple-500 hover:bg-purple-100 p-2 rounded-full transition"
              title="Close chat"
            >
              ✕
            </button>
          </div>
        )}
        {open && (
          <div className="flex-1 flex flex-col p-4 pt-8 overflow-y-auto">
            <div className="bg-purple-50/60 rounded-xl p-6 text-purple-600 shadow text-center my-12">
              Chat with your world builder assistant will be available here soon!
            </div>
          </div>
        )}
      </div>
    </>
  );
}
