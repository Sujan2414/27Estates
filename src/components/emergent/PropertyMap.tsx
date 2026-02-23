"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCoordinatesForLocation } from "@/lib/bangalore-geocode";

// Color palette for categories
const CATEGORY_COLORS: Record<string, string> = {
    "Apartment": "#2563EB",
    "House": "#EA580C",
    "Villa": "#16A34A",
    "Plot": "#CA8A04",
    "Commercial": "#DC2626",
    "Duplex": "#9333EA",
    "Penthouse": "#0891B2",
    "Farmhouse": "#65A30D",
    "Offices": "#4F46E5",
    "Row Villa": "#DB2777",
};

const DEFAULT_COLOR = "#737373";

function getColorForCategory(category?: string): string {
    if (!category) return DEFAULT_COLOR;
    return CATEGORY_COLORS[category] || DEFAULT_COLOR;
}

// Create a colored marker icon for a given hex color
function createColoredIcon(color: string): L.DivIcon {
    return L.divIcon({
        className: "",
        html: `<svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="${color}"/>
            <circle cx="12.5" cy="12.5" r="6" fill="white"/>
        </svg>`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    });
}

// Cache icons by color to avoid re-creating
const iconCache: Record<string, L.DivIcon> = {};
function getIconForCategory(category?: string): L.DivIcon {
    const color = getColorForCategory(category);
    if (!iconCache[color]) {
        iconCache[color] = createColoredIcon(color);
    }
    return iconCache[color];
}

// Default blue marker fallback
const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface MapItem {
    id: string;
    title: string;
    display_name?: string | null;
    project_name?: string | null;
    price?: number;
    price_text?: string | null;
    images: string[];
    location: string;
    latitude?: number | null;
    longitude?: number | null;
    type: "property" | "project";
    category?: string;
    // Project-specific fields
    min_price?: string | null;
    max_price?: string | null;
}

interface PropertyMapProps {
    properties: MapItem[];
    projects?: MapItem[];
}

