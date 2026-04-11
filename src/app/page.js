"use client";

import { useEffect, useState } from "react";
import { getVendorByTgId } from "@/models/vendors";

export default function Home() {
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function initWebApp() {
      try {
        if (typeof window !== "undefined" && window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          tg.expand();

          const userData = tg.initDataUnsafe?.user;

          if (userData) {
            setUser(userData);
            
            // Check if user is a vendor in our DB
            const vendorData = await getVendorByTgId(userData.id);
            setVendor(vendorData);
          } else {
            setError("User data not found. Are you opening this from Telegram?");
          }
        } else {
          setError("Telegram WebApp API not found.");
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setError("Failed to initialize. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    initWebApp();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-black dark:border-zinc-700 dark:border-t-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black h-screen p-6 text-center">
        <div className="max-w-xs rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-900">
          <p className="text-amber-600 dark:text-amber-400 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 font-sans dark:bg-black p-6">
      <header className="flex flex-col items-center gap-2 pt-8 pb-12 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-black dark:text-zinc-50">
          TeBaz
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          The Telegram Bazaar
        </p>
      </header>

      <main className="flex flex-col gap-4 w-full max-w-sm mx-auto">
        {vendor ? (
          // Vendor View
          <>
            <button className="w-full py-4 px-6 rounded-2xl bg-white dark:bg-zinc-900 text-black dark:text-white font-semibold shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all active:scale-95 text-left flex justify-between items-center">
              Active Orders
              <span className="text-zinc-400">→</span>
            </button>
            <button className="w-full py-4 px-6 rounded-2xl bg-white dark:bg-zinc-900 text-black dark:text-white font-semibold shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all active:scale-95 text-left flex justify-between items-center">
              Add New Product
              <span className="text-zinc-400">+</span>
            </button>
            <button className="w-full py-4 px-6 rounded-2xl bg-white dark:bg-zinc-900 text-black dark:text-white font-semibold shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all active:scale-95 text-left flex justify-between items-center">
              Edit Existing Products
              <span className="text-zinc-400">✎</span>
            </button>
            <button className="w-full py-4 px-6 rounded-2xl bg-white dark:bg-zinc-900 text-black dark:text-white font-semibold shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all active:scale-95 text-left flex justify-between items-center">
              Edit Shop Info
              <span className="text-zinc-400">⚙</span>
            </button>
            <button className="w-full py-4 px-6 rounded-2xl bg-white dark:bg-zinc-900 text-black dark:text-white font-semibold shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all active:scale-95 text-left flex justify-between items-center">
              Order History
              <span className="text-zinc-400">⟲</span>
            </button>
          </>
        ) : (
          // Non-Vendor View
          <button className="w-full py-5 px-6 rounded-2xl bg-black dark:bg-zinc-50 text-white dark:text-black font-bold shadow-lg transition-all active:scale-95 text-center text-lg">
            Create My Shop
          </button>
        )}
      </main>

      <footer className="mt-auto pb-8 text-center">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-medium">
          Powered by TeBaz
        </p>
      </footer>
    </div>
  );
}
