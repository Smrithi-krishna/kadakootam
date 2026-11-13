"use client";

import React, { useState, useMemo } from "react";
import { useKada } from "@/lib/store";
import { PRODUCT_ALTERNATIVES } from "@/lib/demo-data";
import { parseCustomerSearchQuery } from "@/lib/voice-intent-parser";
import {
  Search,
  Mic,
  Volume2,
  Star,
  MapPin,
  Clock,
  Phone,
  Store,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowRight,
  TrendingDown,
  Info,
  Loader2,
  Check
} from "lucide-react";
import VoiceModal from "./VoiceModal";

export default function CustomerExperience() {
  const {
    shops,
    inventory,
    favoriteShopIds,
    toggleFavoriteShop,
    language,
    largeText,
  } = useKada();

  const isMl = language === "ml";

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState("price_asc"); // 'price_asc', 'stock_desc', 'shop_name'
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState(null);
  const [pickupRequestedShop, setPickupRequestedShop] = useState(null);

  // Suggested quick customer search chips
  const quickSearches = [
    { label: "Ponni Rice", labelMl: "പൊന്നി അരി", query: "Where can I get Ponni rice?" },
    { label: "Milma Milk", labelMl: "മിൽമ പാൽ", query: "Milma milk" },
    { label: "Coconut Oil", labelMl: "വെളിച്ചെണ്ണ", query: "Kera coconut oil" },
    { label: "White Sugar", labelMl: "പഞ്ചസാര", query: "Sugar" },
    { label: "Atta", labelMl: "ആട്ട", query: "Aashirvaad atta" },
  ];

  // Process Query using deterministic customer query parser
  const parsedSearch = useMemo(() => {
    return parseCustomerSearchQuery(searchQuery);
  }, [searchQuery]);

  // Find matching items across all demo shops
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const term = parsedSearch.cleanQuery.toLowerCase();
    const tokens = term.split(/\s+/).filter(Boolean);

    // Search all shop inventory
    const matches = inventory.filter((item) => {
      const itemTitle = item.name.toLowerCase();
      const itemTitleMl = (item.nameMl || "").toLowerCase();
      const brand = (item.brand || "").toLowerCase();

      // Check full match or token match
      if (itemTitle.includes(term) || itemTitleMl.includes(term) || brand.includes(term)) {
        return true;
      }

      return tokens.some((token) => {
        if (token.length < 3) return false;
        return itemTitle.includes(token) || itemTitleMl.includes(token);
      });
    });

    // Attach shop details
    const enriched = matches.map((item) => {
      const shop = shops.find((s) => s.id === item.shopId) || {
        name: "Local Shop",
        nameMl: "നാട്ടുപീടിക",
        address: "Kerala",
        phone: "+91 94471 00000",
      };
      return {
        ...item,
        shop,
        isFavorite: favoriteShopIds.includes(item.shopId),
      };
    });

    // Sort items
    if (selectedSort === "price_asc") {
      enriched.sort((a, b) => a.price - b.price);
    } else if (selectedSort === "stock_desc") {
      enriched.sort((a, b) => b.quantity - a.quantity);
    } else if (selectedSort === "shop_name") {
      enriched.sort((a, b) => a.shop.name.localeCompare(b.shop.name));
    }

    return enriched;
  }, [inventory, shops, searchQuery, parsedSearch, selectedSort, favoriteShopIds]);

  // Find lowest price among matching items to show "Best Price" badge
  const lowestPrice = useMemo(() => {
    const inStockMatches = searchResults.filter((r) => r.quantity > 0);
    if (inStockMatches.length === 0) return null;
    return Math.min(...inStockMatches.map((r) => r.price));
  }, [searchResults]);

  // Alternative recommendations if requested item is out of stock or few results
  const alternatives = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const term = parsedSearch.cleanQuery.toLowerCase();

    for (const [key, alts] of Object.entries(PRODUCT_ALTERNATIVES)) {
      if (term.includes(key) || key.includes(term)) {
        return alts;
      }
    }
    return [];
  }, [searchQuery, parsedSearch]);

  // Read-Aloud Search Results using Gnani Timbre TTS (or Web Speech synthesis fallback)
  const handleReadAloud = async () => {
    if (searchResults.length === 0) return;
    setIsReadingAloud(true);

    // Prepare natural summary in Malayalam or English
    const topItem = searchResults[0];
    const inStockShops = searchResults.filter((s) => s.quantity > 0);

    let summaryText = "";
    if (isMl) {
      if (inStockShops.length > 0) {
        summaryText = `${topItem.nameMl || topItem.name} ${inStockShops.length} കടകളിൽ ലഭ്യമാണ്. ഏറ്റവും കുറഞ്ഞ വില ${topItem.shop.nameMl || topItem.shop.name} കടയിലാണ്, ${lowestPrice} രൂപ.`;
      } else {
        summaryText = `ക്ഷമിക്കണം, നിങ്ങൾ തിരഞ്ഞ ${topItem.nameMl || topItem.name} നിലവിൽ ഒരു കടയിലും സ്റ്റോക്കില്ല.`;
      }
    } else {
      if (inStockShops.length > 0) {
        summaryText = `${topItem.name} is available in ${inStockShops.length} local shops. Lowest price is ₹${lowestPrice} at ${topItem.shop.name}.`;
      } else {
        summaryText = `Sorry, ${topItem.name} is currently out of stock across all participating shops.`;
      }
    }

    try {
      // Call server TTS endpoint
      const response = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: summaryText,
          language: isMl ? "ml-IN" : "en-IN",
          voice: "Nalini",
        }),
      });

      const data = await response.json();

      if (data.success && data.audioBase64) {
        // Play Gnani Timbre synthetic audio
        const audio = new Audio(data.audioBase64);
        audio.onended = () => setIsReadingAloud(false);
        audio.onerror = () => fallbackBrowserSpeech(summaryText);
        await audio.play();
      } else {
        // Fallback to Web Speech API
        fallbackBrowserSpeech(summaryText);
      }
    } catch (e) {
      console.warn("TTS fetch fallback:", e);
      fallbackBrowserSpeech(summaryText);
    }
  };

  const fallbackBrowserSpeech = (text) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = isMl ? "ml-IN" : "en-IN";
      utterance.rate = 0.95;
      utterance.onend = () => setIsReadingAloud(false);
      utterance.onerror = () => setIsReadingAloud(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsReadingAloud(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Customer Hero Banner with Natural Search */}
      <div className="bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 rounded-3xl p-6 sm:p-9 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-200 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isMl ? "തദ്ദേശീയ ഉൽപ്പന്ന തിരച്ചിൽ" : "Kerala Neighborhood Discovery"}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-2">
            {isMl ? "ഏത് സാധനമാണ് വേണ്ടത്?" : "Find products in local shops near you"}
          </h1>
          <p className="text-xs sm:text-sm text-amber-100/90 mb-6 font-medium">
            {isMl
              ? "മലയാളത്തിലോ ഇംഗ്ലീഷിലോ ചോദിക്കൂ, അടുത്തുളള കടകളിലെ സ്റ്റോക്കും വിലയും അറിയാം."
              : "Search or speak in Malayalam, English or Manglish. Compare prices and check live demo stock."}
          </p>

          {/* Search Box + Large Mic Button */}
          <div className="relative flex items-center bg-white rounded-2xl shadow-2xl p-1.5 border-2 border-amber-300">
            <Search className="w-5 h-5 text-gray-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isMl
                  ? "ഉദാ: 'പൊന്നി അരി എവിടെ കിട്ടും?' അല്ലെങ്കിൽ 'Milma Milk'..."
                  : "e.g. 'Where can I get Ponni rice?' or 'Milma milk'..."
              }
              className="w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-gray-900 focus:outline-none placeholder:text-gray-400 placeholder:font-normal"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-gray-400 hover:text-gray-700 px-2 font-medium"
              >
                Clear
              </button>
            )}

            {/* Giant Voice Search Mic Trigger */}
            <button
              type="button"
              onClick={() => setVoiceModalOpen(true)}
              className="bg-amber-700 hover:bg-amber-800 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shrink-0 shadow-md transition active:scale-95"
              title="Speak with Gnani Prisma"
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200" />
              <span className="hidden sm:inline">{isMl ? "സംസാരിക്കൂ" : "Voice"}</span>
            </button>
          </div>

          {/* Quick search suggestion pills */}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold">
            <span className="text-amber-200/80 text-[11px] font-bold">
              {isMl ? "സാമ്പിൾ ചോദ്യങ്ങൾ:" : "Try asking:"}
            </span>
            {quickSearches.map((qs, i) => (
              <button
                key={i}
                onClick={() => setSearchQuery(qs.query)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs transition"
              >
                {isMl ? qs.labelMl : qs.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Results Section */}
      {searchQuery.trim() ? (
        <div className="space-y-4">
          {/* Result Toolbar & Read-Aloud Button */}
          <div className="bg-white rounded-2xl p-4 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase">
                {isMl ? "തിരയൽ ഫലം" : "Search Results"}
              </div>
              <div className="text-sm font-black text-amber-950">
                {searchResults.length}{" "}
                {isMl ? "കടകളിൽ കണ്ടെത്തി" : `matching items found across ${shops.length} shops`}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Gnani Timbre Read-Aloud Button */}
              {searchResults.length > 0 && (
                <button
                  onClick={handleReadAloud}
                  disabled={isReadingAloud}
                  className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200/80 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition border border-amber-300/70"
                  title="Read aloud with Gnani Timbre TTS"
                >
                  {isReadingAloud ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-amber-700" />
                  )}
                  <span>{isMl ? "വായിച്ചു കേൾക്കുക" : "Read Aloud (Gnani Timbre)"}</span>
                </button>
              )}

              {/* Sort selector */}
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 focus:outline-none"
              >
                <option value="price_asc">{isMl ? "വില: കുറഞ്ഞത് ആദ്യം" : "Price: Low to High"}</option>
                <option value="stock_desc">{isMl ? "സ്റ്റോക്ക്: കൂടുതൽ ആദ്യം" : "Stock: High to Low"}</option>
                <option value="shop_name">{isMl ? "കടയുടെ പേര്" : "Shop Name"}</option>
              </select>
            </div>
          </div>

          {/* Results Grid / Shop Comparison Cards */}
          {searchResults.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-amber-200 text-center">
              <ShoppingBag className="w-12 h-12 text-amber-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900 mb-1">
                {isMl ? "സാധനം കണ്ടെത്താനായില്ല" : "No shops currently have this item"}
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
                {isMl
                  ? "നിങ്ങൾ തിരഞ്ഞ ഉൽപ്പന്നം ഡെമോ കടകളിൽ ലഭ്യമല്ല. മറ്റ് ഉൽപ്പന്നങ്ങൾ തിരയുക."
                  : "We searched across all registered demo shops. Check the suggested alternatives below."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((item) => {
                const isBestPrice = item.price === lowestPrice && item.quantity > 0;
                const isOutOfStock = item.quantity === 0;
                const isLow = item.quantity > 0 && item.quantity <= item.lowStockThreshold;

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-3xl p-5 border transition-all shadow-xs hover:shadow-md flex flex-col justify-between relative ${
                      isBestPrice
                        ? "border-emerald-400 ring-2 ring-emerald-400/20"
                        : "border-amber-200 hover:border-amber-400"
                    }`}
                  >
                    {/* Best Price Ribbon */}
                    {isBestPrice && (
                      <div className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        <span>{isMl ? "ഏറ്റവും കുറഞ്ഞ വില!" : "Best Price"}</span>
                      </div>
                    )}

                    <div>
                      {/* Shop Name & Favorite Toggle */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-amber-800 font-bold">
                            <Store className="w-3.5 h-3.5" />
                            <span>{isMl ? item.shop.nameMl : item.shop.name}</span>
                          </div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate">{item.shop.address}</span>
                          </div>
                        </div>

                        {/* Save Favorite Shop */}
                        <button
                          onClick={() => toggleFavoriteShop(item.shop.id)}
                          className="p-1.5 rounded-full hover:bg-amber-100/60 transition"
                          title={item.isFavorite ? "Remove favorite" : "Save as favorite shop"}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              item.isFavorite
                                ? "fill-amber-500 text-amber-500"
                                : "text-gray-300 hover:text-amber-400"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Product Details */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <h4 className="text-base font-black text-gray-950">
                          {item.name}
                        </h4>
                        {item.nameMl && (
                          <div className="text-xs text-gray-600 font-medium">
                            {item.nameMl}
                          </div>
                        )}
                        {item.brand && (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-600 font-medium mt-1">
                            {item.brand}
                          </span>
                        )}
                      </div>

                      {/* Price & Available Stock */}
                      <div className="flex items-baseline justify-between mt-4 bg-amber-50/60 p-3 rounded-2xl border border-amber-100">
                        <div>
                          <span className="text-xs text-gray-500 uppercase font-bold block">
                            {isMl ? "വില" : "Price"}
                          </span>
                          <span className="text-xl font-black text-amber-950">
                            ₹{item.price}
                          </span>
                          <span className="text-xs text-gray-500 font-normal"> / {item.unit}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-gray-500 uppercase font-bold block">
                            {isMl ? "സ്റ്റോക്ക്" : "Stock"}
                          </span>
                          {isOutOfStock ? (
                            <span className="text-xs font-bold text-red-600">
                              {isMl ? "തീർന്നു" : "Out of stock"}
                            </span>
                          ) : (
                            <span className="text-base font-black text-emerald-700">
                              {item.quantity} {item.unit}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Last Updated Demo Timestamp (MANDATORY TRANSPARENCY REQUIREMENT) */}
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium mt-2 px-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {isMl ? "സ്റ്റോക്ക് പുതുക്കിയത്:" : "Stock updated:"}{" "}
                          {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Demo)
                        </span>
                      </div>
                    </div>

                    {/* Action buttons: Call / Request Pickup */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                      <a
                        href={`tel:${item.shop.phone}`}
                        className="flex-1 py-2 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-gray-500" />
                        <span>{isMl ? "വിളിക്കുക" : "Call"}</span>
                      </a>

                      <button
                        onClick={() => setPickupRequestedShop(item.shop)}
                        className="flex-2 py-2 px-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{isMl ? "പിക്കപ്പ് ചോദിക്കുക" : "Request Pickup"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Smart Product Alternatives Card (Prompt requirement: "Show alternative products if requested product is unavailable") */}
          {alternatives.length > 0 && (
            <div className="bg-amber-50/90 rounded-3xl p-5 sm:p-6 border border-amber-300 shadow-sm mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-amber-700" />
                <h3 className="text-sm sm:text-base font-black text-amber-950">
                  {isMl ? "പകരമുള്ള ഉൽപ്പന്നങ്ങൾ (Smart Alternatives)" : "Alternative Products Recommended"}
                </h3>
              </div>
              <p className="text-xs text-amber-900/80 mb-4 font-medium">
                {isMl
                  ? "നിങ്ങൾ തിരഞ്ഞ സാധനം കുറവാണെങ്കിൽ, ഈ നാടൻ പകരക്കാർ കടകളിൽ ലഭ്യമാണ്:"
                  : "If your preferred item is unavailable or you want other local options:"}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {alternatives.map((alt, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSearchQuery(alt.name)}
                    className="p-3.5 bg-white rounded-2xl border border-amber-200 hover:border-amber-400 cursor-pointer transition shadow-xs group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-sm text-gray-900 group-hover:text-amber-900">
                        {alt.name}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-600 opacity-60 group-hover:translate-x-0.5 transition" />
                    </div>
                    {alt.nameMl && (
                      <div className="text-xs text-gray-500 font-medium">{alt.nameMl}</div>
                    )}
                    <div className="text-[11px] text-amber-800/90 mt-1.5 font-medium bg-amber-50 p-1.5 rounded-lg">
                      {alt.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Default Discovery View: Participating Local Shops */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-amber-950">
                {isMl ? "രജിസ്റ്റർ ചെയ്ത കടകൾ" : "Participating Demo Shops"}
              </h2>
              <p className="text-xs text-gray-500">
                {isMl
                  ? "നിങ്ങളുടെ നാട്ടിലെ രജിസ്റ്റർ ചെയ്ത കടകളുടെ ലിസ്റ്റ്"
                  : "Explore local shopkeepers sharing stock transparency on KadaKootam"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shops.map((shop) => {
              const shopInventoryCount = inventory.filter((i) => i.shopId === shop.id).length;
              const isFav = favoriteShopIds.includes(shop.id);

              return (
                <div
                  key={shop.id}
                  className="bg-white rounded-3xl p-5 border border-amber-200/90 hover:border-amber-400 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                        {shop.category}
                      </span>
                      <button
                        onClick={() => toggleFavoriteShop(shop.id)}
                        className="p-1 rounded-full hover:bg-amber-100 transition"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            isFav ? "fill-amber-500 text-amber-500" : "text-gray-300"
                          }`}
                        />
                      </button>
                    </div>

                    <h3 className="text-base font-black text-gray-950">
                      {isMl ? shop.nameMl : shop.name}
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5">
                      {isMl ? shop.taglineMl : shop.tagline}
                    </p>

                    <div className="mt-3 space-y-1 text-xs text-gray-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{shop.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{shop.hours}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{shop.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-bold">
                      {shopInventoryCount} {isMl ? "സാധനങ്ങൾ ലിസ്റ്റ് ചെയ്തിട്ടുണ്ട്" : "items in stock"}
                    </span>
                    <button
                      onClick={() => setSearchQuery("rice")}
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                    >
                      <span>{isMl ? "സ്റ്റോക്ക് കാണുക" : "Browse Stock"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pickup Request Modal Dialog */}
      {pickupRequestedShop && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-amber-300 animate-in zoom-in-95">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {isMl ? "പിക്കപ്പ് ഓർഡർ സ്ഥിരീകരണം" : "Pickup Request Placed"}
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              {isMl
                ? `${pickupRequestedShop.nameMl || pickupRequestedShop.name} കടയിലേക്ക് നിങ്ങളുടെ ഓർഡർ അപേക്ഷ അയച്ചു. പായ്ക്ക് ചെയ്യുമ്പോൾ അവർ വിളിക്കുന്നതാണ്.`
                : `Your pickup request has been reserved with ${pickupRequestedShop.name}. They will keep it ready at the counter.`}
            </p>
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 mb-4">
              <div><strong>Owner:</strong> {pickupRequestedShop.owner}</div>
              <div><strong>Phone:</strong> {pickupRequestedShop.phone}</div>
              <div><strong>Hours:</strong> {pickupRequestedShop.hours}</div>
            </div>
            <button
              onClick={() => setPickupRequestedShop(null)}
              className="w-full py-2.5 rounded-xl bg-amber-700 text-white font-bold text-xs"
            >
              {isMl ? "ശരി (Close)" : "Done"}
            </button>
          </div>
        </div>
      )}

      {/* Voice Modal Dialog */}
      <VoiceModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        initialMode="customer"
        onCustomerSearch={(recognizedText) => {
          setSearchQuery(recognizedText);
        }}
      />
    </div>
  );
}
