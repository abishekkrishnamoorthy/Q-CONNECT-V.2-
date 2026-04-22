const TABS = [
  { id: "foryou", label: "For You" },
  { id: "questions", label: "Questions" },
  { id: "quiz", label: "Quiz" }
];

export default function TopTabs({ activeTab, onTabChange }) {
  return (
    <div
      className="sticky top-0 z-10 flex items-center border-b border-border px-4 py-4"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
    >
      <div role="tablist" aria-label="Feed tabs" className="flex items-center gap-2 rounded-full bg-[rgba(255,255,255,0.55)] p-1">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(tab.id)}
              className="relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-[250ms] hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              style={{
                color: active ? "#ffffff" : "var(--text2)",
                background: active ? "var(--primary)" : "rgba(255,255,255,0.7)",
                border: "none"
              }}
            >
              {tab.label}
              <span
                className="absolute -bottom-1 left-4 right-4 h-[2px] origin-center"
                style={{
                  background: "var(--primary)",
                  borderRadius: "2px 2px 0 0",
                  transform: active ? "scaleX(1)" : "scaleX(0)",
                  transition: "transform 250ms cubic-bezier(.4,0,.2,1)"
                }}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onTabChange("ai")}
        className="ml-auto flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-[250ms] hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        style={{
          background: activeTab === "ai" ? "var(--primary)" : "var(--primary-light)",
          color: activeTab === "ai" ? "#ffffff" : "#b45309"
        }}
        aria-label="AI news"
      >
        <span
          className="h-[7px] w-[7px] rounded-full"
          style={{
            background: activeTab === "ai" ? "#ffffff" : "var(--primary)",
            animation: "pulse 2s infinite"
          }}
          aria-hidden="true"
        />
        AI News
      </button>
    </div>
  );
}

