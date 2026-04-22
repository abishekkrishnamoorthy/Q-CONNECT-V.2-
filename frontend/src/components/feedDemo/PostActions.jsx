import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";

function ActionIconButton({ label, children, onClick, className = "" }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`rounded-full p-2 text-text1 transition-all duration-200 hover:bg-black/5 ${className}`}
    >
      {children}
    </button>
  );
}

export default function PostActions({
  liked,
  saved,
  likePulseKey,
  onLikeToggle,
  onSaveToggle
}) {
  return (
    <div className="mb-3 flex items-center">
      <ActionIconButton label={liked ? "Unlike post" : "Like post"} onClick={onLikeToggle}>
        <span
          key={likePulseKey}
          className={`inline-flex like-pop ${liked ? "text-rose-500" : "text-text1"}`}
        >
          <Heart size={21} fill={liked ? "currentColor" : "none"} />
        </span>
      </ActionIconButton>

      <ActionIconButton label="Comment">
        <MessageCircle size={21} />
      </ActionIconButton>

      <ActionIconButton label="Share">
        <Send size={21} />
      </ActionIconButton>

      <ActionIconButton
        label={saved ? "Unsave post" : "Save post"}
        onClick={onSaveToggle}
        className="ml-auto"
      >
        <Bookmark size={21} fill={saved ? "currentColor" : "none"} />
      </ActionIconButton>
    </div>
  );
}
