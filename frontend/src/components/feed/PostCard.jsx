import { useMemo, useState } from "react";
import { Bookmark, Heart, MessageCircle, SendHorizontal } from "lucide-react";
import ActionButton from "../ui/ActionButton";
import Avatar from "../ui/Avatar";
import TagPill from "../ui/TagPill";
import TypeBadge from "../ui/TypeBadge";

const TYPE_COLORS = {
  question: "#3b82f6",
  thought: "#8b5cf6",
  quiz: "#10b981",
  image: "#f59e0b",
  short: "#ec4899",
  ai: "#ef4444"
};

const AI_LABELS = {
  news: "AI News",
  fact: "Did You Know",
  quiz: "AI Quiz",
  fun_question: "Fun Question"
};

function HeartFilled(props) {
  return <Heart {...props} fill="currentColor" />;
}

function BookmarkFilled(props) {
  return <Bookmark {...props} fill="currentColor" />;
}

function getPollPercentages(poll) {
  if (!poll || !Array.isArray(poll.options) || poll.options.length === 0) {
    return [];
  }
  const votes = Array.isArray(poll.optionVotes) ? poll.optionVotes : poll.options.map(() => 0);
  const total = poll.totalVotes || votes.reduce((sum, value) => sum + value, 0) || 1;
  return votes.map((vote) => Math.round((vote / total) * 100));
}

export default function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.stats?.likes || 0);

  const pollPercentages = useMemo(() => getPollPercentages(post.meta?.poll), [post.meta?.poll]);
  const leadingPollPercent = Math.max(0, ...pollPercentages);
  const typeColor = TYPE_COLORS[post.type] || "#9ca3af";

  const textContent = post.content?.text;
  const mediaCount = post.content?.media?.length || 0;

  const onLikeToggle = () => {
    setLiked((prev) => {
      const next = !prev;
      setLikeCount((count) => (next ? count + 1 : Math.max(0, count - 1)));
      return next;
    });
  };

  return (
    <article
      className="cursor-pointer rounded-[16px] border border-border bg-card p-4 shadow-sm transition-all duration-[250ms] hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md"
      style={{
        borderLeft: `3px solid ${typeColor}`,
        borderRadius: "0 16px 16px 0",
        boxShadow: "0 4px 10px rgba(0,0,0,.07)"
      }}
    >
      <header className="mb-3 flex items-center gap-[10px]">
        <Avatar name={post.author?.name} isAI={post.author?.role === "ai_account"} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text1">{post.author?.name}</p>
          <p className="truncate text-xs text-text2">
            {post.timeAgo}
            {post.community ? ` · ${post.community}` : ""}
          </p>
        </div>
        <TypeBadge type={post.type} />
      </header>

      {post.type === "question" && (
        <div className="mb-3 flex flex-wrap gap-2">
          {post.meta?.allowHuman && (
            <span className="rounded-full px-2 py-1 text-[11px] font-semibold" style={{ background: "#ecfdf5", color: "#065f46" }}>
              ? Human answers
            </span>
          )}
          {post.meta?.allowAI && (
            <span className="rounded-full px-2 py-1 text-[11px] font-semibold" style={{ background: "#fff1f2", color: "#be123c" }}>
              ? AI answers
            </span>
          )}
        </div>
      )}

      {post.type === "ai" && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full px-2 py-1 text-[11px] font-semibold" style={{ background: "#fff1f2", color: "#be123c" }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#ef4444", animation: "pulse 2s infinite" }} />
          {AI_LABELS[post.aiType] || "AI Post"}
        </div>
      )}

      {textContent && (
        <p
          className="mb-3 overflow-hidden text-sm leading-relaxed text-text1"
          style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}
        >
          {textContent}
        </p>
      )}

      {post.type === "thought" && post.meta?.poll && (
        <div className="mb-[10px] rounded-md p-[10px]" style={{ background: "#f9fafb" }}>
          <p className="mb-2 text-xs font-semibold text-text1">{post.meta.poll.question}</p>
          <div className="space-y-2">
            {post.meta.poll.options.map((option, index) => {
              const pct = pollPercentages[index] || 0;
              const isLeader = pct === leadingPollPercent && pct > 0;
              return (
                <div key={`${option}-${index}`}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-text1">{option}</span>
                    <span style={{ color: isLeader ? "#b45309" : "#6b7280" }}>{pct}%</span>
                  </div>
                  <div className="h-[5px] overflow-hidden rounded" style={{ background: "#f3f4f6" }}>
                    <div
                      className="h-full"
                      style={{
                        width: `${pct}%`,
                        background: isLeader ? "var(--primary)" : "#d1d5db",
                        transition: "width 220ms ease"
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-text2">{post.meta.poll.totalVotes || 0} votes · Closed</p>
        </div>
      )}

      {post.type === "quiz" && post.quizPreview && (
        <div className="mb-[10px] space-y-2">
          <div className="rounded-md px-[10px] py-2 text-sm text-text1" style={{ background: "#f0fdf4" }}>
            {post.quizPreview.firstQuestion}
          </div>
          <div className="space-y-2">
            {post.quizPreview.options.slice(0, 3).map((option, index) => (
              <div
                key={`${option}-${index}`}
                tabIndex={0}
                className="rounded-[7px] border border-border px-3 py-2 text-sm text-text1 transition-colors duration-150 hover:border-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                role="button"
                aria-label={`Quiz option ${index + 1}`}
              >
                {option}
              </div>
            ))}
          </div>
        </div>
      )}

      {(post.type === "image" || mediaCount > 0) && (
        <div className="mb-3 flex h-40 w-full items-center justify-center rounded-md text-sm text-text2" style={{ background: "var(--bg)" }}>
          {mediaCount} images
        </div>
      )}

      {post.tags?.length > 0 && (
        <div className="mb-[10px] flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>
      )}

      <footer className="flex items-center gap-1 border-t border-border pt-[10px]">
        <ActionButton icon={Heart} filledIcon={HeartFilled} label={likeCount} active={liked} onClick={onLikeToggle} />
        <ActionButton icon={MessageCircle} label={post.stats?.comments || 0} onClick={() => {}} />
        <ActionButton
          icon={Bookmark}
          filledIcon={BookmarkFilled}
          label={post.stats?.saves || 0}
          active={saved}
          onClick={() => setSaved((value) => !value)}
        />
        {post.type === "quiz" ? (
          <button
            type="button"
            className="ml-auto rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white transition-colors duration-150 hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label="Take quiz"
          >
            Take Quiz
          </button>
        ) : (
          <ActionButton icon={SendHorizontal} label="Share" onClick={() => {}} />
        )}
      </footer>
    </article>
  );
}

