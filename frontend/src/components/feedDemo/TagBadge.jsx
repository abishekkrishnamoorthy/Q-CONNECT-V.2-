export default function TagBadge({ tag }) {
  return (
    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
      {tag}
    </span>
  );
}
