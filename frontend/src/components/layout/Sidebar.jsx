import {
  Home,
  MessageCircle,
  PlusCircle,
  Search,
  Settings,
  User,
  Users,
  Video
} from "lucide-react";

const TOP_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "community", label: "Community", icon: Users },
  { id: "discussion", label: "Discussion", icon: MessageCircle },
  { id: "search", label: "Search", icon: Search },
  { id: "shorts", label: "Shorts", icon: Video }
];

const BOTTOM_ITEMS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "settings", label: "Settings", icon: Settings }
];

function NavItem({ item, active = false }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      className={`relative flex h-10 w-full items-center gap-4 rounded-lg px-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
        active ? "" : "hover:bg-[rgba(245,158,11,0.08)]"
      }`}
      style={{
        background: active ? "#fef3c7" : "transparent",
        color: active ? "#b45309" : "#374151"
      }}
      aria-label={item.label}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 h-1/2 -translate-y-1/2"
          style={{ width: "3px", background: "var(--primary)", borderRadius: "0 2px 2px 0" }}
          aria-hidden="true"
        />
      )}
      <span className="flex w-6 justify-center">
        <Icon size={18} strokeWidth={active ? 2.5 : 2} />
      </span>
      <span className="pointer-events-none -translate-x-2 whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-200 ease-in-out group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-x-0 group-focus-within:opacity-100">
        {item.label}
      </span>
    </button>
  );
}

export default function Sidebar() {
  return (
    <aside className="group h-full w-[220px] shrink-0">
      <div
        className="flex h-full w-[72px] flex-col overflow-hidden rounded-lg border border-border px-3 py-4 transition-[width] duration-[300ms] ease-[cubic-bezier(.4,0,.2,1)] group-hover:w-[220px] group-focus-within:w-[220px]"
        style={{ background: "var(--sidebar-bg)" }}
      >
        <nav className="flex flex-col gap-4" aria-label="Primary navigation">
          {TOP_ITEMS.map((item) => (
            <NavItem key={item.id} item={item} active={item.id === "home"} />
          ))}

          <button
            type="button"
            aria-label="Create post"
            className="mt-2 flex h-10 items-center gap-4 rounded-lg bg-primary px-4 text-white transition-all duration-200 hover:-translate-y-px hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <span className="flex w-6 justify-center">
              <PlusCircle size={18} strokeWidth={2.2} />
            </span>
            <span className="pointer-events-none -translate-x-2 whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-200 ease-in-out group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-x-0 group-focus-within:opacity-100">
              Create Post
            </span>
          </button>
        </nav>

        <div className="mt-auto border-t border-border pt-4">
          <nav className="flex flex-col gap-4" aria-label="Secondary navigation">
            {BOTTOM_ITEMS.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}

