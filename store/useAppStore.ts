import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { getUserByPhone, upsertUserProfile, normalizePhone } from '../lib/supabase';

// ─── Custom SecureStore Adapter with Safe Fallback ────────────────────────────

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
      // Swallowed safely in development/restricted environments
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {
      // Swallowed safely
    }
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface User {
  id?: string;
  phone: string;
  firstName: string;
  lastName?: string;
  email?: string;
  pushToken?: string | null;
}

export interface UserAddress {
  id: string;
  flat: string;
  area: string;
  landmark?: string;
  pincode?: string;
  city: string;
  fullAddress: string;
  type: 'Home' | 'Work' | 'Other';
  lat: number;
  lng: number;
  isDefault?: boolean;
}

export interface Location {
  city: string;
  address: string;
  lat: number;
  lng: number;
  isServiceable: boolean;
  type?: 'Home' | 'Work' | 'Other';
}

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertDetailItem {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

export interface AlertConfig {
  title: string;
  message?: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  icon?: keyof typeof Ionicons.glyphMap;
  buttons?: AlertButton[];
  details?: AlertDetailItem[];
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
  savedAddresses: UserAddress[];
  walletBalance: number;
  hasTidaraPass: boolean;
  passVisitsLeft: number;

  // ── Ephemeral state ──────────────────────────────────────────────────────
  cartItems: CartItem[];
  bookingMode: 'Instant' | 'Scheduled' | 'Recurring';
  scheduledDays: string[];
  scheduledSlot: string | null;
  couponApplied: boolean;
  couponCode: string | null;
  discountAmount: number;

  // ── Global Custom Alert / Toast ───────────────────────────────────────────
  alertConfig: AlertConfig | null;
  showAlert: (config: AlertConfig) => void;
  hideAlert: () => void;

  // ── Hydration flag ───────────────────────────────────────────────────────
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;

  // ── Actions ──────────────────────────────────────────────────────────────
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setLocation: (location: Location | null) => void;
  setWalletBalance: (balance: number) => void;
  
  // Address Management
  addSavedAddress: (address: Omit<UserAddress, 'id'>) => UserAddress;
  removeSavedAddress: (id: string) => void;
  selectSavedAddress: (id: string) => void;

  // Pass Actions
  setTidaraPass: (active: boolean, visits: number) => void;
  usePassVisit: () => boolean;

  // Cart Actions
  addToCart: (serviceId: string, durationMinutes?: number, unitPrice?: number) => void;
  removeFromCart: (serviceId: string, durationMinutes?: number) => void;
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
  saveUserToDB: (user: User) => Promise<{ success: boolean; error?: any; data?: any }>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────
      user: null,
      isAuthenticated: false,
      location: null,
      savedAddresses: [],
      walletBalance: 0,
      hasTidaraPass: false,
      passVisitsLeft: 0,
      cartItems: [],
      bookingMode: 'Instant',
      scheduledDays: ['Mon', 'Wed', 'Fri'],
      scheduledSlot: '9:00 AM',
      couponApplied: false,
      couponCode: null,
      discountAmount: 0,
      alertConfig: null,
      showAlert: (config) => set({ alertConfig: config }),
      hideAlert: () => set({ alertConfig: null }),
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      // ── Setters ────────────────────────────────────────────────────────
      setUser: (user) =>
        set({
          user,
          isAuthenticated: user !== null && Boolean(user.firstName && user.firstName.trim().length > 0),
        }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setLocation: (location) => set({ location }),
      setWalletBalance: (balance) => set({ walletBalance: balance }),

      // ── Address Actions ────────────────────────────────────────────────
      addSavedAddress: (addrData) => {
        const id = 'addr_' + Date.now();
        const newAddress: UserAddress = {
          ...addrData,
          id,
        };
        const currentList = get().savedAddresses;
        const updatedList = [newAddress, ...currentList.map(a => addrData.isDefault ? { ...a, isDefault: false } : a)];
        
        set({
          savedAddresses: updatedList,
          location: {
            city: newAddress.city,
            address: newAddress.fullAddress,
            lat: newAddress.lat,
            lng: newAddress.lng,
            isServiceable: true,
            type: newAddress.type,
          },
        });
        return newAddress;
      },

      removeSavedAddress: (id) => {
        set({
          savedAddresses: get().savedAddresses.filter((a) => a.id !== id),
        });
      },

      selectSavedAddress: (id) => {
        const addr = get().savedAddresses.find((a) => a.id === id);
        if (addr) {
          set({
            location: {
              city: addr.city,
              address: addr.fullAddress,
              lat: addr.lat,
              lng: addr.lng,
              isServiceable: true,
              type: addr.type,
            },
          });
        }
      },

      // ── Pass Actions ───────────────────────────────────────────────────
      setTidaraPass: (active, visits) =>
        set({ hasTidaraPass: active, passVisitsLeft: visits }),

      usePassVisit: () => {
        const { hasTidaraPass, passVisitsLeft } = get();
        if (hasTidaraPass && passVisitsLeft > 0) {
          set({ passVisitsLeft: passVisitsLeft - 1 });
          return true;
        }
        return false;
      },

      // ── Cart ───────────────────────────────────────────────────────────
      addToCart: (serviceId, durationMinutes, unitPrice) => {
        const items = get().cartItems;
        const targetDuration = durationMinutes ?? 60;
        const existingIndex = items.findIndex(
          (i) => i.serviceId === serviceId && (i.durationMinutes ?? 60) === targetDuration
        );

        if (existingIndex > -1) {
          const updated = [...items];
          const curr = updated[existingIndex];
          updated[existingIndex] = {
            ...curr,
            quantity: curr.quantity + 1,
            durationMinutes: targetDuration,
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
                durationMinutes: targetDuration,
                unitPrice,
              },
            ],
          });
        }
      },

      removeFromCart: (serviceId, durationMinutes) => {
        const items = get().cartItems;
        const targetDuration = durationMinutes ?? 60;
        const existingIndex = items.findIndex(
          (i) => i.serviceId === serviceId && (durationMinutes === undefined || (i.durationMinutes ?? 60) === targetDuration)
        );
        if (existingIndex > -1) {
          const existing = items[existingIndex];
          if (existing.quantity > 1) {
            const updated = [...items];
            updated[existingIndex] = { ...existing, quantity: existing.quantity - 1 };
            set({ cartItems: updated });
          } else {
            set({ cartItems: items.filter((_, idx) => idx !== existingIndex) });
          }
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
          savedAddresses: [],
          location: null,
          hasTidaraPass: false,
          passVisitsLeft: 0,
        });
      },

      // ── Supabase sync ────────────────────────────────────────────────────────
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
          const { data, error } = await upsertUserProfile({
            id: user.id,
            phone: canonicalPhone,
            first_name: user.firstName,
            last_name: user.lastName,
            email: user.email,
          });
          if (data?.id) {
            set((state) => ({
              user: state.user ? { ...state.user, id: data.id } : null,
            }));
          }
          return { success: !error && !!data, error, data };
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
        savedAddresses: state.savedAddresses,
        walletBalance: state.walletBalance,
        hasTidaraPass: state.hasTidaraPass,
        passVisitsLeft: state.passVisitsLeft,
      }),
      onRehydrateStorage: () => () => {
        // Guarantee hydration flag is set even if reading storage throws
        useAppStore.setState({ _hasHydrated: true });
      },
    }
  )
);

export function showAppAlert(
  title: string,
  message?: string,
  type: 'success' | 'warning' | 'error' | 'info' = 'info',
  buttons?: AlertButton[],
  options?: {
    icon?: keyof typeof Ionicons.glyphMap;
    details?: AlertDetailItem[];
  }
) {
  useAppStore.getState().showAlert({
    title,
    message: message || '',
    type,
    buttons,
    icon: options?.icon,
    details: options?.details,
  });
}
