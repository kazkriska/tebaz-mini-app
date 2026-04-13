"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getVendorByTgId } from "@/models/vendors";
import { getShopsByVendor, updateShop, deleteShop } from "@/models/shops";
import { getPublicImageUrl } from "@/lib/image-utils";

export default function EditShop() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [shopId, setShopId] = useState(null);
  const [initialShopName, setInitialShopName] = useState("");
  const [showDeleteConfirm1, setShowDeleteConfirm1] = useState(false);
  const [showDeleteConfirm2, setShowDeleteConfirm2] = useState(false);
  const [confirmShopName, setConfirmShopName] = useState("");

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
              setInitialShopName(shop.name);
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

  const handleDelete = async () => {
    if (!shopId) return;
    setSubmitting(true);
    try {
      await deleteShop(shopId);
      router.push("/");
    } catch (err) {
      console.error("Error deleting shop:", err);
      setError("Failed to delete shop.");
      setShowDeleteConfirm2(false);
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

          {!submitting && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm1(true)}
              className="w-full py-3 px-6 rounded-2xl font-bold text-red-600 dark:text-red-500 border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 transition-all active:scale-95 mt-2"
            >
              Delete Shop
            </button>
          )}
        </form>
      </main>

      {/* First Confirmation Popup */}
      {showDeleteConfirm1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-black dark:text-white">Delete Shop?</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
              Are you sure you want to delete this shop? This action cannot be undone and all data will be lost.
            </p>
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteConfirm1(false);
                  setShowDeleteConfirm2(true);
                }}
                className="w-full py-3 px-6 rounded-xl bg-red-600 text-white font-bold transition-all active:scale-95"
              >
                Yes, delete it
              </button>
              <button
                onClick={() => setShowDeleteConfirm1(false)}
                className="w-full py-3 px-6 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold transition-all active:scale-95"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Second Confirmation Popup (Type to Confirm) */}
      {showDeleteConfirm2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-black dark:text-white">Verify Deletion</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">
              Please type <span className="font-bold text-black dark:text-white">{initialShopName}</span> to confirm deletion.
            </p>
            <input
              autoFocus
              type="text"
              value={confirmShopName}
              onChange={(e) => setConfirmShopName(e.target.value)}
              placeholder="Type shop name"
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-black dark:text-white mt-4 outline-none focus:ring-2 focus:ring-red-600 transition-all"
            />
            <div className="flex flex-col gap-3 mt-6">
              <button
                disabled={confirmShopName !== initialShopName || submitting}
                onClick={handleDelete}
                className={`w-full py-3 px-6 rounded-xl font-bold transition-all active:scale-95 ${
                  confirmShopName === initialShopName && !submitting
                    ? "bg-red-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                }`}
              >
                {submitting ? "Deleting..." : "Confirm Delete"}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm2(false);
                  setConfirmShopName("");
                }}
                className="w-full py-3 px-6 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-8 text-center">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-medium">
          TeBaz Shop Management
        </p>
      </footer>
    </div>
  );
}
