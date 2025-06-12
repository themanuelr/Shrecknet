// WorldCard.tsx — glassy, hero-style, with icons for concepts and pages
import Image from "next/image";
import { useConcepts } from "@/app/lib/useConcept";
import { useAuth } from "../auth/AuthProvider";
import { hasRole } from "@/app/lib/roles";
import { FaEdit, FaTrash } from "react-icons/fa";
import { HiOutlineLightBulb } from "react-icons/hi2";
import { HiOutlineDocumentText } from "react-icons/hi2";

export default function WorldCard({ world, linkURL, showEdit, onEdit, onDelete }) {
  const { user } = useAuth();
  const { concepts, isLoading } = useConcepts(world.id);

  const conceptCount = concepts.length;
  const pagesCount = concepts.reduce((sum, c) => sum + (c.pages_count || 0), 0);

  return (
    <div
      className="group relative w-[260px] sm:w-[320px] md:w-[360px] bg-white/10 rounded-2xl shadow-2xl border border-white/20 overflow-hidden hover:shadow-[0_4px_40px_0_rgba(123,47,242,0.13)] hover:scale-[1.035] hover:border-[var(--primary)]/60 transition-all duration-200 backdrop-blur-lg"
      style={{ boxShadow: "0 4px 24px 0 #7b2ff232, 0 2px 10px #36205a20" }}
    >
      {showEdit && hasRole(user?.role, "world builder") && (
        <div className="absolute right-5 top-5 z-30 flex flex-col gap-3 items-center">
          <button
            className="p-3 bg-white/70 border border-[var(--primary)] rounded-xl shadow hover:bg-[var(--primary)]/50 hover:scale-110 transition"
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
        <div className="bg-white/60 backdrop-blur-xl p-4 flex flex-col items-center border-t border-white/10">
          <h3 className="text-lg font-bold text-[var(--primary)] mb-1 text-center break-words drop-shadow-lg">
            {world.name}
          </h3>
          <div className="flex gap-4 text-xs text-white/90 mt-1">
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <>
                <span className="flex items-center gap-1 text-black/90 font-semibold"><HiOutlineLightBulb className="w-4 h-4 text-black" /> {conceptCount} Concept{conceptCount === 1 ? "" : "s"}</span>
                <span className="flex items-center gap-1 text-black/90 font-semibold"><HiOutlineDocumentText className="w-4 h-4 text-black" /> {pagesCount} Page{pagesCount === 1 ? "" : "s"}</span>
              </>
            )}
          </div>
        </div>
      </a>
    </div>
  );
}
