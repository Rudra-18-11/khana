# 🍲 KHANA - Food Delivery Mobile App

A modern, high-performance food delivery mobile application built using **React Native**, **Expo (SDK 58)**, **Expo Router v4**, **Zustand**, and **Supabase**.

---

## 🚀 Key Features Built (PRD v1.0 Alignment)

### 1. Discovery & Home Feed
- **Location & Address Selector:** Automatically detects location via `expo-location` and allows switching between saved addresses (Home, Work, Other).
- **Offers & Promotions Carousel:** Interactive promo banners with coupon codes (`WELCOME50`, `FEAST120`, `FREEDEL`).
- **"What's on your mind?" Category Circles:** Instant category filtering (Biryani, Pizza, Burgers, North Indian, Rolls, Chinese, Desserts, Chai).
- **Multi-parameter Filter Bar:** Pure Veg toggle, Ratings 4.0+, Offers, Fast Delivery (<25 mins), and Price sorting.
- **"Order Again" Carousel:** Quick reorder row populated from completed orders.
- **Rich Restaurant Cards:** Swiggy-style cards with images, discount badges, green star ratings, ETA pills, distance in km, cuisines, and cost for two.

### 2. Search & Autocomplete
- **Instant Debounced Search:** Real-time search across restaurant names and dish items.
- **Tabbed Results:** Filter by "All", "Restaurants", or "Dishes".
- **Direct Dish Ordering:** Add dishes directly from search results with instant customization options.
- **Popular / Trending Searches:** Quick-tap tags for popular items.

### 3. Restaurant Details & Menu
- **Restaurant Header:** Cover image, rating breakdown, open/closed status, distance, delivery time, and cost for two.
- **Veg / Non-Veg Standard Badges:** Official green and crimson food icons.
- **Categorized Sticky Menu:** Menu categorized into Handi Biryani, Kebabs, Starters, Pizzas, Desserts, etc.
- **Dish Customization Bottom Sheet:** Select sizes (Regular, Large) and optional add-ons (extra cheese, raita, dips) with live price updates.
- **Quantity Steppers:** Seamless `[-]  [qty]  [+]` stepper buttons.
- **Single Restaurant Cart Conflict Guard:** Prompts confirmation dialog if user attempts to add items from a second restaurant without clearing previous items.

### 4. Cart & Dynamic Bill Engine
- **Item Summary:** Quantity adjustments, customization labels, and item removal.
- **Cooking Instructions Note:** Custom notes (e.g., "less spicy", "extra tissues").
- **Coupon & Promo Engine:** Real-time coupon application with minimum order validation, flat/percentage discounts, and maximum discount caps.
- **Itemized Bill Breakdown:**
  - Item Total
  - Delivery Fee (Free for orders above ₹299 or with promo)
  - Taxes & Platform Charges (5% GST + ₹5 platform fee)
  - Coupon Discounts
  - Driver Tip Selector (₹20, ₹30, ₹50, or custom)
  - Grand Total
- **Persistent Storage:** Cart state survives app restarts via `AsyncStorage`.

### 5. Checkout & Secure Payment
- **Address Confirmation:** Selected delivery destination summary.
- **Payment Methods:**
  - UPI (Google Pay, PhonePe, Paytm)
  - Credit / Debit Cards
  - Cash on Delivery (COD)
- **Order Placement:** Idempotent order creation with auto-generated order IDs (`SWG-xxxx`) and delivery OTPs.

### 6. Live Order Tracking & Simulation
- **Live Lifecycle Timeline:**
  `Placed` → `Accepted` → `Preparing` → `Out for Delivery` → `Delivered`
- **Interactive Visual Route Tracker:** Animated road route showing driver progressing from restaurant to customer.
- **Rider Card:** Rider avatar, name, rating, vehicle registration number, and 1-tap phone call button.
- **Delivery PIN / OTP Verification:** Displayed securely for contact-less delivery.
- **Order Cancellation:** Customers can cancel before the restaurant accepts the order.
- **Status Simulation Controls:** Built-in simulation buttons to preview real-time order lifecycle stages.

