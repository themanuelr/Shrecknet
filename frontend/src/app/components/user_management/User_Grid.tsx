import Image from "next/image";
export default function UserGrid({ users, onUserClick }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-7">
      {users.map(u => (
        <button
          key={u.id}
          className={`
            group relative w-full bg-[var(--card-bg)]/90 rounded-2xl shadow-xl border border-[var(--primary)]/30
            flex flex-col items-center px-6 py-7
            cursor-pointer hover:shadow-2xl hover:border-[var(--accent)]/80
            hover:scale-[1.025] active:scale-100 transition
            outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]
          `}
          style={{ minHeight: 225 }}
          onClick={() => onUserClick(u)}
          tabIndex={0}
          aria-label={`Edit user ${u.nickname}`}
        >
          {/* User avatar */}
          <Image
            src={u.image_url || "/images/avatars/default.png"}
            className="w-20 h-20 rounded-full border-2 border-[var(--primary)] shadow-sm mb-3 object-cover bg-[var(--background)]"
            alt={u.nickname}
            draggable={false}
            loading="lazy"
            width={400}
            height={400}
          />
          {/* Name */}
          <div className="text-lg font-bold text-[var(--primary)] text-center truncate w-full">{u.nickname}</div>
          {/* Email */}
          <div className="text-xs text-[var(--foreground)]/60 text-center truncate w-full mb-2">{u.email}</div>
          {/* Role chip */}
          <span className="
            inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
            bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/50
            mb-1
          ">
            {u.role}
          </span>
          {/* User ID (visible but subtle) */}
          <div className="absolute top-2 left-4 text-[10px] text-[var(--foreground)]/30 select-none font-mono">
            ID: {u.id}
          </div>
        </button>
      ))}
    </div>
  );
}
