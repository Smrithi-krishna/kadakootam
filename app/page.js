"use client";

import React, { useState } from "react";
import { KadaProvider, useKada } from "@/lib/store";
import Navbar from "@/components/Navbar";
import ShopkeeperDashboard from "@/components/ShopkeeperDashboard";
import CustomerExperience from "@/components/CustomerExperience";
import { Heart, Sparkles, Mic, Store, ShoppingBag } from "lucide-react";

function MainContent() {
  const [activeTab, setActiveTab] = useState("shopkeeper");
  const { language } = useKada();
  const isMl = language === "ml";

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-5 sm:pt-7">
          {activeTab === "shopkeeper" ? (
            <ShopkeeperDashboard />
          ) : (
            <CustomerExperience />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-amber-200/80 bg-white/70 py-6 text-center text-xs text-amber-900/80">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-amber-950 text-sm">കടക്കൂട്ടം (KadaKootam)</span>
            <span className="text-gray-300">|</span>
            <span>{isMl ? "നാട്ടുപീടികകൾ. ഒറ്റ കൂട്ടായ്മ." : "Local shops. One community."}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500">
            <span>Powered by</span>
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold">
              Gnani.ai Prisma & Timbre
            </span>
            <span>•</span>
            <span>Built for Kerala Hackathon 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <KadaProvider>
      <MainContent />
    </KadaProvider>
  );
}