### 7. Orders History & Ratings
- **Active Orders Card:** Direct access to track ongoing deliveries.
- **Past Orders History:** Complete order itemization, date/time, total bill, and invoice summary.
- **One-Click Reorder:** Instantly repopulates cart with past items.
- **5-Star Rating System:** Rate restaurant and delivery experience.

### 8. Role-Based Access (PRD FR-2)
- Built-in role switcher in Profile (`customer`, `restaurant`, `delivery`, `admin`) to simulate Clerk user metadata roles.

---

## 🛠️ Tech Stack & Architecture

- **Mobile Framework:** [Expo SDK 58](https://docs.expo.dev/) (React Native 0.88+)
- **Routing:** [Expo Router v4](https://docs.expo.dev/router/introduction/) (File-based routes in `src/app/`)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) with modular stores:
  - `useAuthStore`
  - `useAddressStore`
  - `useCartStore` (Persisted)
  - `useFilterStore`
  - `useOrderStore` (Persisted)
- **Database & Realtime:** [Supabase](https://supabase.com/) (`supabase/schema.sql` included with full RLS policies & tables)
- **Icons:** `lucide-react-native` + `react-native-svg`
- **Location:** `expo-location`

---

## 📁 Project Directory Structure

```text
food-app/
├── assets/                       # App icons & images
├── src/
│   ├── app/                      # Expo Router File-Based Screens
│   │   ├── _layout.tsx           # Root navigation layout
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx       # Bottom tab navigator
│   │   │   ├── index.tsx         # Home & Restaurant Feed screen
│   │   │   ├── search.tsx        # Search dishes & restaurants
│   │   │   ├── orders.tsx        # Orders history & reorder
│   │   │   └── profile.tsx       # User profile & role switcher
│   │   ├── restaurant/
│   │   │   └── [id].tsx          # Restaurant menu & details
│   │   ├── cart.tsx              # Cart & promo codes screen
│   │   ├── checkout.tsx          # Payment & address confirmation
│   │   ├── track/
│   │   │   └── [id].tsx          # Live order tracker & rider map
│   │   └── address.tsx           # Saved addresses manager
│   ├── components/               # Reusable Modular UI Components
│   │   ├── BannerCarousel.tsx
│   │   ├── BillBreakdown.tsx
│   │   ├── CategoryBar.tsx
│   │   ├── CustomizationModal.tsx
│   │   ├── DishItem.tsx
│   │   ├── FilterBar.tsx
│   │   ├── FloatingCart.tsx
│   │   ├── Header.tsx
│   │   ├── OrderStatusTimeline.tsx
│   │   ├── RestaurantCard.tsx
│   │   └── VegBadge.tsx
│   ├── constants/
│   │   └── theme.ts              # Brand colors (#FC8019), spacing, shadows
│   ├── services/
│   │   ├── locationService.ts    # GPS & geocoding service
│   │   ├── mockData.ts           # Indian restaurant & food seed data
│   │   └── supabase.ts           # Supabase client with offline fallback
│   ├── stores/                   # Zustand State Machines
│   │   ├── useAddressStore.ts
│   │   ├── useAuthStore.ts
│   │   ├── useCartStore.ts
│   │   ├── useFilterStore.ts
│   │   └── useOrderStore.ts
│   └── types/
│       └── index.ts              # Complete TypeScript interfaces
├── supabase/
│   └── schema.sql                # Complete PostgreSQL Supabase Schema
├── .env.example                  # Environment credentials template
├── app.json                      # Expo configuration
├── package.json
└── tsconfig.json
```

---

## 🏃 Running the Application

### 1. Start the Expo Dev Server
```bash
npx expo start
```

### 2. Run on Mobile or Web
- **Android:** Press `a` in terminal or scan QR code using Expo Go.
- **iOS:** Press `i` in terminal or scan QR code with Camera.
- **Web:** Press `w` in terminal to run the responsive web preview.

### 3. Type Check & Linting
```bash
npx tsc --noEmit
```
