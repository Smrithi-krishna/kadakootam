"use client";

import React, { useState } from "react";
import { useKada } from "@/lib/store";
import { CATEGORIES } from "@/lib/demo-data";
import {
  Mic,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Package,
  CheckCircle,
  XCircle,
  TrendingUp,
  Clock,
  MapPin,
  Phone,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Sparkles,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import VoiceModal from "./VoiceModal";
import ProductModal from "./ProductModal";

export default function ShopkeeperDashboard() {
  const {
    currentShop,
    currentShopInventory,
    activities,
    updateProduct,
    language,
    largeText,
  } = useKada();

  const isMl = language === "ml";

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [filterStockStatus, setFilterStockStatus] = useState("all"); // 'all', 'low', 'out'
  const [showProfileCard, setShowProfileCard] = useState(false);

  // Stock calculations
  const totalProducts = currentShopInventory.length;
  const availableProducts = currentShopInventory.filter((item) => item.quantity > 0).length;
  const lowStockProducts = currentShopInventory.filter(
    (item) => item.quantity > 0 && item.quantity <= item.lowStockThreshold
  );
  const outOfStockProducts = currentShopInventory.filter((item) => item.quantity === 0);

  // Filtered inventory
  const filteredInventory = currentShopInventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.nameMl && item.nameMl.includes(searchQuery)) ||
      (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;

    let matchesStock = true;
    if (filterStockStatus === "low") {
      matchesStock = item.quantity > 0 && item.quantity <= item.lowStockThreshold;
    } else if (filterStockStatus === "out") {
      matchesStock = item.quantity === 0;
    } else if (filterStockStatus === "available") {
      matchesStock = item.quantity > 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Quick adjust quantity (+ / -)
  const handleQuickAdjust = (item, delta) => {
    const newQty = Math.max(0, Number(item.quantity) + delta);
    updateProduct(item.id, { quantity: newQty });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Shop Header Banner */}
      <div className="bg-gradient-to-r from-amber-800 via-amber-900 to-amber-950 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-amber-700/60 relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {isMl ? "കട തുറന്നിരിക്കുന്നു" : "Store Active"}
              </span>
              <span className="text-xs text-amber-200/80 font-medium">
                {currentShop.category}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isMl ? currentShop.nameMl : currentShop.name}
            </h1>
            <p className="text-xs sm:text-sm text-amber-200 mt-1 max-w-xl">
              {isMl ? currentShop.taglineMl : currentShop.tagline}
            </p>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-3 text-xs text-amber-200/90 font-medium">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{isMl ? currentShop.addressMl : currentShop.address}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentShop.hours}</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentShop.phone}</span>
              </div>
            </div>
          </div>

          {/* Quick Voice Command CTA Button in Banner */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setVoiceModalOpen(true)}
              className="w-full sm:w-auto px-5 py-3.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-red-950/40 border border-amber-300/30 transition-all active:scale-95"
            >
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <span>{isMl ? "ശബ്ദത്തിലൂടെ സ്റ്റോക്ക് മാറ്റുക" : "Voice Stock Update"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Shop Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Products */}
        <button
          onClick={() => setFilterStockStatus("all")}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all ${
            filterStockStatus === "all"
              ? "bg-amber-100/90 border-amber-400 shadow-sm ring-2 ring-amber-400/30"
              : "bg-white border-amber-200/80 hover:border-amber-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {isMl ? "ആകെ സാധനങ്ങൾ" : "Total Products"}
            </span>
            <Package className="w-5 h-5 text-amber-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-950">{totalProducts}</div>
          <div className="text-[11px] text-gray-500 mt-1">
            {isMl ? "കടയിലുള്ള ഇനങ്ങൾ" : "Distinct items in shop"}
          </div>
        </button>

        {/* Available Products */}
        <button
          onClick={() => setFilterStockStatus("available")}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all ${
            filterStockStatus === "available"
              ? "bg-emerald-50 border-emerald-400 shadow-sm ring-2 ring-emerald-400/30"
              : "bg-white border-amber-200/80 hover:border-emerald-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {isMl ? "സ്റ്റോക്കുള്ളവ" : "In Stock"}
            </span>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900">{availableProducts}</div>
          <div className="text-[11px] text-emerald-700 mt-1">
            {isMl ? "വിൽപ്പനയ്ക്ക് ലഭ്യമാണ്" : "Available to customers"}
          </div>
        </button>

        {/* Low Stock Alerts */}
        <button
          onClick={() => setFilterStockStatus("low")}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all ${
            filterStockStatus === "low"
              ? "bg-amber-100 border-amber-500 shadow-sm ring-2 ring-amber-500/30"
              : "bg-white border-amber-200/80 hover:border-amber-400 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              {isMl ? "കുറഞ്ഞ സ്റ്റോക്ക്" : "Low Stock"}
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-900">
            {lowStockProducts.length}
          </div>
          <div className="text-[11px] text-amber-800 mt-1 font-semibold">
            {lowStockProducts.length > 0
              ? (isMl ? "ഉടൻ വരുത്തേണ്ടവ" : "Restock recommended")
              : (isMl ? "ആവശ്യത്തിന് സ്റ്റോക്കുണ്ട്" : "Healthy stock levels")}
          </div>
        </button>

        {/* Out of Stock */}
        <button
          onClick={() => setFilterStockStatus("out")}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all ${
            filterStockStatus === "out"
              ? "bg-red-50 border-red-400 shadow-sm ring-2 ring-red-400/30"
              : "bg-white border-amber-200/80 hover:border-red-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-red-800 uppercase tracking-wider">
              {isMl ? "തീർന്നുപോയവ" : "Out of Stock"}
            </span>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-900">
            {outOfStockProducts.length}
          </div>
          <div className="text-[11px] text-red-700 mt-1">
            {isMl ? "കസ്റ്റമേഴ്സിന് ലഭ്യമല്ല" : "Needs immediate restock"}
          </div>
        </button>
      </div>

      {/* 2. Low-Stock Alert Banner (if any items are low or out) */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-950">
                {isMl
                  ? `മുന്നറിയിപ്പ്: ${lowStockProducts.length + outOfStockProducts.length} സാധനങ്ങൾ ഉടൻ തീരാൻ സാധ്യതയുണ്ട്!`
                  : `Alert: ${lowStockProducts.length + outOfStockProducts.length} items are low or out of stock!`}
              </div>
              <div className="text-xs text-amber-800 mt-0.5">
                {[...outOfStockProducts, ...lowStockProducts].map((i) => i.name).slice(0, 3).join(", ")}
                {lowStockProducts.length + outOfStockProducts.length > 3 && "..."}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVoiceModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{isMl ? "വോയ്സ് വഴി സ്റ്റോക്ക് കൂട്ടുക" : "Restock via Voice"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Inventory Management Toolbar & Controls */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-amber-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-amber-950 flex items-center gap-2">
              <span>{isMl ? "ഇൻവെന്ററി പട്ടിക" : "Inventory Management"}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                {filteredInventory.length} {isMl ? "ഇനങ്ങൾ" : "items"}
              </span>
            </h2>
            <p className="text-xs text-gray-500">
              {isMl
                ? "സാധനങ്ങളുടെ അളവ്, വില, കാറ്റഗറി മാറ്റങ്ങൾ വരുത്തുക"
                : "Manage stock quantity, price, unit and alerts"}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setProductToEdit(null);
                setProductModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isMl ? "പുതിയ സാധനം ചേർക്കുക" : "Add Product"}</span>
            </button>

            <button
              onClick={() => setVoiceModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <Mic className="w-4 h-4" />
              <span>{isMl ? "വോയ്സ് അപ്ഡേറ്റ്" : "Voice Update"}</span>
            </button>
          </div>
        </div>

        {/* Search bar & Category filter pills */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isMl
                  ? "പേര്, ബ്രാൻഡ് ഉപയോഗിച്ച് തിരയുക (ഉദാ: Ponni, Milma, പഞ്ചസാര)..."
                  : "Search inventory by product name or brand..."
              }
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Dropdown on mobile / scrollable on desktop */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? "bg-amber-800 text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {isMl ? cat.nameMl : cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Table / Cards */}
        {filteredInventory.length === 0 ? (
          <div className="text-center py-12 bg-amber-50/50 rounded-2xl border border-dashed border-amber-200">
            <Package className="w-10 h-10 text-amber-400 mx-auto mb-2 opacity-60" />
            <h3 className="text-sm font-bold text-gray-700">
              {isMl ? "സാധനങ്ങളൊന്നും കണ്ടെത്താനായില്ല" : "No matching products found"}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {isMl
                ? "തിരയൽ വാക്ക് മാറ്റുകയോ പുതിയ സാധനം ചേർക്കുകയോ ചെയ്യുക."
                : "Try a different search query or add a new product to this shop."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-amber-200/80 text-[11px] font-black uppercase text-amber-900/80 tracking-wider">
                  <th className="py-3 px-3">{isMl ? "സാധനം" : "Product"}</th>
                  <th className="py-3 px-3">{isMl ? "വിഭാഗം" : "Category"}</th>
                  <th className="py-3 px-3">{isMl ? "സ്റ്റോക്ക് (ക്വിക്ക് മാറ്റം)" : "Stock & Quick Adjust"}</th>
                  <th className="py-3 px-3">{isMl ? "വില" : "Price"}</th>
                  <th className="py-3 px-3">{isMl ? "നില" : "Status"}</th>
                  <th className="py-3 px-3 text-right">{isMl ? "നടപടി" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                {filteredInventory.map((item) => {
                  const isLow = item.quantity > 0 && item.quantity <= item.lowStockThreshold;
                  const isOut = item.quantity === 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-amber-50/40 transition group"
                    >
                      {/* Product Name */}
                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-gray-900 group-hover:text-amber-950">
                          {item.name}
                        </div>
                        {item.nameMl && (
                          <div className="text-xs text-gray-500 font-medium">{item.nameMl}</div>
                        )}
                        {item.brand && (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-600 mt-0.5 font-medium">
                            {item.brand}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 text-xs text-gray-600">
                        {CATEGORIES.find((c) => c.id === item.category)?.[isMl ? "nameMl" : "name"] || item.category}
                      </td>

                      {/* Quantity & Large Accessible Quick Adjust Buttons */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(item, -1)}
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 flex items-center justify-center font-black transition active:scale-95 border border-gray-200"
                            title="Decrease quantity by 1"
                          >
                            -
                          </button>
                          <span className="font-black text-gray-900 min-w-[50px] text-center">
                            {item.quantity} <span className="text-[11px] text-gray-500 font-normal">{item.unit}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(item, 1)}
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-700 flex items-center justify-center font-black transition active:scale-95 border border-gray-200"
                            title="Increase quantity by 1"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-3 font-black text-amber-950">
                        ₹{item.price}
                        <span className="text-[11px] text-gray-500 font-normal"> / {item.unit}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                            {isMl ? "തീർന്നു" : "Out of stock"}
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                            {isMl ? "കുറഞ്ഞ സ്റ്റോക്ക്" : "Low stock"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            {isMl ? "ലഭ്യമാണ്" : "Available"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setProductToEdit(item);
                            setProductModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-amber-800 hover:bg-amber-100/60 transition"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Recent Inventory Activity Log */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-700" />
            <h3 className="text-base sm:text-lg font-black text-amber-950">
              {isMl ? "സമീപകാല സ്റ്റോക്ക് മാറ്റങ്ങൾ" : "Recent Inventory Activity"}
            </h3>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {isMl ? "വോയ്സ് & മാനുവൽ അപ്ഡേറ്റുകൾ" : "Voice & Manual Updates"}
          </span>
        </div>

        {activities.length === 0 ? (
          <p className="text-xs text-gray-500 py-4 text-center">
            {isMl ? "സ്റ്റോക്ക് മാറ്റങ്ങളൊന്നും രേഖപ്പെടുത്തിയിട്ടില്ല." : "No recent activity recorded."}
          </p>
        ) : (
          <div className="space-y-2.5">
            {activities.slice(0, 5).map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      act.mode === "voice"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {act.mode === "voice" ? <Mic className="w-4 h-4" /> : <Edit2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">
                      {act.itemName}
                      <span className="text-gray-500 font-normal ml-1">
                        ({act.previousQty} → <strong className="text-gray-900">{act.newQty}</strong> {act.unit})
                      </span>
                    </div>
                    {act.transcript && (
                      <div className="text-[11px] text-amber-800 italic mt-0.5">
                        &ldquo;{act.transcript}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      act.action === "ADD"
                        ? "bg-emerald-100 text-emerald-800"
                        : act.action === "REDUCE"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {act.action}
                  </span>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voice Modal Dialog */}
      <VoiceModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        initialMode="shopkeeper"
      />

      {/* Product Add/Edit Modal */}
      <ProductModal
        isOpen={productModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
      />
    </div>
  );
}
