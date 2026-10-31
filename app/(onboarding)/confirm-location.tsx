import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Colors } from '../../constants/colors';
import { useAppStore, showAppAlert } from '../../store/useAppStore';

interface ServiceableCity {
  name: string;
  area: string;
  lat: number;
  lng: number;
}

const SERVICEABLE_CITIES: ServiceableCity[] = [
  { name: 'Gurugram', area: 'Haryana', lat: 28.4595, lng: 77.0266 },
  { name: 'Delhi', area: 'NCR', lat: 28.6139, lng: 77.2090 },
  { name: 'Noida', area: 'UP', lat: 28.5355, lng: 77.3910 },
  { name: 'Faridabad', area: 'Haryana', lat: 28.4089, lng: 77.3178 },
  { name: 'Mumbai', area: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { name: 'Pune', area: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Bangalore', area: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', area: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { name: 'Chennai', area: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', area: 'West Bengal', lat: 22.5726, lng: 88.3639 },
];

const POPULAR_CITIES = ['Gurugram', 'Delhi', 'Mumbai', 'Bangalore', 'Noida'];

function RealMapView({
  lat,
  lng,
  city,
  onLocationChange,
}: {
  lat: number;
  lng: number;
  city: string;
  onLocationChange: (newLat: number, newLng: number) => void;
}) {
  const webViewRef = useRef<any>(null);
  const WebViewComponent = WebView as any;

  const mapHtml = useMemo(
    () => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { box-sizing: border-box; }
        body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #F1F5F9; overflow: hidden; }
        
        .center-pin-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -100%);
          z-index: 1000;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: transform 0.15s ease-out;
        }
        .pin-head {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #0B5335;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 18px rgba(11, 83, 53, 0.35);
          border: 3.5px solid #FFFFFF;
        }
        .pin-point {
          width: 0;
          height: 0;
          border-left: 9px solid transparent;
          border-right: 9px solid transparent;
          border-top: 11px solid #0B5335;
          margin-top: -3px;
        }
        .pin-shadow {
          width: 14px;
          height: 5px;
          background: rgba(15, 23, 42, 0.25);
          border-radius: 50%;
          margin-top: 2px;
        }
        .pin-label {
          background: #063D26;
          color: #FFFFFF;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 11.5px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 12px;
          white-space: nowrap;
          margin-bottom: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          letter-spacing: 0.3px;
        }
        body.is-dragging .center-pin-container {
          transform: translate(-50%, -115%);
        }
        body.is-dragging .pin-shadow {
          transform: scale(0.6);
          opacity: 0.15;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div class="center-pin-container">
        <div class="pin-label" id="cityLabel">${city || 'Your Location'}</div>
        <div class="pin-head">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div class="pin-point"></div>
        <div class="pin-shadow"></div>
      </div>
      <script>
        var map = L.map('map', { 
          zoomControl: false,
          attributionControl: false 
        }).setView([${lat}, ${lng}], 16);

        var tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
        L.tileLayer(tileUrl, {
          maxZoom: 19,
          attribution: ''
        }).addTo(map);

        map.on('movestart', function() {
          document.body.classList.add('is-dragging');
        });

        map.on('moveend', function() {
          document.body.classList.remove('is-dragging');
          var center = map.getCenter();
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'location_changed',
              lat: center.lat,
              lng: center.lng
            }));
          }
        });

        window.updateCenter = function(newLat, newLng, newCity) {
          map.setView([newLat, newLng], 16, { animate: true });
          var el = document.getElementById('cityLabel');
          if (el && newCity) el.innerText = newCity;
        };
      </script>
    </body>
    </html>
  `,
    []
  );

  useEffect(() => {
    if (webViewRef.current && lat && lng) {
      webViewRef.current.injectJavaScript(
        `if (window.updateCenter) { window.updateCenter(${lat}, ${lng}, "${city || ''}"); } true;`
      );
    }
  }, [lat, lng, city]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'location_changed') {
        onLocationChange(data.lat, data.lng);
      }
    } catch {}
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <WebViewComponent
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={{ flex: 1, backgroundColor: '#E8F5EE' }}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
      />
    </View>
  );
}

export default function ConfirmLocationScreen() {
  const { location: storedLocation, setLocation } = useAppStore();

  const [address, setAddress] = useState(storedLocation?.address || '');
  const [cityName, setCityName] = useState(storedLocation?.city || '');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: storedLocation?.lat || 28.4595,
    lng: storedLocation?.lng || 77.0266,
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storedLocation?.address) {
      detectLocation();
    }
  }, []);

  const detectLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const detectedLat = loc.coords.latitude;
        const detectedLng = loc.coords.longitude;
        setCoords({ lat: detectedLat, lng: detectedLng });

        const results = await Location.reverseGeocodeAsync({
          latitude: detectedLat,
          longitude: detectedLng,
        });
        if (results.length > 0) {
          const r = results[0];
          const parts = [
            r.name,
            r.street,
            r.district,
            r.subregion,
            r.city,
            r.region,
          ].filter(Boolean);
          setAddress(parts.join(', '));
          setCityName(r.city ?? r.subregion ?? r.district ?? 'Current Location');
        }
      } else {
        if (!cityName) {
          setCityName('Gurugram');
          setAddress('Sector 48, Sohna Road, Gurugram, Haryana');
          setCoords({ lat: 28.4595, lng: 77.0266 });
        }
      }
    } catch {
      if (!cityName) {
        setCityName('Gurugram');
        setAddress('Sector 48, Sohna Road, Gurugram, Haryana');
        setCoords({ lat: 28.4595, lng: 77.0266 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCity = (city: ServiceableCity) => {
    setCityName(city.name);
    setAddress(`${city.name}, ${city.area}, India`);
    setCoords({ lat: city.lat, lng: city.lng });
    setSearch('');
  };

  const handleMapLocationChange = async (newLat: number, newLng: number) => {
    setCoords({ lat: newLat, lng: newLng });
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: newLat,
        longitude: newLng,
      });
      if (results && results.length > 0) {
        const r = results[0];
        const parts = [
          r.name,
          r.street,
          r.district,
          r.subregion,
          r.city,
          r.region,
        ].filter(Boolean);
        setAddress(parts.join(', '));
        if (r.city || r.subregion || r.district) {
          setCityName(r.city ?? r.subregion ?? r.district ?? '');
        }
      }
    } catch {}
  };

  const handleConfirm = () => {
    const finalCity = cityName || 'Gurugram';
    const finalAddress = address || 'Sector 48, Sohna Road, Gurugram, Haryana';
    setLocation({
      city: finalCity,
      address: finalAddress,
      lat: coords.lat,
      lng: coords.lng,
      isServiceable: true,
    });
    router.replace('/(tabs)');
  };

  const filteredCities =
    search.trim().length > 0
      ? SERVICEABLE_CITIES.filter(
          (c) =>
            c.name.toLowerCase().includes(search.trim().toLowerCase()) ||
            c.area.toLowerCase().includes(search.trim().toLowerCase())
        )
      : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go Back"
        >
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

      {/* Real Live Map */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.mapLoading}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.mapLoadingText}>Detecting your current location...</Text>
          </View>
        ) : (
          <RealMapView
            lat={coords.lat}
            lng={coords.lng}
            city={cityName}
            onLocationChange={handleMapLocationChange}
          />
        )}

        {/* GPS Button */}
        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={detectLocation}
          accessibilityRole="button"
          accessibilityLabel="Use GPS Location"
        >
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
          accessibilityRole="button"
          accessibilityLabel="Confirm Location and Continue"
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
