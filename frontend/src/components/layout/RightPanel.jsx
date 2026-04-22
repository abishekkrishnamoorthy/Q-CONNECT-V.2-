import { Flame, MessageSquare, Users } from "lucide-react";
import { useState } from "react";
import TagPill from "../ui/TagPill";

const TRENDING_TAGS = ["react", "jee", "neet", "physics", "ai", "dsa", "quiz", "startup"];

const LIVE_ROOMS = [
  { id: "room-1", name: "JEE Doubts", users: 84, active: true },
  { id: "room-2", name: "Python Sprint", users: 47, active: false },
  { id: "room-3", name: "Daily Quiz", users: 113, active: true }
];

const COMMUNITIES = [
  { id: "c1", icon: "MC", name: "Math Circle", members: "18.2k" },
  { id: "c2", icon: "CL", name: "Chem Lab", members: "12.7k" },
  { id: "c3", icon: "SC", name: "Space Club", members: "9.4k" },
  { id: "c4", icon: "CG", name: "Code Guild", members: "23.1k" },
  { id: "c5", icon: "BT", name: "Brain Teasers", members: "7.9k" },
  { id: "c6", icon: "DS", name: "Data Stack", members: "11.4k" }
];

function SectionHeading({ icon: Icon, title }) {
  return (
    <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-text2">
      <Icon size={13} className="text-text2" />
      {title}
    </h3>
  );
}

export default function RightPanel({ activeTag, onTagClick }) {
  const [joinedMap, setJoinedMap] = useState({});

  return (
    <aside className="flex w-72 flex-col gap-4 overflow-hidden">
      <section
        className="rounded-[14px] border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md"
        style={{ boxShadow: "0 8px 18px rgba(31,41,55,0.08), 0 2px 6px rgba(31,41,55,0.05)" }}
      >
        <SectionHeading icon={Flame} title="Trending" />
        <div className="flex flex-wrap gap-2">
          {TRENDING_TAGS.map((tag) => (
            <TagPill
              key={tag}
              tag={tag}
              active={activeTag === tag}
              onClick={() => onTagClick(activeTag === tag ? null : tag)}
            />
          ))}
        </div>
      </section>

      <section
        className="rounded-[14px] border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md"
        style={{ boxShadow: "0 8px 18px rgba(31,41,55,0.08), 0 2px 6px rgba(31,41,55,0.05)" }}
      >
        <SectionHeading icon={MessageSquare} title="Live Rooms" />
        <div>
          {LIVE_ROOMS.map((room) => (
            <button
              key={room.id}
              type="button"
              className="group flex w-full items-center gap-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label={`Open room ${room.name}`}
            >
              <span
                className="h-[7px] w-[7px] rounded-full"
                style={{ background: room.active ? "#10b981" : "#f59e0b" }}
                aria-hidden="true"
              />
              <span className="flex-1 text-xs font-medium text-text1 transition-colors group-hover:text-amber-700">{room.name}</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-text2">
                <Users size={11} />
                {room.users}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section
        className="flex flex-1 flex-col overflow-hidden rounded-[14px] border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md"
        style={{ boxShadow: "0 8px 18px rgba(31,41,55,0.08), 0 2px 6px rgba(31,41,55,0.05)" }}
      >
        <SectionHeading icon={Users} title="Suggested" />
        <div className="community-scrollbar flex-1 overflow-y-auto pr-2">
          {COMMUNITIES.map((community, index) => {
            const joined = !!joinedMap[community.id];
            return (
              <div
                key={community.id}
                className="flex items-center gap-2 py-2"
                style={{ borderBottom: index === COMMUNITIES.length - 1 ? "none" : "0.5px solid #f9fafb" }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 text-xs font-semibold text-amber-700" aria-hidden="true">
                  {community.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-text1">{community.name}</p>
                  <p className="text-[11px] text-text2">{community.members} members</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setJoinedMap((prev) => ({
                      ...prev,
                      [community.id]: !prev[community.id]
                    }))
                  }
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    joined ? "" : "transition-all duration-200 ease-out hover:scale-[1.04] hover:bg-primary-dark"
                  }`}
                  style={
                    joined
                      ? { background: "#e5e7eb", color: "#6b7280" }
                      : { background: "var(--primary)" }
                  }
                  aria-label={joined ? `Leave ${community.name}` : `Join ${community.name}`}
                >
                  {joined ? "Joined" : "Join"}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </aside>
  );
}

