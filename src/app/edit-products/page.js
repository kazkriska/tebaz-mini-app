"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getVendorByTgId } from "@/models/vendors";
import { getShopsByVendor } from "@/models/shops";
import { getProductsByShop } from "@/models/products";

export default function EditProductsList() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        if (typeof window !== "undefined" && window.Telegram?.WebApp) {
          const user = window.Telegram.WebApp.initDataUnsafe?.user;
          if (user) {
            const vendor = await getVendorByTgId(user.id);
            if (!vendor) {
              setError("Vendor not found.");
              setLoading(false);
              return;
            }

            const shops = await getShopsByVendor(vendor.id);
            if (shops && shops.length > 0) {
              const shopProducts = await getProductsByShop(shops[0].id);
              setProducts(shopProducts);
            } else {
              setError("Shop not found.");
            }
          } else {
            setError("Telegram user not found.");
          }
        } else {
          setError("Telegram API not found.");
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

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
          onClick={() => router.push("/")}
          className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1 text-sm font-medium"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-black dark:text-zinc-50 mt-4">
          Your Products
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Select a product to edit its details
        </p>
      </header>

      <main className="flex-1 max-w-sm mx-auto w-full space-y-3">
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {products.length === 0 && !error ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 text-center border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400">No products found in your shop.</p>
            <button 
              onClick={() => router.push("/add-product")}
              className="mt-4 text-sm font-bold text-black dark:text-white"
            >
              + Add Your First Product
            </button>
          </div>
        ) : (
          products.map((product) => (
            <button
              key={product.id}
              onClick={() => router.push(`/edit-products/${product.id}`)}
              className="w-full py-4 px-5 rounded-2xl bg-white dark:bg-zinc-900 text-left border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all active:scale-95 flex justify-between items-center group"
            >
              <div>
                <h3 className="font-bold text-black dark:text-white group-hover:underline">
                  {product.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                  {product.description}
                </p>
              </div>
              <span className="text-zinc-300 dark:text-zinc-700">✎</span>
            </button>
          ))
        )}
      </main>

      <footer className="py-8 text-center">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-medium">
          Manage Your Catalog
        </p>
      </footer>
    </div>
  );
}
