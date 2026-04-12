"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getProductById, updateProduct, deleteProduct } from "@/models/products";
import { getAllCategories } from "@/models/categories";
import { 
  getProductPrices, 
  createProductPrice, 
  updateProductPrice, 
  deleteProductPrice 
} from "@/models/product-prices";

export default function EditProductForm({ params }) {
  // We use React.use() to unwrap params in Next.js 15+ if needed, 
  // but for compatibility we'll access it directly or via use()
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [pictureUrl, setPictureUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [priceTiers, setPriceTiers] = useState([]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const [deletedPriceTierIds, setDeletedPriceTierIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleTierChange = (index, field, value) => {
    const newTiers = [...priceTiers];
    newTiers[index][field] = value;
    setPriceTiers(newTiers);
  };

  const addTier = () => {
    setPriceTiers([...priceTiers, { quantity: "", price: "" }]);
  };

  const removeTier = (index) => {
    const tier = priceTiers[index];
    if (tier.id) {
      setDeletedPriceTierIds([...deletedPriceTierIds, tier.id]);
    }
    setPriceTiers(priceTiers.filter((_, i) => i !== index));
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [product, allCategories, prices] = await Promise.all([
          getProductById(productId),
          getAllCategories(),
          getProductPrices(productId)
        ]);

        if (product) {
          setName(product.name);
          setDescription(product.description || "");
          setCategoryId(product.category_id);
          setPictureUrl(product.picture_url || "");
        }
        setCategories(allCategories);
        setPriceTiers(prices.length > 0 ? prices : [{ quantity: "", price: "" }]);
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
      let finalPictureUrl = pictureUrl;

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("file", imageFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadRes.ok) {
          throw new Error("Image upload failed");
        }

        const uploadResult = await uploadRes.json();
        finalPictureUrl = uploadResult.imageUrl;
      }

      await updateProduct(productId, {
        name,
        description,
        category_id: parseInt(categoryId),
        picture_url: finalPictureUrl,
      });

      // 1. Delete removed tiers
      for (const id of deletedPriceTierIds) {
        await deleteProductPrice(id);
      }

      // 2. Update existing or create new tiers
      for (const tier of priceTiers) {
        if (tier.quantity && tier.price) {
          if (tier.id) {
            await updateProductPrice(tier.id, {
              quantity: tier.quantity,
              price: parseFloat(tier.price),
            });
          } else {
            await createProductPrice({
              product_id: parseInt(productId),
              quantity: tier.quantity,
              price: parseFloat(tier.price),
            });
          }
        }
      }

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
                onChange={handleImageChange}
              />
              <label 
                htmlFor="product-image-upload"
                className="flex flex-col items-center justify-center w-full h-48 px-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all overflow-hidden"
              >
                {imagePreview || (pictureUrl && !pictureUrl.startsWith("placeholder")) ? (
                  <img src={imagePreview || pictureUrl} alt="Product" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-500 text-sm">Tap to upload product image</span>
                )}
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Price Tiers
              </label>
            </div>
            
            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="px-4 py-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider w-1/2">Quantity</th>
                    <th className="px-4 py-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider w-1/2">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {priceTiers.map((tier, index) => (
                    <tr key={index}>
                      <td className="p-2">
                        <input
                          required
                          type="text"
                          value={tier.quantity}
                          onChange={(e) => handleTierChange(index, "quantity", e.target.value)}
                          placeholder="e.g. 1 gram"
                          className="w-full px-2 py-2 bg-transparent text-black dark:text-white outline-none text-sm"
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1 px-2 py-2">
                          <span className="text-zinc-400 dark:text-zinc-500 text-sm">$</span>
                          <input
                            required
                            type="number"
                            step="0.01"
                            value={tier.price}
                            onChange={(e) => handleTierChange(index, "price", e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-transparent text-black dark:text-white outline-none text-sm"
                          />
                          {priceTiers.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => removeTier(index)}
                              className="text-zinc-300 hover:text-red-500 transition-colors"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="2" className="p-2 text-center bg-zinc-50/50 dark:bg-zinc-800/20">
                      <button
                        type="button"
                        onClick={addTier}
                        className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white text-xl font-bold transition-colors w-full py-1"
                      >
                        +
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
