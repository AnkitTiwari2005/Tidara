import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAppStore } from '../../store/useAppStore';

const { width } = Dimensions.get('window');

const SERVICEABLE_CITIES = [
  { name: 'Gurugram', area: 'Haryana' },
  { name: 'Delhi', area: 'NCR' },
  { name: 'Noida', area: 'UP' },
  { name: 'Faridabad', area: 'Haryana' },
  { name: 'Mumbai', area: 'Maharashtra' },
  { name: 'Pune', area: 'Maharashtra' },
  { name: 'Bangalore', area: 'Karnataka' },
  { name: 'Hyderabad', area: 'Telangana' },
  { name: 'Chennai', area: 'Tamil Nadu' },
  { name: 'Kolkata', area: 'West Bengal' },
];

const POPULAR_CITIES = ['Gurugram', 'Delhi', 'Mumbai', 'Bangalore', 'Noida'];

function MapIllustration({ city }: { city: string }) {
  return (
    <View style={mapStyles.container}>
      {/* Background grid */}
      <View style={mapStyles.grid}>
        {[0, 1, 2, 3, 4].map((row) => (
          <View key={row} style={mapStyles.gridRow}>
            {[0, 1, 2, 3, 4].map((col) => (
              <View
                key={col}
                style={[
                  mapStyles.gridCell,
                  (row + col) % 3 === 0 && mapStyles.gridCellDark,
                  (row === 2 || col === 2) && mapStyles.gridCellRoad,
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={mapStyles.roadH} />
      <View style={mapStyles.roadV} />

      {/* Location Pin */}
      <View style={mapStyles.markerWrapper}>
        <View style={mapStyles.markerPulse} />
        <View style={mapStyles.markerCircle}>
          <Ionicons name="location" size={26} color={Colors.primary} />
        </View>
        {city ? (
          <View style={mapStyles.markerBubble}>
            <Text style={mapStyles.markerBubbleText}>{city}</Text>
          </View>
        ) : null}
      </View>

      {/* Decorative Buildings */}
      <View style={[mapStyles.building, { top: 30, left: 30, width: 44, height: 30 }]} />
      <View style={[mapStyles.building, { top: 30, right: 40, width: 55, height: 38 }]} />
      <View style={[mapStyles.building, { bottom: 40, left: 24, width: 52, height: 34 }]} />
      <View style={[mapStyles.building, { bottom: 40, right: 30, width: 48, height: 26 }]} />
    </View>
  );
}

const mapStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5EE',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  grid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gridRow: { flex: 1, flexDirection: 'row' },
  gridCell: { flex: 1, borderWidth: 0.5, borderColor: 'rgba(11,83,53,0.08)', backgroundColor: '#E8F5EE' },
  gridCellDark: { backgroundColor: '#D1FAE5' },
  gridCellRoad: { backgroundColor: '#F8FAFC' },
  roadH: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 20,
    backgroundColor: '#F1F5F9',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  roadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 20,
    backgroundColor: '#F1F5F9',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
  },
  building: {
    position: 'absolute',
    backgroundColor: '#A7F3D0',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  markerWrapper: { alignItems: 'center', zIndex: 10 },
  markerPulse: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(11,83,53,0.15)',
    top: -10,
  },
  markerCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  markerBubble: {
    marginTop: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  markerBubbleText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});

export default function ConfirmLocationScreen() {
  const [address, setAddress] = useState('');
  const [cityName, setCityName] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { setLocation } = useAppStore();

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const results = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (results.length > 0) {
          const r = results[0];
          const parts = [
            r.street,
            r.district,
            r.subregion,
            r.city,
            r.region,
            r.country,
          ].filter(Boolean);
          setAddress(parts.join(', '));
          setCityName(r.city ?? r.subregion ?? r.district ?? 'Gurugram');
        }
      } else {
        setCityName('Gurugram');
        setAddress('Sector 48, Sohna Road, Gurugram, Haryana');
      }
    } catch {
      setCityName('Gurugram');
      setAddress('Sector 48, Sohna Road, Gurugram, Haryana');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCity = (city: { name: string; area: string }) => {
    setCityName(city.name);
    setAddress(`${city.name}, ${city.area}, India`);
    setSearch('');
  };

  const handleConfirm = () => {
    const finalCity = cityName || 'Gurugram';
    const finalAddress = address || 'Sector 48, Sohna Road, Gurugram, Haryana';
    setLocation({
      city: finalCity,
      address: finalAddress,
      lat: 28.4595,
      lng: 77.0266,
      isServiceable: true,
    });
    router.replace('/(tabs)');
  };

  const filteredCities =
    search.length > 0
      ? SERVICEABLE_CITIES.filter(
          (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.area.toLowerCase().includes(search.toLowerCase())
        )
      : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Location</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search sector, colony or city..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* City Dropdown */}
      {filteredCities.length > 0 && (
        <View style={styles.dropdown}>
          {filteredCities.map((city) => (
            <TouchableOpacity
              key={city.name}
              style={styles.dropdownItem}
              onPress={() => handleSelectCity(city)}
            >
              <Ionicons name="location-outline" size={18} color={Colors.primary} />
              <View>
                <Text style={styles.dropdownCityName}>{city.name}</Text>
                <Text style={styles.dropdownArea}>{city.area}, India</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Map Illustration Area */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.mapLoading}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.mapLoadingText}>Detecting your current location...</Text>
          </View>
        ) : (
          <MapIllustration city={cityName} />
        )}

        {/* GPS Button */}
        <TouchableOpacity style={styles.gpsBtn} onPress={detectLocation}>
          <Ionicons name="locate" size={16} color={Colors.primary} />
          <Text style={styles.gpsText}>Use Precise GPS</Text>
        </TouchableOpacity>
      </View>

      {/* Popular Cities Row */}
      {!loading && !address && (
        <View style={styles.popularSection}>
          <Text style={styles.popularTitle}>Popular Service Hubs</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularScroll}
          >
            {POPULAR_CITIES.map((name) => {
              const city = SERVICEABLE_CITIES.find((c) => c.name === name)!;
              return (
                <TouchableOpacity
                  key={name}
                  style={styles.popularChip}
                  onPress={() => handleSelectCity(city)}
                >
                  <Text style={styles.popularChipText}>{name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Selected Address Bottom Card */}
      <View style={styles.addressCard}>
        <View style={styles.addressRow}>
          <View style={styles.addressIconBox}>
            <Ionicons name="location" size={20} color={Colors.primary} />
          </View>
          <View style={styles.addressDetails}>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Text style={styles.addressTitle} numberOfLines={1}>
                  {cityName || 'Gurugram'}
                </Text>
                <Text style={styles.addressSubtitle} numberOfLines={2}>
                  {address || 'Sector 48, Sohna Road, Gurugram, Haryana'}
                </Text>
              </>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Confirm Location & Continue</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 6 },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  placeholder: { width: 36 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  dropdown: {
    marginHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: -4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownCityName: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  dropdownArea: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  mapContainer: {
    flex: 1,
    margin: 12,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  mapLoading: {
    flex: 1,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mapLoadingText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  gpsBtn: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  gpsText: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  popularSection: { paddingHorizontal: 16, paddingBottom: 8 },
  popularTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, marginBottom: 8 },
  popularScroll: { gap: 8 },
  popularChip: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  popularChipText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  addressCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 14,
  },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addressIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressDetails: { flex: 1 },
  addressTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  addressSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
