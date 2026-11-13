"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { DEMO_SHOPS, INITIAL_INVENTORY, INITIAL_ACTIVITY_LOG } from "./demo-data";

const STORAGE_KEYS = {
  INVENTORY: "kadakootam_inventory_v1",
  ACTIVITY: "kadakootam_activity_v1",
  FAVORITES: "kadakootam_favorites_v1",
  CURRENT_SHOP: "kadakootam_current_shop_v1",
  LANG: "kadakootam_language_v1",
  LARGE_TEXT: "kadakootam_large_text_v1",
};

const KadaContext = createContext(null);

export function KadaProvider({ children }) {
  const [isClient, setIsClient] = useState(false);
  const [shops, setShops] = useState(DEMO_SHOPS);
  const [currentShopId, setCurrentShopId] = useState("shop-valluvanad");
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [activities, setActivities] = useState(INITIAL_ACTIVITY_LOG);
  const [favoriteShopIds, setFavoriteShopIds] = useState(["shop-valluvanad"]);
  const [language, setLanguage] = useState("en"); // 'en' or 'ml'
  const [largeText, setLargeText] = useState(false); // Accessibility toggle

  // Initialize from LocalStorage
  useEffect(() => {
    setIsClient(true);
    try {
      const storedInv = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      if (storedInv) {
        setInventory(JSON.parse(storedInv));
      } else {
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY));
      }

      const storedAct = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
      if (storedAct) {
        setActivities(JSON.parse(storedAct));
      } else {
        localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(INITIAL_ACTIVITY_LOG));
      }

      const storedFav = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (storedFav) {
        setFavoriteShopIds(JSON.parse(storedFav));
      }

      const storedShop = localStorage.getItem(STORAGE_KEYS.CURRENT_SHOP);
      if (storedShop) {
        setCurrentShopId(storedShop);
      }

      const storedLang = localStorage.getItem(STORAGE_KEYS.LANG);
      if (storedLang) {
        setLanguage(storedLang);
      }

      const storedLarge = localStorage.getItem(STORAGE_KEYS.LARGE_TEXT);
      if (storedLarge) {
        setLargeText(JSON.parse(storedLarge));
      }
    } catch (e) {
      console.error("Failed to load local demo data:", e);
    }

    // Cross-tab sync listener
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS.INVENTORY && e.newValue) {
        try { setInventory(JSON.parse(e.newValue)); } catch (_) {}
      }
      if (e.key === STORAGE_KEYS.ACTIVITY && e.newValue) {
        try { setActivities(JSON.parse(e.newValue)); } catch (_) {}
      }
      if (e.key === STORAGE_KEYS.FAVORITES && e.newValue) {
        try { setFavoriteShopIds(JSON.parse(e.newValue)); } catch (_) {}
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Save changes
  const saveInventory = (newInventory) => {
    setInventory(newInventory);
    try {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(newInventory));
    } catch (e) {
      console.error("Storage save error:", e);
    }
  };

  const saveActivities = (newActivities) => {
    setActivities(newActivities);
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(newActivities));
    } catch (e) {
      console.error("Activity save error:", e);
    }
  };

  // Get current active shop details
  const currentShop = shops.find((s) => s.id === currentShopId) || shops[0];

  // Get current shop inventory
  const currentShopInventory = inventory.filter((item) => item.shopId === currentShopId);

  // Switch active shop
  const selectShop = (shopId) => {
    setCurrentShopId(shopId);
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SHOP, shopId);
    } catch (_) {}
  };

  // Toggle Language
  const toggleLanguage = () => {
    const nextLang = language === "en" ? "ml" : "en";
    setLanguage(nextLang);
    try {
      localStorage.setItem(STORAGE_KEYS.LANG, nextLang);
    } catch (_) {}
  };

  // Toggle Large Text
  const toggleLargeText = () => {
    const next = !largeText;
    setLargeText(next);
    try {
      localStorage.setItem(STORAGE_KEYS.LARGE_TEXT, JSON.stringify(next));
    } catch (_) {}
  };

  // Toggle Favorite Shop
  const toggleFavoriteShop = (shopId) => {
    const updated = favoriteShopIds.includes(shopId)
      ? favoriteShopIds.filter((id) => id !== shopId)
      : [...favoriteShopIds, shopId];
    setFavoriteShopIds(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
    } catch (_) {}
  };

  // Inventory CRUD
  const addProduct = (productData) => {
    const newItem = {
      id: `item-${Date.now()}`,
      shopId: currentShopId,
      name: productData.name,
      nameMl: productData.nameMl || productData.name,
      category: productData.category || "daily_staples",
      brand: productData.brand || "Local",
      quantity: Number(productData.quantity) || 0,
      unit: productData.unit || "kg",
      price: Number(productData.price) || 0,
      lowStockThreshold: Number(productData.lowStockThreshold) || 5,
      updatedAt: new Date().toISOString(),
      isDemo: true,
    };

    const updated = [newItem, ...inventory];
    saveInventory(updated);

    // Log activity
    const activity = {
      id: `act-${Date.now()}`,
      shopId: currentShopId,
      type: "add_product",
      itemName: newItem.name,
      action: "ADD",
      quantityChange: newItem.quantity,
      unit: newItem.unit,
      previousQty: 0,
      newQty: newItem.quantity,
      transcript: null,
      timestamp: new Date().toISOString(),
      mode: "manual",
    };
    saveActivities([activity, ...activities]);
    return newItem;
  };

  const updateProduct = (itemId, updateData) => {
    const prevItem = inventory.find((i) => i.id === itemId);
    const updated = inventory.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          ...updateData,
          quantity: updateData.quantity !== undefined ? Number(updateData.quantity) : item.quantity,
          price: updateData.price !== undefined ? Number(updateData.price) : item.price,
          lowStockThreshold: updateData.lowStockThreshold !== undefined ? Number(updateData.lowStockThreshold) : item.lowStockThreshold,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    saveInventory(updated);

    if (prevItem && updateData.quantity !== undefined && prevItem.quantity !== updateData.quantity) {
      const activity = {
        id: `act-${Date.now()}`,
        shopId: currentShopId,
        type: "manual_edit",
        itemName: prevItem.name,
        action: "SET",
        quantityChange: Math.abs(updateData.quantity - prevItem.quantity),
        unit: prevItem.unit,
        previousQty: prevItem.quantity,
        newQty: Number(updateData.quantity),
        transcript: null,
        timestamp: new Date().toISOString(),
        mode: "manual",
      };
      saveActivities([activity, ...activities]);
    }
  };

  const deleteProduct = (itemId) => {
    const itemToDelete = inventory.find((i) => i.id === itemId);
    const updated = inventory.filter((item) => item.id !== itemId);
    saveInventory(updated);

    if (itemToDelete) {
      const activity = {
        id: `act-${Date.now()}`,
        shopId: currentShopId,
        type: "delete_product",
        itemName: itemToDelete.name,
        action: "REDUCE",
        quantityChange: itemToDelete.quantity,
        unit: itemToDelete.unit,
        previousQty: itemToDelete.quantity,
        newQty: 0,
        transcript: null,
        timestamp: new Date().toISOString(),
        mode: "manual",
      };
      saveActivities([activity, ...activities]);
    }
  };

  // Apply Voice Intent to Stock (Called after shopkeeper confirms)
  const applyVoiceStockUpdate = (intentResult) => {
    if (!intentResult || !intentResult.product) return false;

    const { action, product, quantity, unit, proposedStock, transcript } = intentResult;

    // Check if item already exists in this shop
    const existingIndex = inventory.findIndex(
      (i) => i.shopId === currentShopId && (i.id === product.id || i.name.toLowerCase() === product.name.toLowerCase())
    );

    let updatedInventory;
    let prevQty = 0;
    let itemName = product.name;
    let itemUnit = unit || product.unit || "kg";

    if (existingIndex >= 0) {
      const existing = inventory[existingIndex];
      prevQty = existing.quantity;
      itemName = existing.name;
      itemUnit = existing.unit;

      const updatedItem = {
        ...existing,
        quantity: proposedStock,
        updatedAt: new Date().toISOString(),
      };

      updatedInventory = [...inventory];
      updatedInventory[existingIndex] = updatedItem;
    } else {
      // Add as new item to current shop
      const newItem = {
        id: `item-${Date.now()}`,
        shopId: currentShopId,
        name: product.name,
        nameMl: product.nameMl || product.name,
        category: product.category || "daily_staples",
        brand: "Local",
        quantity: proposedStock,
        unit: itemUnit,
        price: product.price || 50,
        lowStockThreshold: 10,
        updatedAt: new Date().toISOString(),
        isDemo: true,
      };
      updatedInventory = [newItem, ...inventory];
    }

    saveInventory(updatedInventory);

    // Record activity
    const activity = {
      id: `act-${Date.now()}`,
      shopId: currentShopId,
      type: "voice_update",
      itemName,
      action,
      quantityChange: quantity,
      unit: itemUnit,
      previousQty: prevQty,
      newQty: proposedStock,
      transcript: transcript || "",
      timestamp: new Date().toISOString(),
      mode: "voice",
    };
    saveActivities([activity, ...activities]);
    return true;
  };

  // Reset demo data to factory defaults
  const resetDemoData = () => {
    saveInventory(INITIAL_INVENTORY);
    saveActivities(INITIAL_ACTIVITY_LOG);
    setFavoriteShopIds(["shop-valluvanad"]);
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(INITIAL_ACTIVITY_LOG));
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(["shop-valluvanad"]));
  };

  return (
    <KadaContext.Provider
      value={{
        isClient,
        shops,
        currentShop,
        currentShopId,
        selectShop,
        inventory,
        currentShopInventory,
        activities: activities.filter((a) => a.shopId === currentShopId),
        allActivities: activities,
        favoriteShopIds,
        toggleFavoriteShop,
        language,
        toggleLanguage,
        largeText,
        toggleLargeText,
        addProduct,
        updateProduct,
        deleteProduct,
        applyVoiceStockUpdate,
        resetDemoData,
      }}
    >
      <div className={`${largeText ? "text-lg" : "text-base"} transition-all duration-200`}>
        {children}
      </div>
    </KadaContext.Provider>
  );
}

export function useKada() {
  const context = useContext(KadaContext);
  if (!context) {
    throw new Error("useKada must be used within a KadaProvider");
  }
  return context;
}
