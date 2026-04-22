import { MoreHorizontal } from "lucide-react";

export default function PostHeader({ author, time, community }) {
  return (
    <header className="mb-4 flex items-start gap-3">
      <img
        src={author?.avatar}
        alt={author?.name}
        className="h-11 w-11 rounded-full border border-white/70 object-cover shadow-sm"
        loading="lazy"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-text1">{author?.name}</p>
        <p className="truncate text-sm text-text2">
          {time} · {community}
        </p>
      </div>

      <button
        type="button"
        aria-label="More options"
        className="rounded-full p-2 text-text2 transition-all duration-200 hover:bg-black/5 hover:text-text1"
      >
        <MoreHorizontal size={18} />
      </button>
    </header>
  );
}
