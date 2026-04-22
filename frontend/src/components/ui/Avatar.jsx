/**
 * Avatar circle showing initials for users or a bolt for AI accounts.
 */
export default function Avatar({ name, isAI = false }) {
  const initials =
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold text-white"
      style={
        isAI
          ? { background: "linear-gradient(135deg, #f59e0b, #d97706)" }
          : { background: "#6366f1" }
      }
      aria-hidden="true"
    >
      {isAI ? "?" : initials}
    </div>
  );
}

