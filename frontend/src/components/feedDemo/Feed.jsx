import PostCard from "./PostCard";

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

export default function Feed() {
  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-[700px] space-y-5">
        {dummyFeed.map((post, index) => (
          <div
            key={post.id}
            className="feed-demo-card-entrance"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <PostCard post={post} />
          </div>
        ))}
      </div>
    </div>
  );
}
