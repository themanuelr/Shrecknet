import { FaTimes } from "react-icons/fa";
import { useEffect } from "react";

export default function ModalContainer({ children, title, onClose, className = "" }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn px-2 py-6">
      <div
        className={`relative bg-[var(--card-bg)] border border-[var(--border)] shadow-2xl rounded-3xl w-full max-w-lg mx-auto flex flex-col max-h-[90vh] ${className}`}
        style={{
          // fallback for iOS, in case you want maxHeight
          maxHeight: "90vh"
        }}
      >
        {/* Sticky close button */}
        <button
          className="absolute top-5 right-6 text-[var(--primary)] hover:text-[var(--accent)] text-2xl focus:outline-none transition z-10"
          onClick={onClose}
          aria-label="Close"
        >
          <FaTimes />
        </button>
        {title && (
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--primary)] mb-1 mt-8 text-center tracking-tight drop-shadow-sm">
            {title}
          </h2>
        )}
        {/* SCROLLABLE content */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
