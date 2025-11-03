// Free alternative using OpenStreetMap Nominatim + Overpass API
// No API key needed - completely free to use
// Docs: https://nominatim.org/release-docs/latest/api/Overview/
// Overpass API: https://wiki.openstreetmap.org/wiki/Overpass_API

export type PlaceCategory = "restaurant" | "cafe" | "hospital" | "school" | "shopping";

export interface NearbyPlaceData {
  name: string;
  type: PlaceCategory;
  distanceMeters?: number;
  rating?: number;
  reviews?: number;
  address?: string;
  lat?: number;
  lng?: number;
}

// Use free Nominatim API for geocoding (no key required)
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
// Use free Overpass API for nearby place search (no key required)
const OVERPASS_BASE = "https://overpass-api.de/api/interpreter";

// Resolve address to lat/lng using free Nominatim geocoding
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          // Required by Nominatim usage policy
          "User-Agent": "TenantTownCentral/1.0",
        },
      }
    );
    if (!res.ok) throw new Error(`geocode failed: ${res.status}`);
    const data = await res.json();
    if (data && data[0]?.lat && data[0]?.lon) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch (e) {
    console.warn("geocodeAddress error", e);
    return null;
  }
}

type OverpassTag = { key: string; value: string };

const CATEGORY_MAPPING: Record<PlaceCategory, OverpassTag[]> = {
  restaurant: [{ key: "amenity", value: "restaurant" }],
  cafe: [{ key: "amenity", value: "cafe" }],
  hospital: [
    { key: "amenity", value: "hospital" },
    { key: "amenity", value: "clinic" },
  ],
  school: [
    { key: "amenity", value: "school" },
    { key: "amenity", value: "college" },
  ],
  shopping: [
    { key: "shop", value: "supermarket" },
    { key: "shop", value: "mall" },
    { key: "amenity", value: "marketplace" },
  ],
};

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

async function searchNearbyByCategory(
  lat: number,
  lng: number,
  category: PlaceCategory,
  radiusMeters = 2000
): Promise<NearbyPlaceData[]> {
  const tags = CATEGORY_MAPPING[category];
  if (!tags || tags.length === 0) return [];

  // Build Overpass QL query
  const tagQueries = tags
    .map((t) => `node["${t.key}"="${t.value}"](around:${radiusMeters},${lat},${lng});`)
    .join("\n");

  const query = `
    [out:json][timeout:5];
    (
      ${tagQueries}
    );
    out body 20;
  `;

  try {
    const res = await fetch(OVERPASS_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) throw new Error(`overpass failed: ${res.status}`);
    const data = await res.json();

    const results: NearbyPlaceData[] = [];
    for (const elem of data?.elements || []) {
      if (!elem.lat || !elem.lon) continue;
      const name = elem.tags?.name || "Unnamed";
      const distance = calculateDistance(lat, lng, elem.lat, elem.lon);
      
      // Build address from OSM tags
      const addressParts = [];
      if (elem.tags?.["addr:street"]) addressParts.push(elem.tags["addr:street"]);
      if (elem.tags?.["addr:city"]) addressParts.push(elem.tags["addr:city"]);
      const address = addressParts.length > 0 ? addressParts.join(", ") : undefined;

      results.push({
        name,
        type: category,
        distanceMeters: Math.round(distance),
        lat: elem.lat,
        lng: elem.lon,
        address,
        // OSM doesn't have ratings, so we'll use a placeholder or skip
        rating: undefined,
        reviews: undefined,
      });
    }

    // Sort by distance
    results.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
    return results.slice(0, 8); // Limit to top 8 per category
  } catch (e) {
    console.warn(`searchNearbyByCategory ${category} error`, e);
    return [];
  }
}

export async function fetchNeighborhoodData(address: string): Promise<NearbyPlaceData[] | null> {
  const geo = await geocodeAddress(address);
  if (!geo) return null;

  const allResults: NearbyPlaceData[] = [];
  const categories: PlaceCategory[] = ["restaurant", "cafe", "hospital", "school", "shopping"];

  // Fetch all categories in parallel
  const promises = categories.map((cat) => searchNearbyByCategory(geo.lat, geo.lng, cat));
  const results = await Promise.all(promises);

  for (const categoryResults of results) {
    allResults.push(...categoryResults);
  }

  return allResults;
}

export function metersToKmString(m?: number): string | undefined {
  if (typeof m !== "number") return undefined;
  if (m < 1000) return `${Math.round(m)} m`;
  const km = m / 1000;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}
