import Image from "next/image";
import { useConcepts } from "@/app/lib/useConcept";
import { useAuth } from "../auth/AuthProvider";
import { hasRole } from "@/app/lib/roles";
import { FaEdit, FaTrash } from "react-icons/fa";

export default function WorldCard({ world, linkURL, showEdit, onEdit, onDelete }) {
  const { user } = useAuth();
  const { concepts, isLoading } = useConcepts(world.id);

  const conceptCount = concepts.length;
  const pagesCount = concepts.reduce((sum, c) => sum + (c.pages_count || 0), 0);

  return (
    <div
      className="group relative w-[260px] sm:w-[320px] md:w-[360px] bg-[var(--card-bg)]/95 rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden hover:shadow-3xl hover:scale-105 hover:border-[var(--primary)]/60 transition-all duration-200"
      style={{ backdropFilter: "blur(5px) saturate(1.1)" }}
    >
      {showEdit && hasRole(user?.role, "world builder") && (
        <div className="absolute right-5 top-5 z-30 flex flex-col gap-3 items-center">
          <button
            className="p-3 bg-white/70 border border-[var(--primary)] rounded-xl shadow hover:bg-[var(--primary)]/20 hover:scale-110 transition"
            title="Edit"
            onClick={() => onEdit(world)}
          >
            <FaEdit className="text-[var(--primary)]" />
          </button>
          <button
            className="p-3 bg-white/70 border border-red-300 rounded-xl shadow hover:bg-red-100 hover:scale-110 transition"
            title="Delete"
            onClick={() => onDelete(world)}
          >
            <FaTrash className="text-red-500" />
          </button>
        </div>
      )}
      <a href={`/${linkURL}/${world.id}`} className="block w-full h-full">
        <div className="relative w-full h-48 sm:h-56 md:h-52">
          <Image
            src={world.logo || "/images/worlds/new_game.png"}
            alt={world.name}
            fill
            className="object-cover object-center"
          />
        </div>
        <div className="bg-[var(--background)]/60 backdrop-blur-xl p-4 flex flex-col items-center">
          <h3 className="text-lg font-bold text-[var(--primary)] mb-1 text-center break-words">
            {world.name}
          </h3>
          <div className="flex gap-3 text-xs text-[var(--foreground)]/80">
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <>
                <span>{conceptCount} concept{conceptCount === 1 ? "" : "s"}</span>
                <span>{pagesCount} page{pagesCount === 1 ? "" : "s"}</span>
              </>
            )}
          </div>
        </div>
      </a>
    </div>
  );
}
