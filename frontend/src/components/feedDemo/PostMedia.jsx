export default function PostMedia({ post }) {
  const media = post?.content?.media?.[0];

  if (!media?.url) {
    return null;
  }

  const isVideo = media.type === "video" || post.type === "short" || post.type === "video";

  if (isVideo) {
    return (
      <div className="mb-4 w-full rounded-xl bg-black/5 p-1">
        <video
          src={media.url}
          controls
          preload="metadata"
          className="w-full h-auto object-contain rounded-xl"
        />
      </div>
    );
  }

  return (
    <div className="mb-4 flex w-full justify-center rounded-xl bg-black/5 p-1">
      <img
        src={media.url}
        alt={post?.content?.text || "Post media"}
        loading="lazy"
        className="h-auto max-h-[600px] w-auto object-contain rounded-xl"
      />
    </div>
  );
}
