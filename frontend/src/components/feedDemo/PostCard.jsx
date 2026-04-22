import { useState } from "react";
import PostActions from "./PostActions";
import PostHeader from "./PostHeader";
import PostMedia from "./PostMedia";
import TagBadge from "./TagBadge";

export default function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likePulseKey, setLikePulseKey] = useState(0);
  const [likeCount, setLikeCount] = useState(post?.stats?.likes || 0);

  const handleLikeToggle = () => {
    setLiked((prevLiked) => {
      const nextLiked = !prevLiked;
      setLikeCount((prevCount) => (nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1)));
      return nextLiked;
    });
    setLikePulseKey((key) => key + 1);
  };

  return (
    <article
      className="rounded-2xl border border-white/60 bg-white/60 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-md transition-all duration-200 hover:scale-[1.01]"
      style={{ borderRadius: "16px" }}
    >
      <PostHeader author={post.author} time={post.time} community={post.community} />
      <PostMedia post={post} />

      <PostActions
        liked={liked}
        saved={saved}
        likePulseKey={likePulseKey}
        onLikeToggle={handleLikeToggle}
        onSaveToggle={() => setSaved((prev) => !prev)}
      />

      <p className="mb-2 text-sm font-semibold text-text1">{likeCount.toLocaleString()} likes</p>

      <p className="mb-3 text-sm leading-relaxed text-text1">
        <span className="mr-1 font-bold">{post.author?.name}</span>
        <span>{post.content?.text}</span>
      </p>

      <div className="flex flex-wrap gap-2">
        {post.tags?.map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
      </div>
    </article>
  );
}
