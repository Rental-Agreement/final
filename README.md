# 🏠 Tenant Town Central - Premium Rental Platform

## 🚀 Quick Start

### Run the App
```sh
npm run dev
```

### Deploy Database Changes
```sh
# See: QUICK_START.md for 3-step deployment
# 1. Copy PASTE_IN_SUPABASE.sql to Supabase SQL Editor
# 2. npm install date-fns
# 3. npm run dev
```

---

## ✨ Features

This is a **world-class rental platform** with 21+ advanced features rivaling Booking.com, Airbnb, and OYO!

### 🎯 Core Features
- ✅ Multi-role system (Admin, Owner, Tenant)
- ✅ Property listings with multi-image upload
- ✅ Room & bed management
- ✅ Lease applications & approvals
- ✅ Payment processing with methods
- ✅ Dispute management system
- ✅ Reviews & ratings with aggregation

### 🆕 Advanced Features (Just Added!)
- ⚖️ **Property Comparison** - Compare up to 4 properties side-by-side
- 🕐 **Recently Viewed** - See your browsing history
- 💾 **Save Searches** - Save filters with email alerts
- 🔔 **Price Alerts** - Get notified when prices drop
- 🏷️ **Filter Chips** - Visual active filter tags
- 🖼️ **Enhanced Gallery** - Carousel with thumbnails & keyboard nav
- 📊 **View Tracking** - Analytics on property popularity
- 🏆 **User Badges** - Gamification achievements
- ✅ **Verified Owners** - Trust badges
- ⚡ **Instant Booking** - Fast-track reservations
- ⭐ **Featured Listings** - Premium properties
- 📈 **Popular Rankings** - Trending properties
- 👍 **Review Votes** - Helpful/not helpful on reviews
- 📸 **Property Photos** - Multiple images with captions
- 📅 **Availability Calendar** - Date-based booking
- 🗺️ **Neighborhoods** - Area guides & scores
- 🔍 **Similar Properties** - Smart recommendations
- 🎥 **Virtual Tours** - 360° & video support
- 🛡️ **Safety Scores** - Neighborhood ratings
- 🚶 **Walkability Scores** - Transit accessibility
- 🔗 **SEO Optimized** - Meta tags & social sharing

---

## 📁 Project Structure

```
tenant-town-central/
├── QUICK_START.md              ⚡ 3-step deployment guide
├── PASTE_IN_SUPABASE.sql       📋 Complete database migration
├── MIGRATION_INSTRUCTIONS.md   📖 Detailed SQL guide
├── COMPLETE_SUMMARY.md         📊 Full feature documentation
├── IMPLEMENTATION_GUIDE.md     🏗️ Architecture overview
├── src/
│   ├── hooks/
│   │   ├── use-property-views.ts      🕐 Recently viewed
│   │   ├── use-saved-searches.ts      💾 Save searches
│   │   ├── use-comparison.ts          ⚖️ Property comparison
│   │   ├── use-price-alerts.ts        🔔 Price drop alerts
│   │   ├── use-auth.ts
│   │   ├── use-properties.ts
│   │   ├── use-leases.ts
│   │   ├── use-payments.ts
│   │   └── use-reviews.ts
│   ├── components/
│   │   ├── PropertyComparisonModal.tsx       ⚖️ Side-by-side comparison
│   │   ├── RecentlyViewedSection.tsx         🕐 View history
│   │   ├── SaveSearchDialog.tsx              💾 Save filters
│   │   ├── FilterChips.tsx                   🏷️ Active filters UI
│   │   ├── ImageCarouselWithThumbnails.tsx   🖼️ Enhanced gallery
│   │   ├── PropertyCard.tsx                  🏠 Property display
│   │   ├── LeaseCard.tsx
│   │   └── ui/                              shadcn/ui components
│   ├── pages/
│   │   ├── TenantDashboard.tsx              🏘️ Tenant interface
│   │   ├── OwnerDashboard.tsx               🏢 Owner interface
│   │   ├── AdminDashboard.tsx               👑 Admin interface
│   │   └── Auth.tsx                         🔐 Login/Register
│   └── integrations/supabase/               🗄️ Database client
├── supabase/
│   └── migrations/                          SQL migrations
└── public/                                  Static assets
```

---

## 🗄️ Database Schema

### Core Tables
- `users` - User accounts (admin, owner, tenant)
- `properties` - Property listings
- `rooms` - Rooms within properties
- `beds` - Beds within rooms
- `leases` - Rental agreements
- `transactions` - Payment records
- `payment_methods` - User payment options
- `disputes` - Issue tracking
- `reviews` - Property reviews

### New Tables (Advanced Features)
- `property_photos` - Image gallery with captions
- `review_votes` - Helpful/not helpful votes
- `saved_searches` - User search criteria
- `property_views` - View tracking
- `property_comparisons` - Comparison lists
- `price_alerts` - Price drop notifications
- `property_availability` - Booking calendar
- `neighborhoods` - Area information
- `user_badges` - Achievements

### Enhanced Columns
**Properties:**
- `view_count`, `verified_owner`, `instant_booking`
- `featured`, `popular_rank`, `virtual_tour_url`
- `safety_score`, `walkability_score`, `neighborhood`
- And 15+ more!

**Reviews:**
- `photos`, `helpful_count`, `verified_booking`
- `stay_date`, `response`, `response_date`

---

## 🎨 Tech Stack

- ⚛️ **React 18** - UI framework
- 📘 **TypeScript** - Type safety
- ⚡ **Vite** - Build tool
- 🎨 **Tailwind CSS** - Styling
- 🗄️ **Supabase** - Backend (PostgreSQL + Auth + Storage + Realtime)
- 🔄 **TanStack Query** - Data fetching & caching
- 🎭 **shadcn/ui** - Component library
- 🖼️ **Embla Carousel** - Image galleries
- 📅 **date-fns** - Date formatting
- 🔐 **Row Level Security** - Database security

---

## 🚀 Deployment

### 1. Database Setup
```sh
# Copy PASTE_IN_SUPABASE.sql to Supabase SQL Editor and run
# This creates all tables, columns, indexes, triggers, and functions
```

### 2. Environment Variables
```sh
# .env.local
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & Run
```sh
npm install
npm run dev
```

---

## 📚 Documentation

- **QUICK_START.md** - Get started in 3 steps
- **MIGRATION_INSTRUCTIONS.md** - Detailed database setup
- **COMPLETE_SUMMARY.md** - All features explained
- **IMPLEMENTATION_GUIDE.md** - Architecture details

---

## 🎯 User Roles

### 👤 Tenant
- Browse properties with advanced filters
- Compare properties side-by-side
- Save searches with email alerts
- Set price drop alerts
- View property details & galleries
- Apply for leases
- Make payments
- Submit reviews & vote on reviews
- Earn badges for activity

### 🏢 Owner
- List properties with photos
- Manage rooms & beds
- Approve/reject lease applications
- View analytics (views, bookings)
- Mark properties as verified/instant booking
- Feature properties (premium)
- Respond to reviews
- Set availability calendar

### 👑 Admin
- Full system oversight
- Approve properties
- Manage all users
- Resolve disputes
- View platform analytics
- Award badges
- Manage neighborhoods

---

## Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/6c1e9740-b9a2-4fe3-a9bd-98bb74c056c6

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/6c1e9740-b9a2-4fe3-a9bd-98bb74c056c6) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/6c1e9740-b9a2-4fe3-a9bd-98bb74c056c6) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
