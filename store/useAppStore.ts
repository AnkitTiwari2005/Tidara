import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { getUserByPhone, upsertUserProfile, normalizePhone } from '../lib/supabase';

// ─── SecureStore Adapter ──────────────────────────────────────────────────────
const secureStoreAdapter = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch {
      // Non-fatal if storage fails
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {}
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName?: string;
  email?: string;
}

export interface Location {
  city: string;
  address: string;
  lat: number;
  lng: number;
  isServiceable: boolean;
  type?: 'Home' | 'Work' | 'Other';
}

export interface CartItem {
  serviceId: string;
  quantity: number;
  durationMinutes?: number;
  unitPrice?: number;
}

interface AppState {
  // ── Persisted state ──────────────────────────────────────────────────────
  user: User | null;
  isAuthenticated: boolean;
  location: Location | null;
  walletBalance: number;

  // ── Ephemeral state ──────────────────────────────────────────────────────
  cartItems: CartItem[];
  bookingMode: 'Instant' | 'Scheduled' | 'Recurring';
  scheduledDays: string[];
  scheduledSlot: string | null;
  couponApplied: boolean;
  couponCode: string | null;
  discountAmount: number;

  // ── Hydration flag ───────────────────────────────────────────────────────
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;

  // ── Actions ──────────────────────────────────────────────────────────────
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setLocation: (location: Location | null) => void;
  setWalletBalance: (balance: number) => void;
  
  // Cart Actions
  addToCart: (serviceId: string, durationMinutes?: number, unitPrice?: number) => void;
  removeFromCart: (serviceId: string) => void;
  clearCart: () => void;
  getCartCount: () => number;
  
  // Booking & Coupon Actions
  setBookingMode: (mode: 'Instant' | 'Scheduled' | 'Recurring') => void;
  setRecurringSchedule: (days: string[], slot: string) => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;

  logout: () => void;

  // ── Supabase sync ────────────────────────────────────────────────────────
  syncUserFromDB: (phone: string) => Promise<boolean>;
  saveUserToDB: (user: User) => Promise<{ success: boolean; error?: any }>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────
      user: null,
      isAuthenticated: false,
      location: null,
      walletBalance: 0,
      cartItems: [],
      bookingMode: 'Instant',
      scheduledDays: ['Mon', 'Wed', 'Fri'],
      scheduledSlot: '9:00 AM',
      couponApplied: false,
      couponCode: null,
      discountAmount: 0,
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      // ── Setters ────────────────────────────────────────────────────────
      setUser: (user) => set({ user, isAuthenticated: user !== null }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setLocation: (location) => set({ location }),
      setWalletBalance: (balance) => set({ walletBalance: balance }),

      // ── Cart ───────────────────────────────────────────────────────────
      addToCart: (serviceId, durationMinutes, unitPrice) => {
        const items = get().cartItems;
        const existingIndex = items.findIndex((i) => i.serviceId === serviceId);

        if (existingIndex > -1) {
          const updated = [...items];
          const curr = updated[existingIndex];
          updated[existingIndex] = {
            ...curr,
            quantity: curr.quantity + 1,
            durationMinutes: durationMinutes ?? curr.durationMinutes,
            unitPrice: unitPrice ?? curr.unitPrice,
          };
          set({ cartItems: updated });
        } else {
          set({
            cartItems: [
              ...items,
              {
                serviceId,
                quantity: 1,
                durationMinutes,
                unitPrice,
              },
            ],
          });
        }
      },

      removeFromCart: (serviceId) => {
        const items = get().cartItems;
        const existing = items.find((i) => i.serviceId === serviceId);
        if (existing && existing.quantity > 1) {
          set({
            cartItems: items.map((i) =>
              i.serviceId === serviceId ? { ...i, quantity: i.quantity - 1 } : i
            ),
          });
        } else {
          set({ cartItems: items.filter((i) => i.serviceId !== serviceId) });
        }
      },

      clearCart: () =>
        set({
          cartItems: [],
          couponApplied: false,
          couponCode: null,
          discountAmount: 0,
        }),

      getCartCount: () =>
        get().cartItems.reduce((sum, item) => sum + item.quantity, 0),

      // ── Booking Schedule & Coupon ──────────────────────────────────────
      setBookingMode: (mode) => set({ bookingMode: mode }),
      setRecurringSchedule: (days, slot) =>
        set({ scheduledDays: days, scheduledSlot: slot, bookingMode: 'Recurring' }),
      applyCoupon: (code, discount) =>
        set({ couponApplied: true, couponCode: code, discountAmount: discount }),
      removeCoupon: () =>
        set({ couponApplied: false, couponCode: null, discountAmount: 0 }),

      // ── Auth ───────────────────────────────────────────────────────────
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          cartItems: [],
          walletBalance: 0,
          couponApplied: false,
          couponCode: null,
          discountAmount: 0,
        });
      },

      // ── Supabase ───────────────────────────────────────────────────────
      syncUserFromDB: async (phone: string) => {
        try {
          const canonicalPhone = normalizePhone(phone);
          const { data, error } = await getUserByPhone(canonicalPhone);
          if (data && !error) {
            set({
              user: {
                id: data.id,
                phone: canonicalPhone,
                firstName: data.first_name,
                lastName: data.last_name ?? undefined,
                email: data.email ?? undefined,
              },
              walletBalance: Number(data.wallet_balance) || 0,
              isAuthenticated: true,
            });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      saveUserToDB: async (user: User) => {
        try {
          const canonicalPhone = normalizePhone(user.phone);
          // Only save profile attributes – never overwrite wallet balance from client!
          const { error } = await upsertUserProfile({
            id: user.id,
            phone: canonicalPhone,
            first_name: user.firstName,
            last_name: user.lastName,
            email: user.email,
          });
          return { success: !error, error };
        } catch (err: any) {
          return { success: false, error: err };
        }
      },
    }),
    {
      name: 'tidara-session',
      storage: createJSONStorage(() => secureStoreAdapter),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        location: state.location,
        walletBalance: state.walletBalance,
      }),
      onRehydrateStorage: () => (state, error) => {
        // Guarantee hydration flag is set even if reading storage throws
        useAppStore.setState({ _hasHydrated: true });
      },
    }
  )
);
