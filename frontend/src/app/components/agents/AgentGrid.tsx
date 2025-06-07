import Image from "next/image";

export default function AgentGrid({ agents, onEdit, onDelete, onRebuild }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {agents.map(agent => (
        <div
          key={agent.id}
          className="relative bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] shadow-xl flex flex-col items-center p-6"
        >
          <Image
            src={agent.logo || "/images/default/avatars/logo.png"}
            alt={agent.name}
            width={400}
            height={400}
            className="w-20 h-20 rounded-full object-cover mb-3"
          />
          <div className="text-lg font-bold text-[var(--primary)] mb-1 truncate w-full text-center">
            {agent.name}
          </div>
          <div className="text-xs text-[var(--foreground)]/70 mb-2">
            World ID: {agent.world_id}
          </div>
          <div className="flex gap-2 mt-1">
            <button
              className="px-3 py-1 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm shadow"
              onClick={() => onEdit(agent)}
            >
              Edit
            </button>
            <button
              className="px-3 py-1 rounded-lg bg-red-600 text-white text-sm shadow"
              onClick={() => onDelete(agent)}
            >
              Delete
            </button>
          </div>
          <button
            className="mt-3 px-4 py-1 rounded-lg border border-[var(--primary)] text-[var(--primary)] text-sm hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] transition"
            onClick={() => onRebuild(agent)}
          >
            Update Vector DB
          </button>
        </div>
      ))}
    </div>
  );
}
