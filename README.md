# 🌿 Tidara — On-Demand Home Services Platform

<div align="center">

![Tidara Banner](https://img.shields.io/badge/Tidara-Home%20Services-0B5335?style=for-the-badge&logo=homeadvisor&logoColor=white)
<br/>

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2058.0-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.88.1-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend%20%26%20Edge%20Functions-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment%20Gateway-0C2340?style=flat-square&logo=razorpay&logoColor=white)](https://razorpay.com)
[![Whatsy](https://img.shields.io/badge/WhatsApp-OTP%20%26%20Notifications-25D366?style=flat-square&logo=whatsapp&logoColor=white)](https://whatsapp.com)

**Fast, reliable, and verified home services at your doorstep within 15 minutes.**

[Key Features](#-key-features) • [Security & Architecture](#-security--architecture) • [Project Structure](#-project-structure) • [Edge Functions & Backend](#-edge-functions--backend) • [Getting Started](#-getting-started) • [EAS Cloud Builds](#-eas-cloud-builds)

</div>

---

## 📖 Overview

**Tidara** is a production-grade, on-demand home services mobile application built with **React Native**, **Expo SDK 58**, and **Supabase**. It delivers an instant-booking experience similar to rapid delivery platforms—connecting homeowners with verified professionals for deep cleaning, AC repair, plumbing, appliance servicing, festive packages, and emergency maintenance.

### 🌟 Core Highlights
- ⚡ **Express 15-Minute Dispatch:** On-demand professional arrival tracking with recurring and custom scheduling slots.
- 💬 **Frictionless WhatsApp Authentication:** Passwordless 6-digit WhatsApp OTP verification with canonical phone formatting.
- 📲 **Automated WhatsApp Order Updates:** Asynchronous customer alerts on WhatsApp for booking confirmations and cancellations.
- 💳 **Triple-Mode Payment System:** Support for **Razorpay** (UPI, GPay, PhonePe, Cards), **Tidara In-App Wallet** (with 5% cashback credit bonus), and **Cash on Delivery (COD)**.
- 🎟️ **Tidara Pass Subscription:** In-app membership passes unlocking discounted multi-visit service credits.
- 📍 **Smart Location Engine:** GPS-based location detection with offline caching and comprehensive address book management.

---

## 🛡️ Security & Architecture

Tidara adheres to a strict **Zero-Secret Client Architecture**. Sensitive API credentials and payment secrets are **never compiled into the mobile APK**, preventing reverse-engineering or quota abuse.

```mermaid
flowchart TD
    subgraph MobileApp["📱 Mobile Client (Tidara App)"]
        UI["React Native UI / Expo Router"]
        Zustand["Zustand App Store (Local Persistence)"]
        SupaClient["@supabase/supabase-js (Anon Key Only)"]
    end

    subgraph SupabaseCloud["⚡ Supabase Cloud Platform"]
        Postgres[("PostgreSQL Database with RLS")]
        EdgeOTP["Edge Function: whatsy-otp"]
        EdgePay["Edge Function: razorpay-order"]
        Vault[("Supabase Secrets Vault")]
    end

    subgraph ExternalServices["🌐 External Gateways"]
        Whatsy["Whatsy WhatsApp API Gateway"]
        RazorpayAPI["Razorpay Orders REST API"]
    end

    UI --> SupaClient
    SupaClient -->|Direct Query with RLS| Postgres
    SupaClient -->|Invoke Functions| EdgeOTP
    SupaClient -->|Invoke Functions| EdgePay

    Vault -.->|Inject WHATSY_API_KEY| EdgeOTP
    Vault -.->|Inject RAZORPAY_KEY_SECRET| EdgePay

    EdgeOTP -->|POST /api/v1/otp & /messages| Whatsy
    EdgePay -->|POST /v1/orders (Basic Auth)| RazorpayAPI
```

### Key Security Measures
1. **Edge-Isolated Credentials:** `WHATSY_API_KEY` and `RAZORPAY_KEY_SECRET` reside exclusively in Supabase Secrets Vault. The client app only uses the public Supabase Anon key and Razorpay Key ID.
2. **PostgreSQL Row Level Security (RLS):** All tables (`users`, `bookings`, `addresses`, `wallet_transactions`) enforce authenticated and authorized data boundaries.
3. **Database-Managed UUIDs:** Booking IDs and User IDs are generated via PostgreSQL `gen_random_uuid()` rather than untrusted client timestamps.
4. **Non-Blocking Background Dispatch:** WhatsApp customer alerts are fired asynchronously so external gateway delays never affect checkout or booking transactions.

---

## ✨ Key Features

### 1. WhatsApp OTP Login & Registration
- Standardized canonical Indian E.164 phone normalization (`+91XXXXXXXXXX`).
- 6-digit OTP autofill (`textContentType="oneTimeCode"`, `autoComplete="sms-otp"`).
- Strict boolean verification preventing fail-open authentication.
- Single-page profile setup for first-time onboarding.

### 2. Multi-Option Checkout
- **Razorpay Online:** Integrated via sandboxed, script-injected `WebView` modal with automatic success and failure handlers.
- **Tidara Wallet:** Instant balance deduction with automatic balance synchronization and transaction logging.
- **Cash / UPI on Delivery:** Hassle-free booking confirmation with zero upfront payment.

### 3. Real-Time WhatsApp Notifications
- **Booking Confirmed:** Dispatches detailed appointment summary (Services, Scheduled Time, Address, Amount, Payment Method) directly to the user's WhatsApp.
- **Booking Cancelled:** Dispatches instant cancellation acknowledgement with refund timeline notices.

### 4. Booking & Order Management
- View active **Upcoming** and **Previous** bookings.
- Detailed modal overview including service duration, execution slot, and address.
- 1-tap Free Cancellation with instant status update.

---

## 📁 Project Structure

```text
tidara/
├── app/                          # Expo Router navigation routes
│   ├── (auth)/                   # Authentication flow
│   │   ├── login.tsx             # Phone number entry & terms
│   │   ├── otp.tsx               # 6-digit WhatsApp OTP verification
│   │   └── profile-setup.tsx     # First-time profile details
│   ├── (onboarding)/             # Onboarding & permissions
│   │   └── location.tsx          # GPS location permission & setup
│   ├── (tabs)/                   # Core bottom tab navigation
│   │   ├── _layout.tsx           # Tab bar styling & badges
│   │   ├── index.tsx             # Home screen (Categories, Express, Passes)
│   │   ├── bookings.tsx          # Booking history & cancellation
│   │   └── money.tsx             # Tidara Wallet top-up & ledger
│   ├── category/                 # Dynamic category services breakdown
│   ├── payment.tsx               # Checkout, payment selector & booking creation
│   ├── profile.tsx               # User profile, addresses & notification status
│   ├── add-address.tsx           # New delivery address form
│   └── help.tsx                  # 24/7 Support & WhatsApp helpdesk
├── components/                   # Reusable UI components
│   ├── GlobalAlertModal.tsx      # Unified branded dialog modal
│   ├── RazorpayWebView.tsx       # Secure WebView payment checkout
│   └── ErrorBoundary.tsx         # Global error fallback component
├── constants/                    # Theme, styles & static catalogs
│   ├── colors.ts                 # Brand green palette, typography & helpers
│   └── services.ts               # Complete home service catalogs & pricing
├── lib/                          # Client-side integration libraries
│   ├── supabase.ts               # Supabase client & database CRUD operations
│   ├── razorpay.ts               # Secure order creation & WebView HTML generator
│   └── whatsy.ts                 # WhatsApp OTP & notification client wrappers
├── store/                        # State management
│   └── useAppStore.ts            # Zustand store (Auth, Cart, Wallet, Location)
├── supabase/                     # Backend infrastructure
│   ├── schema.sql                # Complete PostgreSQL schema, tables & RLS policies
│   └── functions/                # Deno Edge Functions
│       ├── whatsy-otp/           # Proxies OTP send/verify and notifications
│       └── razorpay-order/       # Authenticated order creation with Razorpay
├── app.json                      # Expo configuration & Android permissions
├── eas.json                      # EAS Build profiles (preview, production)
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## ⚡ Edge Functions & Backend

### 1. Deployed Edge Functions

| Function Name | Route | Supported Actions / Methods | Description |
| :--- | :--- | :--- | :--- |
| **`whatsy-otp`** | `/functions/v1/whatsy-otp` | `send`, `verify`, `send-notification` | Proxies WhatsApp OTPs & booking update alerts via Whatsy. |
| **`razorpay-order`** | `/functions/v1/razorpay-order` | `POST` | Generates official Razorpay orders with server-side secrets. |

### 2. Required Supabase Secrets Vault Keys

Configure these in **Supabase Dashboard ➔ Project Settings ➔ Edge Functions ➔ Secrets**:

| Secret Key | Description | Example / Environment |
| :--- | :--- | :--- |
| `WHATSY_API_KEY` | Whatsy API Gateway Key | `NW7tDgtm...` |
| `WHATSY_BASE` | Whatsy Base URL | `https://honeydew-butterfly-241889.hostingersite.com` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_...` (or `rzp_live_...`) |
| `RAZORPAY_KEY_SECRET` | Razorpay Secret Key | `ldQc4Yaz...` |

### 3. Automated Keep-Alive Cron Jobs

To prevent free-tier inactivity sleeping, two automated jobs run via [cron-job.org](https://cron-job.org):
1. **Whatsy Keep-Alive:** Pings `https://honeydew-butterfly-241889.hostingersite.com/api/v1/status` every 5 minutes.
2. **Supabase Keep-Alive:** Queries `https://<project-ref>.supabase.co/rest/v1/users?select=id&limit=1` daily with `apikey` header.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- [npm](https://www.npmjs.com/) or [Bun](https://bun.sh/)
- [EAS CLI](https://docs.expo.dev/eas/): `npm install -g eas-cli`
- [Expo Go](https://expo.dev/go) or Android Emulator / Physical Device

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/AnkitTiwari2005/Tidara.git
cd Tidara
npm install
```

### 2. Verify TypeScript Compilation
```bash
npm run typecheck
```
*(Should pass with 0 errors).*

### 3. Start Development Server
```bash
npm start
# or
npx expo start
```
Scan the QR code with **Expo Go** (Android) or press `a` for Android Emulator.

---

## 📦 EAS Cloud Builds

The project is configured for cloud builds via **Expo Application Services (EAS)**.

### Build Android Preview APK (Installable on any Android device):
```bash
eas build --platform android --profile preview
```

### Build Production Android App Bundle (.aab for Google Play Store):
```bash
eas build --platform android --profile production
```

---

## 🔒 Security Audit & Hardening Changelog

This repository has completed a comprehensive code audit and hardening review:
- **Zero-Secret Client:** Extracted all external API secrets from mobile code into Supabase Edge Functions.
- **Fail-Closed OTP:** Replaced lenient response parsing with strict boolean data verification.
- **Safe State Transitions:** Disallowed premature authentication flags before user profile registration completes.
- **ISO 8601 Database Timestamps:** Standardized scheduling fields to valid timestamps, moving human labels to metadata.
- **Cart Uniqueness Guard:** Resolved duplicate item collisions by scoping uniqueness across `service_id` and duration variants.
- **Database-Level Wallet Checks:** Added PostgreSQL constraints (`wallet_balance >= 0`) and atomic ledger tables to eliminate double-spend vulnerabilities.

---

## 📄 License

This software is proprietary and confidential.  
© 2026 **Tidara Technologies Private Limited**. All Rights Reserved.
