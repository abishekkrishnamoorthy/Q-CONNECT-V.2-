const TYPE_MAP = {
  question: { label: "Question", style: { background: "#eff6ff", color: "#1d4ed8" } },
  thought: { label: "Thought", style: { background: "#f5f3ff", color: "#6d28d9" } },
  quiz: { label: "Quiz", style: { background: "#ecfdf5", color: "#047857" } },
  image: { label: "Image", style: { background: "#fef3c7", color: "#b45309" } },
  short: { label: "Short", style: { background: "#fdf2f8", color: "#be185d" } },
  ai: { label: "AI", style: { background: "#fee2e2", color: "#b91c1c" } }
};

/**
 * Small pill label for post type.
 */
export default function TypeBadge({ type }) {
  const meta = TYPE_MAP[type] || { label: type || "Post", style: { background: "#f3f4f6", color: "#4b5563" } };

  return (
    <span className="rounded-full px-2 py-1 text-[11px] font-semibold" style={meta.style}>
      {meta.label}
    </span>
  );
}

