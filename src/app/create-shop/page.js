"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createVendor } from "@/models/vendors";
import { createShop } from "@/models/shops";

export default function CreateShop() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tgUser, setTgUser] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const user = window.Telegram.WebApp.initDataUnsafe?.user;
      if (user) {
        setTgUser(user);
      } else {
        setError("Could not retrieve Telegram user data.");
      }
    } else {
      setError("Telegram WebApp API not found.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tgUser) {
      setError("Cannot create shop without Telegram user data.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create Vendor
      const vendor = await createVendor({
        username: tgUser.username || `user_${tgUser.id}`,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name || "",
        pin: "0000",
        tg_id: tgUser.id,
      });

      // 2. Create Shop
      await createShop(vendor.id, {
        name,
        description,
        banner_url: "placeholder_banner_text", // Placeholder as requested
      });

      // 3. Navigate back to landing page
      router.push("/");
    } catch (err) {
      console.error("Error creating shop:", err);
      setError(err.message || "Failed to create shop. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (error && !tgUser) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black h-screen p-6 text-center">
        <div className="max-w-xs rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-900">
          <p className="text-amber-600 dark:text-amber-400 font-medium">{error}</p>
          <button 
            onClick={() => router.push("/")}
            className="mt-4 text-sm font-semibold text-black dark:text-white underline"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 font-sans dark:bg-black p-6">
      <header className="pt-4 pb-8">
        <button 
          onClick={() => router.back()}
          className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1 text-sm font-medium"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-black dark:text-zinc-50 mt-4">
          Create Your Shop
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Enter your shop details to get started
        </p>
      </header>

      <main className="flex-1 max-w-sm mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
              Shop Name
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Awesome Store"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
              Description
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell customers what you sell..."
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
              Banner
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="banner-upload"
                onChange={() => {}} // Visual only for now
              />
              <label 
                htmlFor="banner-upload"
                className="flex flex-col items-center justify-center w-full h-32 px-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all"
              >
                <span className="text-zinc-400 dark:text-zinc-500 text-sm">Tap to upload banner</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-6 rounded-2xl font-bold shadow-lg transition-all active:scale-95 text-lg mt-4 ${
              loading 
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed" 
                : "bg-black dark:bg-zinc-50 text-white dark:text-black"
            }`}
          >
            {loading ? "Saving Shop..." : "Save Shop"}
          </button>
        </form>
      </main>

      <footer className="py-8 text-center">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-medium">
          TeBaz Secure Registration
        </p>
      </footer>
    </div>
  );
}
