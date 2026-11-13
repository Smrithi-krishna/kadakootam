"use client";

import React, { useState } from "react";
import { useKada } from "@/lib/store";
import { Store, ShoppingBag, Globe, RotateCcw, Sparkles, Check, ChevronDown, Volume2, Info } from "lucide-react";

export default function Navbar({ activeTab, setActiveTab }) {
  const {
    shops,
    currentShop,
    currentShopId,
    selectShop,
    language,
    toggleLanguage,
    largeText,
    toggleLargeText,
    resetDemoData,
  } = useKada();

  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const isMl = language === "ml";

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/80 shadow-sm transition-all">
      {/* Top Notification Bar for Demo Transparency */}
      <div className="bg-amber-100/90 text-amber-900 px-4 py-1.5 text-xs sm:text-sm font-medium flex items-center justify-between border-b border-amber-200">
        <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>
            {isMl
              ? "പ്രത്യേക അറിയിപ്പ്: ഇത് കേരളത്തിലെ കടകൾക്കായുള്ള ലൈവ് ഡെമോ പ്ലാറ്റ്‌ഫോമാണ്. സാമ്പിൾ സ്റ്റോക്ക് വിവരങ്ങൾ."
              : "Demo Notice: Live platform prototype for Kerala local shops. Displaying demonstration inventory."}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => setResetConfirmOpen(true)}
            className="flex items-center gap-1 text-xs text-amber-800 hover:text-amber-950 underline font-semibold transition"
            title="Reset to initial state for demo testing"
          >
            <RotateCcw className="w-3 h-3" />
            {isMl ? "ഡെമോ വിവരങ്ങൾ പുനഃക്രമീകരിക്കുക" : "Reset Demo Data"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 flex items-center justify-center text-white shadow-md shadow-amber-900/20 shrink-0 border border-amber-400/40">
              <Store className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-amber-950 font-sans">
                  കടക്കൂട്ടം
                </span>
                <span className="text-base sm:text-lg font-bold text-amber-700 hidden xs:inline">
                  KadaKootam
                </span>
              </div>
              <p className="text-xs text-amber-800/80 font-medium hidden sm:block">
                {isMl ? "നാട്ടുപീടികകൾ. ഒറ്റ കൂട്ടായ്മ." : "Local shops. One community."}
              </p>
            </div>
          </div>

          {/* Center: Switcher between Shopkeeper & Customer */}
          <div className="bg-amber-100/80 p-1 rounded-xl flex items-center border border-amber-300/60 shadow-inner">
            <button
              onClick={() => setActiveTab("shopkeeper")}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === "shopkeeper"
                  ? "bg-amber-700 text-white shadow-sm"
                  : "text-amber-900 hover:bg-amber-200/60"
              }`}
            >
              <Store className="w-4 h-4" />
              <span>{isMl ? "കടയുടമ" : "Shopkeeper"}</span>
            </button>
            <button
              onClick={() => setActiveTab("customer")}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === "customer"
                  ? "bg-amber-700 text-white shadow-sm"
                  : "text-amber-900 hover:bg-amber-200/60"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isMl ? "ഉപഭോക്താവ്" : "Customer"}</span>
            </button>
          </div>

          {/* Right Controls: Shop Selector, Language, Large Text */}
          <div className="flex items-center gap-2">
            {/* Shop Selector Dropdown (Active shop) */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShopMenuOpen(!shopMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-semibold text-amber-900 hover:border-amber-400 transition shadow-sm"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="max-w-[130px] truncate">{isMl ? currentShop.nameMl : currentShop.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-amber-600" />
              </button>

              {shopMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-amber-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-amber-700 uppercase tracking-wider border-b border-amber-100">
                    {isMl ? "ഡെമോ കട തിരഞ്ഞെടുക്കുക" : "Select Demo Shop"}
                  </div>
                  {shops.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        selectShop(s.id);
                        setShopMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-amber-50 transition ${
                        s.id === currentShopId ? "bg-amber-100/70 font-bold text-amber-950" : "text-gray-700"
                      }`}
                    >
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-[11px] text-gray-500">{s.nameMl}</div>
                      </div>
                      {s.id === currentShopId && <Check className="w-4 h-4 text-amber-700" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Accessibility: Large Text / Elderly Mode Toggle */}
            <button
              onClick={toggleLargeText}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                largeText
                  ? "bg-amber-800 text-white border-amber-900 shadow-inner"
                  : "bg-white text-amber-900 border-amber-200 hover:border-amber-400"
              }`}
              title={isMl ? "വലിയ അക്ഷരങ്ങൾ (മുതിർന്നവർക്കായി)" : "Large Text Mode (Elderly friendly)"}
            >
              <span className="text-sm font-black">A+</span>
              <span className="hidden lg:inline">{isMl ? "വലിയ അക്ഷരം" : "Large"}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-amber-700" />
              <span>{isMl ? "English" : "മലയാളം"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-amber-300 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {isMl ? "ഡെമോ വിവരങ്ങൾ പഴയപടിയാക്കണോ?" : "Reset Demo Data?"}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {isMl
                ? "സാമ്പിൾ ഉൽപ്പന്നങ്ങളും സ്റ്റോക്കും ആദ്യത്തെ നിലയിലേക്ക് തിരികെ മാറ്റപ്പെടും."
                : "This will restore the initial demonstration stock, items, and activity logs across all 3 shops."}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                {isMl ? "റദ്ദാക്കുക" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  resetDemoData();
                  setResetConfirmOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-amber-700 text-white hover:bg-amber-800 shadow"
              >
                {isMl ? "അതെ, മാറ്റുക" : "Yes, Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
