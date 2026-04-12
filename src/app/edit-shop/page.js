"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getVendorByTgId } from "@/models/vendors";
import { getShopsByVendor, updateShop } from "@/models/shops";
import { getPublicImageUrl } from "@/lib/image-utils";

export default function EditShop() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [shopId, setShopId] = useState(null);

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchShopData() {
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
              const shop = shops[0]; // For now, assume one shop per vendor
              setShopId(shop.id);
              setName(shop.name);
              setDescription(shop.description || "");
              setBannerUrl(shop.banner_url || "");
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
        console.error("Error fetching shop data:", err);
        setError("Failed to load shop details.");
      } finally {
        setLoading(false);
      }
    }

    fetchShopData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopId) {
      setError("No shop identified for update.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let finalBannerUrl = bannerUrl;

      if (bannerFile) {
        const uploadData = new FormData();
        uploadData.append("file", bannerFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadRes.ok) {
          throw new Error("Banner upload failed");
        }

        const uploadResult = await uploadRes.json();
        finalBannerUrl = uploadResult.imageUrl;
      }

      await updateShop(shopId, {
        name,
        description,
        banner_url: finalBannerUrl,
      });
      router.push("/");
    } catch (err) {
      console.error("Error updating shop:", err);
      setError(err.message || "Failed to update shop. Please try again.");
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
          Edit Shop Info
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Update your shop's primary details
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
                onChange={handleBannerChange}
              />
              <label 
                htmlFor="banner-upload"
                className="flex flex-col items-center justify-center w-full h-48 px-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all overflow-hidden"
              >
                {bannerPreview || (bannerUrl && !bannerUrl.startsWith("placeholder")) ? (
                  <img src={bannerPreview || getPublicImageUrl(bannerUrl)} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-500 text-sm">Tap to upload banner</span>
                )}
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-4 px-6 rounded-2xl font-bold shadow-lg transition-all active:scale-95 text-lg mt-4 ${
              submitting 
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed" 
                : "bg-black dark:bg-zinc-50 text-white dark:text-black"
            }`}
          >
            {submitting ? "Saving Changes..." : "Save Changes"}
          </button>
        </form>
      </main>

      <footer className="py-8 text-center">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-medium">
          TeBaz Shop Management
        </p>
      </footer>
    </div>
  );
}
