import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Inbox } from "lucide-react";
import { fetchPosts } from "../../api/posts";
import DemoPostCard from "../feedDemo/PostCard";
import PostCard from "./PostCard";
import SkeletonCard from "./SkeletonCard";

const dummyFeed = [
  {
    id: "1",
    type: "image",
    author: {
      name: "Ritika Sen",
      avatar: "https://i.pravatar.cc/150?img=5"
    },
    community: "Math Club",
    time: "45m",
    content: {
      text: "Quick algebra challenge for everyone!",
      media: [
        {
          url: "https://picsum.photos/800/500?random=10",
          type: "image"
        }
      ]
    },
    stats: { likes: 6700, comments: 98, saves: 478 },
    tags: ["#quiz", "#math"]
  },
  {
    id: "2",
    type: "short",
    author: {
      name: "Karthik Dev",
      avatar: "https://i.pravatar.cc/150?img=8"
    },
    community: "Physics Core",
    time: "1h",
    content: {
      text: "Watch this simple explanation of gravity!",
      media: [
        {
          url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          type: "video"
        }
      ]
    },
    stats: { likes: 3200, comments: 56, saves: 120 },
    tags: ["#physics", "#science"]
  }
];

export default function Feed({ activeTab, activeTag }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const bottomRef = useRef(null);

  const tab = useMemo(() => activeTab || "foryou", [activeTab]);

  useEffect(() => {
    let ignore = false;

    const loadInitial = async () => {
      if (tab === "foryou") {
        setLoading(false);
        setPosts([]);
        setNextCursor(null);
        return;
      }

      setLoading(true);
      setPosts([]);
      setNextCursor(null);

      try {
        const result = await fetchPosts({ tab, cursor: null, tag: activeTag });
        if (ignore) return;
        setPosts(result.posts || []);
        setNextCursor(result.nextCursor || null);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadInitial();

    return () => {
      ignore = true;
    };
  }, [activeTag, tab]);

  const loadMore = useCallback(async () => {
    if (tab === "foryou" || !nextCursor || loadingMore || loading) {
      return;
    }

    setLoadingMore(true);
    try {
      const result = await fetchPosts({ tab, cursor: nextCursor, tag: activeTag });
      setPosts((prev) => [...prev, ...(result.posts || [])]);
      setNextCursor(result.nextCursor || null);
    } finally {
      setLoadingMore(false);
    }
  }, [activeTag, loading, loadingMore, nextCursor, tab]);

  useEffect(() => {
    if (!bottomRef.current) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          loadMore();
        }
      },
      { root: null, threshold: 0.2 }
    );

    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  const feedItems = tab === "foryou" ? dummyFeed : posts;

  if (loading) {
    return (
      <div className="feed-scrollbar flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto w-full max-w-[720px] space-y-4 px-1">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="feed-scrollbar flex-1 overflow-y-auto px-4 py-4">
      <div className="mx-auto w-full max-w-[720px] space-y-5 px-1">
        {feedItems.map((post, index) => (
          <div
            key={post._id || post.id}
            className="card-entrance"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            {tab === "foryou" ? <DemoPostCard post={post} /> : <PostCard post={post} />}
          </div>
        ))}

        {!loading && tab !== "foryou" && posts.length === 0 && (
          <div className="flex flex-col items-center pt-16 text-center text-text2">
            <Inbox size={44} strokeWidth={1.7} className="mb-4 text-gray-400" aria-hidden="true" />
            <p className="text-base font-medium text-text1">Nothing here yet</p>
            <p className="text-sm text-text2">Be the first to post</p>
          </div>
        )}

        {loadingMore && tab !== "foryou" && <SkeletonCard />}
        <div ref={bottomRef} aria-hidden="true" />
      </div>
    </div>
  );
}
