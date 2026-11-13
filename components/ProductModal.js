"use client";

import React, { useState, useEffect } from "react";
import { useKada } from "@/lib/store";
import { CATEGORIES, UNITS } from "@/lib/demo-data";
import { X, Plus, Save, Trash2, AlertCircle } from "lucide-react";

export default function ProductModal({ isOpen, onClose, productToEdit = null }) {
  const { addProduct, updateProduct, deleteProduct, language } = useKada();

  const isMl = language === "ml";
  const isEditing = !!productToEdit;

  const [formData, setFormData] = useState({
    name: "",
    nameMl: "",
    category: "daily_staples",
    brand: "",
    quantity: 10,
    unit: "kg",
    price: 45,
    lowStockThreshold: 5,
  });

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || "",
        nameMl: productToEdit.nameMl || "",
        category: productToEdit.category || "daily_staples",
        brand: productToEdit.brand || "",
        quantity: productToEdit.quantity !== undefined ? productToEdit.quantity : 10,
        unit: productToEdit.unit || "kg",
        price: productToEdit.price !== undefined ? productToEdit.price : 45,
        lowStockThreshold: productToEdit.lowStockThreshold !== undefined ? productToEdit.lowStockThreshold : 5,
      });
      setConfirmDelete(false);
      setError("");
    } else {
      setFormData({
        name: "",
        nameMl: "",
        category: "rice_grains",
        brand: "",
        quantity: 10,
        unit: "kg",
        price: 50,
        lowStockThreshold: 5,
      });
      setConfirmDelete(false);
      setError("");
    }
  }, [productToEdit, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError(isMl ? "സാധനത്തിന്റെ പേര് നൽകുക" : "Product name is required");
      return;
    }

    if (isEditing) {
      updateProduct(productToEdit.id, formData);
    } else {
      addProduct(formData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteProduct(productToEdit.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-amber-200 overflow-hidden my-auto animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-amber-900 text-white p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight">
              {isEditing
                ? (isMl ? "ഉൽപ്പന്നം എഡിറ്റ് ചെയ്യുക" : "Edit Product")
                : (isMl ? "പുതിയ സാധനം ചേർക്കുക" : "Add New Product")}
            </h2>
            <p className="text-xs text-amber-200">
              {isMl ? "സാധനത്തിന്റെ അളവും വിലയും രേഖപ്പെടുത്തുക" : "Manual stock entry for your shop inventory"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Name (English) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {isMl ? "സാധനത്തിന്റെ പേര് (English)" : "Product Name (English)"} *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ponni Rice, Coconut Oil, Milk"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
            />
          </div>

          {/* Product Name (Malayalam) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {isMl ? "മലയാളം പേര് (Malayalam Name)" : "Malayalam Name"}
            </label>
            <input
              type="text"
              value={formData.nameMl}
              onChange={(e) => setFormData({ ...formData, nameMl: e.target.value })}
              placeholder="ഉദാ: പൊന്നി അരി, വെളിച്ചെണ്ണ"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
            />
          </div>

          {/* Category & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {isMl ? "വിഭാഗം (Category)" : "Category"}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white font-medium"
              >
                {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {isMl ? cat.nameMl : cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {isMl ? "ബ്രാൻഡ് (Brand)" : "Brand / Producer"}
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g. Double Horse, Milma, Kera"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
              />
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {isMl ? "സ്റ്റോക്ക് അളവ് (Quantity)" : "Quantity Available"} *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {isMl ? "യൂണിറ്റ് (Unit)" : "Unit"}
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white font-medium"
              >
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {isMl ? u.labelMl : u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price & Low Stock Warning Threshold */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {isMl ? "വില (Price in ₹)" : "Price (₹)"} *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {isMl ? "കുറഞ്ഞ സ്റ്റോക്ക് മുന്നറിയിപ്പ്" : "Low Stock Alert At"}
              </label>
              <input
                type="number"
                min="1"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-between gap-3 border-t border-gray-200">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  confirmDelete
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "text-red-600 hover:bg-red-50 border border-red-200"
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {confirmDelete
                    ? (isMl ? "ഉറപ്പാണോ? ഡിലീറ്റ് ചെയ്യുക" : "Sure? Click to Delete")
                    : (isMl ? "ഡിലീറ്റ്" : "Delete")}
                </span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold transition"
              >
                {isMl ? "റദ്ദാക്കുക" : "Cancel"}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-amber-900/20 transition"
              >
                {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>
                  {isEditing
                    ? (isMl ? "സേവ് ചെയ്യുക" : "Save Changes")
                    : (isMl ? "ചേർക്കുക" : "Add to Inventory")}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
