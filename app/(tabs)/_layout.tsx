import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAppStore } from '../../store/useAppStore';

function TabItem({
  iconName,
  label,
  focused,
  badge,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
  badge?: number | string;
}) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
        <Ionicons
          name={iconName}
          size={20}
          color={focused ? Colors.primary : Colors.textMuted}
        />
        {badge !== undefined && (
          <View style={styles.badgeDot}>
            {typeof badge === 'number' && badge > 0 ? (
              <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
            ) : null}
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { cartItems } = useAppStore();
  const totalItems = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              iconName={focused ? 'sparkles' : 'sparkles-outline'}
              label="Services"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              iconName={focused ? 'calendar' : 'calendar-outline'}
              label="Bookings"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="money"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              iconName={focused ? 'wallet' : 'wallet-outline'}
              label="Money"
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    height: Platform.OS === 'ios' ? 84 : 68,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    elevation: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 70,
  },
  iconWrapper: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconWrapperActive: {
    backgroundColor: '#ECFDF5',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  badgeDot: {
    position: 'absolute',
    top: 2,
    right: 4,
    backgroundColor: Colors.error,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
