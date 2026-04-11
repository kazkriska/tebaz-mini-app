"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function Home() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if Telegram WebApp is available
    if (
      typeof window !== "undefined" &&
      window.Telegram &&
      window.Telegram.WebApp
    ) {
      const tg = window.Telegram.WebApp;

      // Expand the app to full height
      tg.expand();

      // Get user data from initDataUnsafe
      const userData = tg.initDataUnsafe?.user;

      if (userData) {
        setUser(userData);
      } else {
        setError("User data not found. Are you opening this from Telegram?");
      }
    } else {
      setError("Telegram WebApp API not found.");
    }
  }, []);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <main className="flex w-full max-w-md flex-col items-center gap-8 rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-900 sm:p-12">
        {/* <Image
          className="dark:invert mb-4"
          src="/next.svg"
          alt="Next.js logo"
          width={120}
          height={24}
          priority
        /> */}

        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-zinc-50">
            Welcome to TeBaz
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            The Telegram Bazaar
          </p>
        </div>

        <div className="w-full space-y-4">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50 border-b pb-2 dark:border-zinc-800">
            User Information
          </h2>

          {user ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-500">ID:</span>
                <span className="font-mono font-medium text-black dark:text-zinc-200">
                  {user.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-500">
                  First Name:
                </span>
                <span className="font-medium text-black dark:text-zinc-200">
                  {user.first_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-500">
                  Last Name:
                </span>
                <span className="font-medium text-black dark:text-zinc-200">
                  {user.last_name || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-500">
                  Username:
                </span>
                <span className="font-medium text-black dark:text-zinc-200">
                  @{user.username || "N/A"}
                </span>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              {error}
            </div>
          ) : (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-400"></div>
            </div>
          )}
        </div>

        <div className="w-full pt-4">
          <button
            className="w-full rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
            onClick={() => window?.Telegram?.WebApp?.close()}
          >
            Close Mini App
          </button>
        </div>
      </main>
    </div>
  );
}
