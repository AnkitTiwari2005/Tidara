import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { getUserByPhone, upsertUserProfile } from '../lib/supabase';

// ─── SecureStore Adapter ──────────────────────────────────────────────────────
// expo-secure-store is key/value with a 2048-byte per-value limit for some
// devices, but our session payload is tiny so it's perfectly fine.
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
      // silently fail — app still works, just won't persist
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {}
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName?: string;
  email?: string;
}

interface Location {
  city: string;
  address: string;
  lat: number;
  lng: number;
  isServiceable: boolean;
}

interface AppState {
  // ── Persisted state ──────────────────────────────────────────────────────
  user: User | null;
  isAuthenticated: boolean;
  location: Location | null;
  walletBalance: number;

  // ── Ephemeral (not persisted) ────────────────────────────────────────────
  cartItems: { serviceId: string; quantity: number }[];

  // ── Hydration flag ───────────────────────────────────────────────────────
  // Set to true once the persist middleware has finished reading SecureStore.
  // Use this in your root layout to avoid flashing the wrong screen.
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;

  // ── Actions ──────────────────────────────────────────────────────────────
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setLocation: (location: Location) => void;
  setWalletBalance: (balance: number) => void;
  addToCart: (serviceId: string) => void;
  removeFromCart: (serviceId: string) => void;
  clearCart: () => void;
  getCartCount: () => number;
  logout: () => void;

  // ── Supabase sync ────────────────────────────────────────────────────────
  syncUserFromDB: (phone: string) => Promise<void>;
  saveUserToDB: (user: User) => Promise<void>;
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
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      // ── Setters ────────────────────────────────────────────────────────
      setUser: (user) => set({ user }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setLocation: (location) => set({ location }),
      setWalletBalance: (balance) => set({ walletBalance: balance }),

      // ── Cart ───────────────────────────────────────────────────────────
      addToCart: (serviceId) => {
        const items = get().cartItems;
        const existing = items.find((i) => i.serviceId === serviceId);
        if (existing) {
          set({
            cartItems: items.map((i) =>
              i.serviceId === serviceId ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({ cartItems: [...items, { serviceId, quantity: 1 }] });
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

      clearCart: () => set({ cartItems: [] }),

      getCartCount: () =>
        get().cartItems.reduce((sum, item) => sum + item.quantity, 0),

      // ── Auth ───────────────────────────────────────────────────────────
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          cartItems: [],
          walletBalance: 0,
        });
      },

      // ── Supabase ───────────────────────────────────────────────────────
      syncUserFromDB: async (phone: string) => {
        try {
          const { data } = await getUserByPhone(phone);
          if (data) {
            set({
              user: {
                id: data.id,
                phone: data.phone,
                firstName: data.first_name,
                lastName: data.last_name,
                email: data.email,
              },
              walletBalance: data.wallet_balance ?? 0,
              isAuthenticated: true,
            });
          }
        } catch {
          // Network error — keep existing session
        }
      },

      saveUserToDB: async (user: User) => {
        try {
          await upsertUserProfile({
            id: user.id,
            phone: user.phone,
            first_name: user.firstName,
            last_name: user.lastName,
            email: user.email,
            wallet_balance: get().walletBalance,
          });
        } catch {
          // Silently fail — local state is still up to date
        }
      },
    }),
    {
      name: 'tidara-session', // key in SecureStore
      storage: createJSONStorage(() => secureStoreAdapter),
      // Only persist auth-critical fields — cart is ephemeral
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        location: state.location,
        walletBalance: state.walletBalance,
      }),
      // Called once the store has been rehydrated from SecureStore
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
