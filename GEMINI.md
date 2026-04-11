# Project: TeBaz (Telegram Bazaar)

## Overview
This project is a multi-store e-commerce platform built with Next.js, specifically designed as a Telegram Mini App.

## Technical Goals & Constraints
- **Mobile-First Design:** The frontend is optimized exclusively for mobile devices to ensure a native-like experience within Telegram.
- **Telegram Integration:** The app leverages the Telegram Web Apps API (`https://telegram.org/js/telegram-web-app.js`) for seamless interaction between the mini app and the Telegram client.
- **Client-Side Rendering:** Frequent use of client-side logic is required to access the `window.Telegram` object and its methods.

## Guidelines
- Always prioritize mobile-responsive UI components.
- Ensure that components using Telegram features are handled with appropriate client-side checks (e.g., `useEffect` or `'use client'` directive) to avoid SSR errors.
