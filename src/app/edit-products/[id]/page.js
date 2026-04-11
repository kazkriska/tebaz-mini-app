"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getProductById, updateProduct, deleteProduct } from "@/models/products";
import { getAllCategories } from "@/models/categories";

export default function EditProductForm({ params }) {
  // We use React.use() to unwrap params in Next.js 15+ if needed, 
  // but for compatibility we'll access it directly or via use()
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [product, allCategories] = await Promise.all([
          getProductById(productId),
          getAllCategories()
        ]);

        if (product) {
          setName(product.name);
          setDescription(product.description || "");
          setCategoryId(product.category_id);
        }
        setCategories(allCategories);
      } catch (err) {
        console.error("Error loading product data:", err);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [productId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await updateProduct(productId, {
        name,
        description,
        category_id: parseInt(categoryId),
      });
      router.push("/edit-products");
    } catch (err) {
      console.error("Error updating product:", err);
      setError("Failed to update product.");
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setSubmitting(true);
    try {
      await deleteProduct(productId);
      router.push("/edit-products");
    } catch (err) {
      console.error("Error deleting product:", err);
      setError("Failed to delete product.");
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
          ← Cancel
        </button>
        <h1 className="text-2xl font-bold text-black dark:text-zinc-50 mt-4">
          Edit Product
        </h1>
      </header>

      <main className="flex-1 max-w-sm mx-auto w-full">
        <form onSubmit={handleSave} className="space-y-6">
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
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all resize-none"
            />
          </div>

          <div className="pt-4 space-y-3">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 px-6 rounded-2xl font-bold shadow-lg transition-all active:scale-95 text-lg ${
                submitting 
                  ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed" 
                  : "bg-black dark:bg-zinc-50 text-white dark:text-black"
              }`}
            >
              {submitting ? "Saving Changes..." : "Save Changes"}
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={handleDelete}
              className="w-full py-4 px-6 rounded-2xl font-bold text-red-600 dark:text-red-400 transition-all active:scale-95 text-lg border border-red-200 dark:border-red-900/30"
            >
              Delete Product
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
