// M3FloatingInput.tsx
export function M3FloatingInput({ label, ...props }) {
    return (
      <div className="relative my-2 w-full">
        <input
          {...props}
          className="peer w-full px-4 pt-6 pb-2 text-[var(--foreground)] bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)] transition-colors placeholder-transparent"
          placeholder=" "
        />
        <label
          className="absolute left-3 top-1.5 text-base text-[var(--primary)] font-semibold
            transition-all duration-200 pointer-events-none
            peer-placeholder-shown:top-4 peer-placeholder-shown:left-4 peer-placeholder-shown:text-lg peer-placeholder-shown:text-[var(--border)]
            peer-focus:top-1.5 peer-focus:left-3 peer-focus:text-base peer-focus:text-[var(--primary)]"
        >
          {label}
        </label>
      </div>
    );
  }
  