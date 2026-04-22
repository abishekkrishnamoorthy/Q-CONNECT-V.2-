import { useState } from "react";
import Feed from "../feed/Feed";
import RightPanel from "./RightPanel";
import Sidebar from "./Sidebar";
import TopTabs from "./TopTabs";

export default function MainLayout() {
  const [activeTab, setActiveTab] = useState("foryou");
  const [activeTag, setActiveTag] = useState(null);

  return (
    <div className="flex h-screen w-full items-stretch gap-3 overflow-x-hidden overflow-y-hidden bg-bg p-3 sm:gap-4 sm:p-4 lg:gap-6 lg:p-6">
      <Sidebar />

      <main
        className="flex min-w-0 flex-1 xl:max-w-[860px] flex-col overflow-hidden rounded-[16px]"
        style={{
          background: "rgba(255, 255, 255, 0.6)",
          border: "1px solid rgba(0,0,0,0.05)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 12px 28px rgba(31, 41, 55, 0.08), 0 2px 8px rgba(31, 41, 55, 0.06)"
        }}
      >
        <TopTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <Feed activeTab={activeTab} activeTag={activeTag} />
      </main>

      <div className="ml-auto hidden xl:block">
        <RightPanel activeTag={activeTag} onTagClick={setActiveTag} />
      </div>
    </div>
  );
}