const formatIndianRupee = (amount: number): string => {
    if (amount >= 10000000) {
        return `\u20B9${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
        return `\u20B9${(amount / 100000).toFixed(2)} L`;
    }
    return `\u20B9${amount.toLocaleString("en-IN")}`;
};

// Resolve coordinates: use stored lat/lng, or fall back to geocode lookup
function resolveCoords(item: MapItem): [number, number] | null {
    if (item.latitude != null && item.longitude != null) {
        return [item.latitude, item.longitude];
    }
    return getCoordinatesForLocation(item.location);
}

// Component to auto-fit map bounds to markers
function FitBounds({ items }: { items: MapItem[] }) {
    const map = useMap();
    const prevBoundsRef = useRef<string>("");

    useEffect(() => {
        const withCoords = items
            .map((item) => ({ item, coords: resolveCoords(item) }))
            .filter((x) => x.coords !== null);

        if (withCoords.length === 0) return;

        const boundsKey = withCoords
            .map((x) => `${x.coords![0]},${x.coords![1]}`)
            .join("|");

        if (boundsKey === prevBoundsRef.current) return;
        prevBoundsRef.current = boundsKey;

        const bounds = L.latLngBounds(
            withCoords.map((x) => x.coords as [number, number])
        );
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }, [items, map]);

    return null;
}

const PropertyMap = ({ properties, projects = [] }: PropertyMapProps) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const allItems = useMemo(() => [...properties, ...projects], [properties, projects]);

    const resolvedItems = useMemo(() => {
        return allItems
            .map((item) => ({ item, coords: resolveCoords(item) }))
            .filter((x) => x.coords !== null) as { item: MapItem; coords: [number, number] }[];
    }, [allItems]);

    // Collect unique categories present in the data for the legend
    const activeCategories = useMemo(() => {
        const cats = new Set<string>();
        allItems.forEach((item) => {
            if (item.category) cats.add(item.category);
        });
        return Array.from(cats).sort();
    }, [allItems]);

    const defaultCenter: [number, number] = [12.9716, 77.5946];
    const center =
        resolvedItems.length > 0
            ? resolvedItems[0].coords
            : defaultCenter;

    if (!mounted) {
        return <div style={{ height: "100%", width: "100%", borderRadius: "1rem", background: "#f5f5f5" }} />;
    }

    // Leaflet does not support React 18 strict mode well, 
    // we use a timestamp or unique string on remount to avoid "Map container is being reused"
    const mapKey = `map-${resolvedItems.length}-${center.join(',')}`;

    return (
        <MapContainer
            key={mapKey}
            center={center}
            zoom={12}
            style={{ height: "100%", width: "100%", borderRadius: "1rem" }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds items={allItems} />

            {resolvedItems.map(({ item, coords }) => {
                const isProject = item.type === "project";
                const detailUrl = isProject
                    ? `/projects/${item.id}`
                    : `/properties/${item.id}`;

                const priceDisplay = isProject
                    ? (item.min_price && item.max_price
                        ? `${item.min_price} - ${item.max_price}`
                        : item.min_price || item.max_price || "Price on request")
                    : (item.price_text || (item.price ? formatIndianRupee(item.price) : "Price on request"));

                const markerColor = getColorForCategory(item.category);

                return (
                    <Marker
                        key={`${item.type}-${item.id}`}
                        position={coords}
                        icon={getIconForCategory(item.category)}
                    >
                        <Popup>
                            <div style={{ minWidth: 200, maxWidth: 260 }}>
                                {item.images?.[0] && (
                                    <img
                                        src={item.images[0]}
                                        alt={item.title}
                                        style={{
                                            width: "100%",
                                            height: 120,
                                            objectFit: "cover",
                                            borderRadius: 8,
                                            marginBottom: 8,
                                        }}
                                    />
                                )}
                                {item.category && (
                                    <div style={{
                                        display: "inline-block",
                                        padding: "2px 8px",
                                        backgroundColor: `${markerColor}18`,
                                        color: markerColor,
                                        borderRadius: 4,
                                        fontSize: 10,
                                        fontWeight: 600,
                                        marginBottom: 6,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                    }}>
                                        {item.category}
                                    </div>
                                )}
                                <div
                                    style={{
                                        fontWeight: 600,
                                        fontSize: 14,
                                        marginBottom: 4,
                                        color: "#0a0a0a",
                                    }}
                                >
                                    {item.display_name ||
                                        item.project_name ||
                                        item.title}
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: "#737373",
                                        marginBottom: 6,
                                    }}
                                >
                                    {item.location}
                                </div>
                                <div
                                    style={{
                                        fontWeight: 700,
                                        fontSize: 15,
                                        color: "#0a0a0a",
                                        marginBottom: 8,
                                    }}
                                >
                                    {priceDisplay}
                                </div>
                                <a
                                    href={detailUrl}
                                    style={{
                                        display: "inline-block",
                                        padding: "6px 14px",
                                        backgroundColor: markerColor,
                                        color: "#fff",
                                        borderRadius: 6,
                                        fontSize: 12,
                                        fontWeight: 500,
                                        textDecoration: "none",
                                    }}
                                >
                                    View Details
                                </a>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}

            {/* Category Legend */}
            {activeCategories.length > 0 && (
                <CategoryLegend categories={activeCategories} />
            )}
        </MapContainer>
    );
};

function CategoryLegend({ categories }: { categories: string[] }) {
    const map = useMap();

    useEffect(() => {
        const legend = new L.Control({ position: "bottomright" });
        legend.onAdd = () => {
            const div = L.DomUtil.create("div");
            div.style.cssText = "background:white;padding:10px 14px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);font-size:11px;line-height:1.8;max-height:200px;overflow-y:auto";

            const rows = categories.map((cat) => {
                const color = getColorForCategory(cat);
                return `<div style="display:flex;align-items:center;gap:6px">
                    <svg width="12" height="20" viewBox="0 0 25 41"><path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="${color}"/></svg>
                    <span style="color:#333">${cat}</span>
                </div>`;
            }).join("");

            div.innerHTML = rows;
            return div;
        };
        legend.addTo(map);
        return () => { legend.remove(); };
    }, [map, categories]);

    return null;
}

export default PropertyMap;
