/**
 * Compact action button for post interactions.
 */
export default function ActionButton({ icon: Icon, label, active = false, onClick, filledIcon: FilledIcon = null }) {
  const RenderIcon = active && FilledIcon ? FilledIcon : Icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md px-[7px] py-1 text-[12px] text-text2 transition-colors duration-150 hover:bg-amber-50 hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      style={active ? { color: "#d97706" } : undefined}
      aria-label={typeof label === "string" ? label : "Action"}
    >
      <RenderIcon size={15} strokeWidth={2} />
      <span>{label}</span>
    </button>
  );
}

