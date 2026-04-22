/**
 * Hashtag pill used in feed and right panel.
 */
export default function TagPill({ tag, onClick, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
        active ? "" : "hover:bg-primary hover:text-white"
      }`}
      style={
        active
          ? { background: "var(--primary)", color: "#ffffff" }
          : { background: "#fef3c7", color: "#b45309" }
      }
      aria-label={`Filter by #${tag}`}
    >
      #{tag}
    </button>
  );
}

