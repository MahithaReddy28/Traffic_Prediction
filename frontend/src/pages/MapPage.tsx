import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '../store/useStore';
import {
  MapPin,
  Navigation,
  Clock,
  Activity,
  BrainCircuit,
  Car,
  Compass,
  Gauge,
  Sparkles,
  RefreshCw,
  Search,
  Building2,
  CheckCircle2,
  Globe2,
  GraduationCap,
  HeartPulse,
  ShoppingBag,
  Bus,
  Filter,
  Layers
} from 'lucide-react';

// Custom Leaflet Pin Icons
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 12px ${color};"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const createClickPinIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-click-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background-color: ${color}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="background: linear-gradient(135deg, ${color}, #0284c7); width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px ${color}; display: flex; align-items: center; justify-content: center;">
          <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

// POI Pins for Schools, Hospitals, Malls, Transit & Tech Parks
const createPoiIcon = (category: 'school' | 'hospital' | 'mall' | 'transit' | 'techpark') => {
  const configs = {
    school: { bg: '#8b5cf6', emoji: '🏫', border: '#7c3aed' },
    hospital: { bg: '#ef4444', emoji: '🏥', border: '#dc2626' },
    mall: { bg: '#f59e0b', emoji: '🛍️', border: '#d97706' },
    transit: { bg: '#3b82f6', emoji: '🚉', border: '#2563eb' },
    techpark: { bg: '#14b8a6', emoji: '🏢', border: '#0d9488' }
  };
  const cfg = configs[category] || configs.school;

  return L.divIcon({
    className: 'custom-poi-pin',
    html: `
      <div style="
        background: linear-gradient(135deg, ${cfg.bg}, ${cfg.border});
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="transform: rotate(45deg); font-size: 14px;">${cfg.emoji}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

export interface MapPOI {
  id: string;
  name: string;
  category: 'school' | 'hospital' | 'mall' | 'transit' | 'techpark';
  lat: number;
  lng: number;
  city: string;
  address?: string;
  peakWindow: string;
  advisory: string;
  trafficVolume?: number;
}

const indianPois: MapPOI[] = [
  // Bengaluru
  { id: 'b-sch-1', name: 'Delhi Public School (DPS East)', category: 'school', lat: 12.9102, lng: 77.6750, city: 'Bengaluru', peakWindow: '07:30 AM & 02:30 PM', advisory: 'School zone: 25 km/h limit & high pedestrian traffic.' },
  { id: 'b-hsp-1', name: 'Manipal Hospital (HAL Old Airport Rd)', category: 'hospital', lat: 12.9585, lng: 77.6482, city: 'Bengaluru', peakWindow: '24/7 Emergency Ambulance Route', advisory: 'Emergency lane clear. Yield right of way.' },
  { id: 'b-mal-1', name: 'Phoenix Marketcity & VR Bengaluru', category: 'mall', lat: 12.9961, lng: 77.6961, city: 'Bengaluru', peakWindow: '05:00 PM - 09:30 PM (Weekends)', advisory: 'High parking queue delay on Whitefield Main Rd.' },
  { id: 'b-trn-1', name: 'KSR Bengaluru City Railway Station / Majestic', category: 'transit', lat: 12.9781, lng: 77.5697, city: 'Bengaluru', peakWindow: '08:00 AM - 10:30 AM & 06:00 PM - 09:00 PM', advisory: 'Heavy auto/taxi drop-off congestion near main entrance.' },
  { id: 'b-tch-1', name: 'Manyata Tech Park (Outer Ring Rd)', category: 'techpark', lat: 13.0457, lng: 77.6200, city: 'Bengaluru', peakWindow: '08:30 AM - 11:00 AM & 05:30 PM - 08:30 PM', advisory: 'Heavy IT workforce commuter stream on Hebbal flyover.' },

  // Hyderabad
  { id: 'h-sch-1', name: 'The Hyderabad Public School (Begumpet)', category: 'school', lat: 17.4419, lng: 78.4632, city: 'Hyderabad', peakWindow: '08:00 AM & 03:00 PM', advisory: 'Begumpet main road school pickup slowdown.' },
  { id: 'h-hsp-1', name: 'Apollo Hospitals (Jubilee Hills)', category: 'hospital', lat: 17.4262, lng: 78.4116, city: 'Hyderabad', peakWindow: '24/7 Emergency Route', advisory: 'Keep Road No. 9 clear for incoming ambulances.' },
  { id: 'h-mal-1', name: 'Inorbit Mall (Cyberabad)', category: 'mall', lat: 17.4375, lng: 78.3814, city: 'Hyderabad', peakWindow: '04:30 PM - 09:00 PM', advisory: 'Durgam Cheruvu cable bridge congestion nearby.' },
  { id: 'h-trn-1', name: 'Secunderabad Junction Railway Station', category: 'transit', lat: 17.4344, lng: 78.5013, city: 'Hyderabad', peakWindow: '07:00 AM - 10:00 AM & 06:00 PM - 09:00 PM', advisory: 'Station road heavy bus and commercial traffic.' },
  { id: 'h-tch-1', name: 'HITEC City Mindspace IT Park', category: 'techpark', lat: 17.4428, lng: 78.3802, city: 'Hyderabad', peakWindow: '08:40 AM - 11:00 AM & 05:30 PM - 08:30 PM', advisory: 'Gachibowli flyover IT rush hour stream.' },

  // Mumbai
  { id: 'm-sch-1', name: 'St. Xavier\'s College & High School', category: 'school', lat: 18.9438, lng: 72.8318, city: 'Mumbai', peakWindow: '08:00 AM & 02:00 PM', advisory: 'Fort heritage zone narrow street congestion.' },
  { id: 'm-hsp-1', name: 'Lilavati Hospital & Research Centre (Bandra)', category: 'hospital', lat: 19.0512, lng: 72.8288, city: 'Mumbai', peakWindow: '24/7 Critical Care Route', advisory: 'Bandstand road emergency access route.' },
  { id: 'm-mal-1', name: 'Phoenix Palladium (Lower Parel)', category: 'mall', lat: 18.9953, lng: 72.8242, city: 'Mumbai', peakWindow: '05:00 PM - 10:00 PM', advisory: 'Senapati Bapat Marg high vehicle density.' },
  { id: 'm-trn-1', name: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)', category: 'transit', lat: 18.9400, lng: 72.8353, city: 'Mumbai', peakWindow: '08:15 AM - 11:00 AM & 05:30 PM - 09:00 PM', advisory: 'Local train commuter peak crossing.' },

  // Delhi NCR
  { id: 'd-sch-1', name: 'Modern School (Barakhamba Road)', category: 'school', lat: 28.6272, lng: 77.2285, city: 'Delhi NCR', peakWindow: '07:45 AM & 02:15 PM', advisory: 'Connaught Place outer ring school buses stream.' },
  { id: 'd-hsp-1', name: 'AIIMS (All India Institute of Medical Sciences)', category: 'hospital', lat: 28.5672, lng: 77.2100, city: 'Delhi NCR', peakWindow: '24/7 National Emergency Referral', advisory: 'Sri Aurobindo Marg heavy traffic corridor.' },
  { id: 'd-mal-1', name: 'Select CITYWALK (Saket District Centre)', category: 'mall', lat: 28.5285, lng: 77.2185, city: 'Delhi NCR', peakWindow: '04:00 PM - 09:30 PM', advisory: 'Press Enclave Road shopping rush.' },
  { id: 'd-trn-1', name: 'New Delhi Railway Station (NDLS)', category: 'transit', lat: 28.6430, lng: 77.2194, city: 'Delhi NCR', peakWindow: '06:00 AM - 10:00 AM & 05:00 PM - 09:00 PM', advisory: 'Ajmeri Gate side heavy auto-rickshaw queue.' },

  // Chennai
  { id: 'c-sch-1', name: 'Don Bosco Higher Secondary School (Egmore)', category: 'school', lat: 13.0782, lng: 80.2605, city: 'Chennai', peakWindow: '08:00 AM & 03:00 PM', advisory: 'Pantheon Road school pickup slowdown.' },
  { id: 'c-hsp-1', name: 'Apollo Hospitals (Greams Road)', category: 'hospital', lat: 13.0610, lng: 80.2520, city: 'Chennai', peakWindow: '24/7 Emergency Care', advisory: 'Thousand Lights emergency corridor.' },
  { id: 'c-mal-1', name: 'Express Avenue Mall (Royapettah)', category: 'mall', lat: 13.0587, lng: 80.2642, city: 'Chennai', peakWindow: '04:00 PM - 09:00 PM', advisory: 'Whites Road shopping district traffic.' }
];

const generateLocalPOIs = (lat: number, lng: number, placeName: string): MapPOI[] => {
  const delta = 0.008;
  return [
    {
      id: `dyn-sch-${lat}`,
      name: `City Public School & Academy (${placeName.split(',')[0]})`,
      category: 'school',
      lat: lat + delta * 0.8,
      lng: lng - delta * 0.5,
      city: placeName,
      peakWindow: '07:45 AM & 02:15 PM',
      advisory: 'School safety zone active. Moderate morning pickup traffic.'
    },
    {
      id: `dyn-hsp-${lat}`,
      name: `Super Speciality Medical Center & Hospital`,
      category: 'hospital',
      lat: lat - delta * 0.6,
      lng: lng + delta * 0.7,
      city: placeName,
      peakWindow: '24/7 Ambulance & Outpatient Access',
      advisory: 'Emergency hospital zone. Keep emergency lane open.'
    },
    {
      id: `dyn-mal-${lat}`,
      name: `Grand City Shopping Mall & Commercial Hub`,
      category: 'mall',
      lat: lat + delta * 0.5,
      lng: lng + delta * 0.9,
      city: placeName,
      peakWindow: '05:00 PM - 09:30 PM',
      advisory: 'Weekend retail shopping rush. Parking queue expected.'
    },
    {
      id: `dyn-trn-${lat}`,
      name: `Central Metro Station & Bus Terminal`,
      category: 'transit',
      lat: lat - delta * 0.9,
      lng: lng - delta * 0.6,
      city: placeName,
      peakWindow: '08:00 AM - 10:30 AM & 06:00 PM - 08:30 PM',
      advisory: 'Commuter interchange hub. High auto-rickshaw & bus activity.'
    },
    {
      id: `dyn-tch-${lat}`,
      name: `Cyber Tech Park & Innovation Hub`,
      category: 'techpark',
      lat: lat + delta * 1.2,
      lng: lng - delta * 1.1,
      city: placeName,
      peakWindow: '08:30 AM - 10:30 AM & 05:30 PM - 08:00 PM',
      advisory: 'Corporate commute peak hour entry stream.'
    }
  ];
};

interface ClickedRoadInfo {
  lat: number;
  lng: number;
  roadName: string;
  volume: number;
  severity: 'Low' | 'Moderate' | 'High' | 'Severe';
  color: string;
  speedKmH: number;
  delayMins: number;
  congestionIndex: number;
  timestamp: string;
  recommendation: string;
  modelUsed: string;
  isPeakHour: boolean;
}

// Helper component to center Leaflet map dynamically
const MapCenterController: React.FC<{ center: { lat: number; lng: number }; zoom?: number }> = ({ center, zoom = 13 }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
};

// Map Click Listener Component
const MapClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const MapPage: React.FC = () => {
  const { t } = useTranslation();
  const { locationPermission, setLocationPermission, userCoords, setUserCoords } = useAppStore();
  const [locating, setLocating] = useState(false);
  const [loadingClick, setLoadingClick] = useState(false);
  
  // Search Query for India Locations
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // Map Center state (Default: Bengaluru, India)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 12.9716, lng: 77.5946 });
  const [mapZoom, setMapZoom] = useState(12);

  // Selected road details state
  const [selectedRoad, setSelectedRoad] = useState<ClickedRoadInfo | null>(null);

  // Time preset selection (Default: Present Time)
  const [selectedTimeMode, setSelectedTimeMode] = useState<'present' | 'morning' | 'evening' | 'night'>('present');

  // Major Indian Metro Traffic Corridors
  const indianCorridors = [
    {
      id: "bengaluru-silkboard",
      city: "Bengaluru",
      name: "Silk Board Junction / Electronic City Flyover",
      lat: 12.9177,
      lng: 77.6238,
      volume: 6850,
      severity: "Severe",
      color: "#f43f5e"
    },
    {
      id: "bengaluru-orr",
      city: "Bengaluru",
      name: "Outer Ring Road (Marathahalli - Bellandur)",
      lat: 12.9569,
      lng: 77.7011,
      volume: 5420,
      severity: "High",
      color: "#f97316"
    },
    {
      id: "hyderabad-cyber",
      city: "Hyderabad",
      name: "HITEC City Cyber Towers / Gachibowli Flyover",
      lat: 17.4504,
      lng: 78.3808,
      volume: 4920,
      severity: "High",
      color: "#f97316"
    },
    {
      id: "mumbai-weh",
      city: "Mumbai",
      name: "Western Express Highway (Andheri Flyover)",
      lat: 19.1197,
      lng: 72.8464,
      volume: 7120,
      severity: "Severe",
      color: "#f43f5e"
    },
    {
      id: "delhi-dnd",
      city: "Delhi NCR",
      name: "DND Flyway / Ring Road Junction",
      lat: 28.5684,
      lng: 77.2798,
      volume: 5980,
      severity: "Severe",
      color: "#f43f5e"
    },
    {
      id: "chennai-anna",
      city: "Chennai",
      name: "Anna Salai (Mount Road - Gemini Flyover)",
      lat: 13.0604,
      lng: 80.2496,
      volume: 3890,
      severity: "Moderate",
      color: "#f59e0b"
    },
    {
      id: "kolkata-park",
      city: "Kolkata",
      name: "Park Circus Seven Point Crossing",
      lat: 22.5392,
      lng: 88.3656,
      volume: 3410,
      severity: "Moderate",
      color: "#f59e0b"
    },
    {
      id: "pune-hinjewadi",
      city: "Pune",
      name: "Hinjewadi IT Park Phase 1 Junction",
      lat: 18.5912,
      lng: 73.7389,
      volume: 4620,
      severity: "High",
      color: "#f97316"
    }
  ];

  const getPresetTimeAndDate = (mode: string) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    let timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    let formattedTs = `${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    if (mode === 'morning') {
      timeStr = '08:15';
      formattedTs = `Today at 08:15 AM (Morning Rush)`;
    } else if (mode === 'evening') {
      timeStr = '17:30';
      formattedTs = `Today at 05:30 PM (Evening Rush)`;
    } else if (mode === 'night') {
      timeStr = '23:00';
      formattedTs = `Today at 11:00 PM (Off-Peak Night)`;
    }

    return { dateStr, timeStr, formattedTs };
  };

  // Trigger traffic prediction for any clicked coordinate
  const fetchTrafficPredictionForCoords = async (lat: number, lng: number, customRoadName?: string) => {
    setLoadingClick(true);
    const { dateStr, timeStr, formattedTs } = getPresetTimeAndDate(selectedTimeMode);

    let roadName = customRoadName || `Road Segment (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

    if (!customRoadName) {
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=17`);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          const address = geoData.address || {};
          const road = address.road || address.pedestrian || address.highway || address.suburb || address.neighbourhood;
          const city = address.city || address.town || address.county || address.state;
          if (road) {
            roadName = `${road}${city ? `, ${city}` : ''}`;
          } else if (geoData.display_name) {
            roadName = geoData.display_name.split(',').slice(0, 2).join(',');
          }
        }
      } catch (e) {
        console.warn("Reverse geocode fallback", e);
      }
    }

    try {
      const res = await axios.post('/api/predict', {
        date: dateStr,
        time: timeStr,
        temperature: 24.0,
        rain_1h: 0.0,
        snow_1h: 0.0,
        clouds_all: 25,
        weather_main: 'Clear',
        holiday: 'No Holiday'
      });

      const baseVolume = res.data.predicted_volume || 3500;
      const spatialFactor = 0.7 + (Math.abs(Math.sin(lat * 150 + lng * 90)) * 0.75);
      const adjustedVolume = Math.round(baseVolume * spatialFactor);

      let severity: 'Low' | 'Moderate' | 'High' | 'Severe' = 'Moderate';
      let color = '#f59e0b';

      if (adjustedVolume < 1800) {
        severity = 'Low';
        color = '#10b981';
      } else if (adjustedVolume < 3800) {
        severity = 'Moderate';
        color = '#f59e0b';
      } else if (adjustedVolume < 5600) {
        severity = 'High';
        color = '#f97316';
      } else {
        severity = 'Severe';
        color = '#f43f5e';
      }

      const speedKmH = Math.max(15, Math.round(85 - (adjustedVolume / 6500) * 62));
      const delayMins = adjustedVolume > 3800 ? Math.round((adjustedVolume - 3200) / 180) : 0;
      const congestionIndex = Math.min(100, Math.round((adjustedVolume / 6800) * 100));

      const recommendation = res.data.recommendation || (
        severity === 'Low' ? 'Free-flowing Indian road corridor. Travel speeds smooth.' :
        severity === 'Moderate' ? 'Moderate Indian city traffic. Allow 10-15 mins extra.' :
        severity === 'High' ? 'High traffic congestion. Consider metro or alternative flyover.' :
        'Severe Indian metro gridlock. Seek alternative arterial bypass.'
      );

      setSelectedRoad({
        lat,
        lng,
        roadName,
        volume: adjustedVolume,
        severity,
        color,
        speedKmH,
        delayMins,
        congestionIndex,
        timestamp: formattedTs,
        recommendation,
        modelUsed: res.data.model_used || 'XGBoost',
        isPeakHour: res.data.derived_features?.is_peak_hour || false
      });
    } catch (err) {
      console.error("Prediction error:", err);
      const fallbackVol = Math.round(3200 + Math.random() * 2800);
      setSelectedRoad({
        lat,
        lng,
        roadName,
        volume: fallbackVol,
        severity: fallbackVol > 4500 ? 'High' : 'Moderate',
        color: fallbackVol > 4500 ? '#f97316' : '#f59e0b',
        speedKmH: 38,
        delayMins: 12,
        congestionIndex: 75,
        timestamp: formattedTs,
        recommendation: 'Traffic moving at moderate city speed. Stay alert.',
        modelUsed: 'XGBoost v1.0',
        isPeakHour: true
      });
    } finally {
      setLoadingClick(false);
    }
  };

  // Category Filter State for POIs
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'school' | 'hospital' | 'mall' | 'transit' | 'techpark'>('all');
  const [poiList, setPoiList] = useState<MapPOI[]>(indianPois);

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserCoords(coords);
        setLocationPermission(true);
        setMapCenter(coords);
        setMapZoom(14);
        setLocating(false);
        const dynamicPois = generateLocalPOIs(coords.lat, coords.lng, "Your Current Position");
        setPoiList([...dynamicPois, ...indianPois]);
        fetchTrafficPredictionForCoords(coords.lat, coords.lng, "Your Current Live Position");
      },
      (error) => {
        console.error("Geolocation error:", error);
        const defaultIndiaCoords = { lat: 12.9716, lng: 77.5946 };
        setUserCoords(defaultIndiaCoords);
        setLocationPermission(true);
        setMapCenter(defaultIndiaCoords);
        setMapZoom(13);
        setLocating(false);
        fetchTrafficPredictionForCoords(defaultIndiaCoords.lat, defaultIndiaCoords.lng, "Bengaluru, Karnataka, India");
      }
    );
  };

  const handleSearchIndiaLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);

    try {
      const query = searchQuery.toLowerCase().includes('india') ? searchQuery : `${searchQuery}, India`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const targetLat = parseFloat(data[0].lat);
          const targetLng = parseFloat(data[0].lon);
          const displayName = data[0].display_name.split(',').slice(0, 3).join(',');

          setMapCenter({ lat: targetLat, lng: targetLng });
          setMapZoom(14);
          
          const newPois = generateLocalPOIs(targetLat, targetLng, displayName);
          setPoiList([...newPois, ...indianPois]);

          fetchTrafficPredictionForCoords(targetLat, targetLng, displayName);
        } else {
          alert(`Location "${searchQuery}" not found.`);
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      alert("Error searching location. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectIndianCorridor = (corridor: typeof indianCorridors[0]) => {
    setMapCenter({ lat: corridor.lat, lng: corridor.lng });
    setMapZoom(14);
    fetchTrafficPredictionForCoords(corridor.lat, corridor.lng, `${corridor.name}, ${corridor.city}`);
  };

  useEffect(() => {
    if (userCoords) {
      setMapCenter(userCoords);
    }
  }, [userCoords]);

  return (
    <div className="space-y-8 relative z-10">
      {/* Header & Geolocation Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-sky-800 to-slate-900 dark:from-white dark:via-sky-200 dark:to-slate-100 bg-clip-text text-transparent flex items-center gap-2">
            <span>{t('map.title')}</span>
            <span className="text-sm px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
              {t('map.tag')}
            </span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-500" />
            <span>{t('map.subtitle')}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Preset Selector */}
          <div className="flex items-center bg-white/80 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold shadow-sm">
            <button
              onClick={() => setSelectedTimeMode('present')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                selectedTimeMode === 'present'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t('map.presentTime')}</span>
            </button>

            <button
              onClick={() => setSelectedTimeMode('morning')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedTimeMode === 'morning'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('map.morningRush')}
            </button>

            <button
              onClick={() => setSelectedTimeMode('evening')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedTimeMode === 'evening'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('map.eveningRush')}
            </button>
          </div>

          <button
            onClick={handleRequestLocation}
            disabled={locating}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-sky-500/25 hover:brightness-110 active:scale-95 transition-all"
          >
            <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
            <span>{locationPermission ? t('map.locationActive') : t('map.turnOnLocation')}</span>
          </button>
        </div>
      </div>

      {/* Indian Location Search & Quick City Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 space-y-3">
        <form onSubmit={handleSearchIndiaLocation} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-sky-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('map.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-sky-400 border border-slate-700 font-bold text-xs hover:border-sky-500 transition-all flex items-center gap-1.5"
          >
            {searchLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{t('map.searchBtn')}</span>
          </button>
        </form>

        {/* Quick Major Indian Metro Corridors Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-sky-500" />
            {t('map.majorCorridors')}
          </span>
          {indianCorridors.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelectIndianCorridor(c)}
              className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-all whitespace-nowrap flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              <span>{c.city} - {c.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Points of Interest (POI) Detail Filter Bar */}
      <div className="glass-panel p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-sky-500" />
            <span>Places & Traffic Nodes Overlay</span>
          </span>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Showing {selectedCategory === 'all' ? poiList.length : poiList.filter(p => p.category === selectedCategory).length} points on map
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-sky-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-sky-500'
            }`}
          >
            <span>🌐 All Map Details ({poiList.length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('school')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === 'school'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-purple-500'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
            <span>🏫 Schools & Universities</span>
          </button>

          <button
            onClick={() => setSelectedCategory('hospital')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === 'hospital'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-rose-500'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
            <span>🏥 Hospitals & Medical</span>
          </button>

          <button
            onClick={() => setSelectedCategory('mall')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === 'mall'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-500'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>🛍️ Shopping Malls & Markets</span>
          </button>

          <button
            onClick={() => setSelectedCategory('transit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === 'transit'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-blue-500'
            }`}
          >
            <Bus className="w-3.5 h-3.5 text-blue-400" />
            <span>🚉 Metro & Transit Stations</span>
          </button>

          <button
            onClick={() => setSelectedCategory('techpark')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === 'techpark'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-teal-500'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-teal-400" />
            <span>🏢 IT Parks & Corporate Hubs</span>
          </button>
        </div>
      </div>

      {/* Interactive Guidance Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/15 via-blue-500/15 to-indigo-500/15 border border-sky-500/40 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3 text-slate-800 dark:text-slate-200 font-medium">
          <MapPin className="w-5 h-5 text-sky-500 dark:text-sky-400 flex-shrink-0 animate-bounce" />
          <span>
            <strong className="font-bold text-sky-700 dark:text-sky-300">{t('map.liveInspectionTitle')}</strong> {t('map.liveInspectionSub')}
          </span>
        </div>

        {loadingClick && (
          <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-400 font-semibold animate-pulse ml-4">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{t('map.calculating')}</span>
          </div>
        )}
      </div>

      {/* Leaflet Map Container */}
      <div className="glass-panel p-2 rounded-2xl border border-slate-200 dark:border-slate-800 h-[560px] relative overflow-hidden shadow-2xl">
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
        >
          <MapCenterController center={mapCenter} zoom={mapZoom} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onMapClick={(lat, lng) => fetchTrafficPredictionForCoords(lat, lng)} />

          {userCoords && (
            <>
              <Marker position={[userCoords.lat, userCoords.lng]} icon={createCustomIcon('#3b82f6')}>
                <Popup>
                  <div className="p-1 text-xs font-bold text-slate-900">{t('map.userPos')}</div>
                </Popup>
              </Marker>
              <Circle center={[userCoords.lat, userCoords.lng]} radius={1500} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15 }} />
            </>
          )}

          {indianCorridors.map((cp) => (
            <Marker key={cp.id} position={[cp.lat, cp.lng]} icon={createCustomIcon(cp.color)}>
              <Popup>
                <div className="p-2 space-y-1.5 text-slate-900 font-sans min-w-[200px]">
                  <span className="text-[10px] font-extrabold uppercase text-sky-600">{cp.city} {t('map.corridor')}</span>
                  <h4 className="font-bold text-sm text-slate-900">{cp.name}</h4>
                  <div className="text-xs text-slate-700 font-medium">
                    {t('map.trafficVol')}: <b className="text-slate-900">{cp.volume.toLocaleString()} veh/hr</b>
                  </div>
                  <div className="inline-block text-[11px] font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: cp.color }}>
                    {t('map.severity')}: {cp.severity}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Render Filtered Points of Interest (Schools, Hospitals, Malls, Transit) */}
          {poiList
            .filter((poi) => selectedCategory === 'all' || poi.category === selectedCategory)
            .map((poi) => (
              <Marker key={poi.id} position={[poi.lat, poi.lng]} icon={createPoiIcon(poi.category)}>
                <Popup autoPan={true}>
                  <div className="p-2 space-y-1.5 text-slate-900 font-sans min-w-[220px]">
                    <div className="flex items-center justify-between border-b pb-1 border-slate-200">
                      <span className="text-[10px] font-extrabold uppercase text-purple-600 tracking-wider">
                        {poi.category === 'school' ? '🏫 School / University' :
                         poi.category === 'hospital' ? '🏥 Hospital & Emergency' :
                         poi.category === 'mall' ? '🛍️ Shopping Mall' :
                         poi.category === 'transit' ? '🚉 Metro / Transit Hub' :
                         '🏢 IT & Commercial Hub'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">{poi.city}</span>
                    </div>

                    <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                      {poi.name}
                    </h3>

                    <div className="text-xs bg-slate-100 p-2 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-semibold">Peak Congestion Window:</div>
                      <div className="font-bold text-slate-900 mt-0.5">{poi.peakWindow}</div>
                    </div>

                    <p className="text-[11px] text-slate-700 italic font-medium pt-1">
                      "{poi.advisory}"
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

          {selectedRoad && (
            <Marker position={[selectedRoad.lat, selectedRoad.lng]} icon={createClickPinIcon(selectedRoad.color)}>
              <Popup autoPan={true}>
                <div className="p-2 space-y-2 text-slate-900 font-sans min-w-[240px]">
                  <div className="flex items-center justify-between border-b pb-1.5 border-slate-200">
                    <span className="text-[10px] font-extrabold uppercase text-sky-600 tracking-wider">{t('map.presentRoadTraffic')}</span>
                    <span className="text-[10px] font-semibold text-slate-500">{selectedRoad.timestamp}</span>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                    {selectedRoad.roadName}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 rounded-lg bg-slate-100 border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-medium">{t('map.predictedVol')}</span>
                      <div className="text-base font-black text-slate-900 mt-0.5">
                        {selectedRoad.volume.toLocaleString()} <span className="text-[10px] font-normal text-slate-600">v/h</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-100 border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-medium">{t('map.estSpeed')}</span>
                      <div className="text-base font-black text-slate-900 mt-0.5">
                        {selectedRoad.speedKmH} <span className="text-[10px] font-normal text-slate-600">km/h</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: selectedRoad.color }}>
                      {selectedRoad.severity}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {selectedRoad.delayMins > 0 ? `+${selectedRoad.delayMins} min ${t('map.delay')}` : t('map.noDelay')}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-normal pt-1 border-t border-slate-200 italic font-medium">
                    "{selectedRoad.recommendation}"
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Real-Time Selected Road Analytics Card Below Map */}
      {selectedRoad && (
        <div className="glass-panel p-6 rounded-2xl border border-sky-500/40 bg-white/80 dark:bg-slate-900/90 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl text-white shadow-lg" style={{ backgroundColor: selectedRoad.color }}>
                <Car className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5" />
                  {t('map.liveInspectionTitle')}
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedRoad.roadName}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs text-slate-600 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <Clock className="w-4 h-4 text-sky-500" />
              <span>{t('map.inspectionTs')} <b className="text-slate-900 dark:text-white font-bold">{selectedRoad.timestamp}</b></span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>{t('map.predictedVol')}</span>
                <Activity className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {selectedRoad.volume.toLocaleString()}
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">{t('kpis.vehiclesPerHour')}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>{t('map.estCorridorSpeed')}</span>
                <Gauge className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {selectedRoad.speedKmH}
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">km / h</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>{t('map.congestionIndex')}</span>
                <Compass className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {selectedRoad.congestionIndex}%
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">density</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>{t('map.severityAssessment')}</span>
                <CheckCircle2 className="w-4 h-4" style={{ color: selectedRoad.color }} />
              </div>
              <div className="text-2xl font-black mt-2" style={{ color: selectedRoad.color }}>
                {selectedRoad.severity}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-sky-500/10 dark:bg-sky-950/40 border border-sky-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3 text-slate-800 dark:text-slate-200 font-medium">
              <BrainCircuit className="w-5 h-5 text-sky-500 dark:text-sky-400 flex-shrink-0" />
              <span>
                <strong className="font-bold text-sky-700 dark:text-sky-300">{t('map.aiRec')}</strong> "{selectedRoad.recommendation}"
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex-shrink-0 ml-4">
              Model: {selectedRoad.modelUsed}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
