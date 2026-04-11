"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getVendorByTgId } from "@/models/vendors";
import { getShopsByVendor } from "@/models/shops";
import { getAllCategories } from "@/models/categories";
import { createProduct } from "@/models/products";

export default function AddProduct() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [shopId, setShopId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function initPage() {
      try {
        if (typeof window !== "undefined" && window.Telegram?.WebApp) {
          const user = window.Telegram.WebApp.initDataUnsafe?.user;
          if (user) {
            // 1. Get Vendor
            const vendor = await getVendorByTgId(user.id);
            if (!vendor) {
              setError("Vendor record not found. Please create a shop first.");
              setLoading(false);
              return;
            }

            // 2. Get Shop
            const shops = await getShopsByVendor(vendor.id);
            if (shops && shops.length > 0) {
              setShopId(shops[0].id); // Using the first shop for now
            } else {
              setError("No shop found for this vendor. Please create a shop first.");
              setLoading(false);
              return;
            }

            // 3. Get Categories
            const allCategories = await getAllCategories();
            setCategories(allCategories);
            if (allCategories.length > 0) {
              setCategoryId(allCategories[0].id);
            }
          } else {
            setError("Could not retrieve Telegram user data.");
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

    initPage();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopId || !categoryId) {
      setError("Missing shop or category information.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createProduct({
        shop_id: shopId,
        category_id: parseInt(categoryId),
        name,
        description,
        picture_url: "placeholder_product_image", // Placeholder as requested
      });

      router.push("/");
    } catch (err) {
      console.error("Error creating product:", err);
      setError(err.message || "Failed to add product. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-black dark:border-zinc-700 dark:border-t-white"></div>
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
          Add New Product
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Fill in the details for your new product
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
              Category
            </label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all appearance-none"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
              Product Name
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Organic Green Tea"
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
              placeholder="Describe your product features..."
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
              Product Image
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="product-image-upload"
                onChange={() => {}} // Visual only for now
              />
              <label 
                htmlFor="product-image-upload"
                className="flex flex-col items-center justify-center w-full h-32 px-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all"
              >
                <span className="text-zinc-400 dark:text-zinc-500 text-sm">Tap to upload product image</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !shopId}
            className={`w-full py-4 px-6 rounded-2xl font-bold shadow-lg transition-all active:scale-95 text-lg mt-4 ${
              submitting || !shopId
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed" 
                : "bg-black dark:bg-zinc-50 text-white dark:text-black"
            }`}
          >
            {submitting ? "Saving Product..." : "Save Product"}
          </button>
        </form>
      </main>

      <footer className="py-8 text-center">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-medium">
          TeBaz Inventory Management
        </p>
      </footer>
    </div>
  );
}
