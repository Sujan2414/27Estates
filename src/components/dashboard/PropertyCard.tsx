'use client';

import { MapPin, BedDouble, Bath, Maximize, Heart, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// Define interface for Property props
export interface PropertyProps {
    id: string;
    title: string;
    description: string;
    location: string;
    price: number;
    image: string;
    propertyType: string; // 'Rent' or 'Sale'
    category: string; // 'Villa', 'Apartment', etc.
    rooms: number;
    bathrooms: number;
    sqft: number;
    isFeatured?: boolean;
}

interface PropertyCardProps {
    property: PropertyProps;
    isBookmarked?: boolean;
    onToggleBookmark?: (id: string) => void;
    isOwner?: boolean;
}

const PropertyCard = ({ property, isOwner = false, isBookmarked = false, onToggleBookmark }: PropertyCardProps) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[var(--dark-turquoise)] transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image Container */}
            <div className="aspect-[4/3] w-full overflow-hidden relative bg-gray-100">
                <Image
                    src={property.image}
                    alt={property.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[var(--dark-grey)] shadow-sm">
                        {property.propertyType}
                    </span>
                    <span className="bg-[var(--dark-turquoise)]/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                        {property.category}
                    </span>
                </div>

                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-2">
                    {isOwner ? (
                        <>
                            <button className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-[var(--dark-turquoise)] hover:text-white transition-all shadow-sm">
                                <Edit size={16} />
                            </button>
                            <button className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                <Trash2 size={16} />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onToggleBookmark?.(property.id);
                            }}
                            className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-sm group-hover:scale-110"
                        >
                            <Heart
                                size={18}
                                className={`transition-colors ${isBookmarked ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:fill-red-500 hover:text-red-500'}`}
                            />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3">
                {/* Location */}
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--dark-turquoise)] uppercase tracking-wide">
                    <MapPin size={14} />
                    <span>{property.location}</span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-heading font-semibold text-[var(--dark-grey)] truncate group-hover:text-[var(--dark-turquoise)] transition-colors">
                    {property.title}
                </h3>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 py-2 border-b border-gray-100">
                    <div className="flex items-center gap-1.5">
                        <BedDouble size={16} className="text-gray-400" />
                        <span>{property.rooms} Beds</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Bath size={16} className="text-gray-400" />
                        <span>{property.bathrooms} Baths</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Maximize size={16} className="text-gray-400" />
                        <span>{property.sqft} ft²</span>
                    </div>
                </div>

                {/* Price */}
                <div className="pt-1 flex items-baseline gap-1">
                    <span className="text-xl font-bold text-[var(--dark-grey)]">
                        ${property.price.toLocaleString()}
                    </span>
                    {property.propertyType === 'Rent' && (
                        <span className="text-sm text-gray-400 font-medium">/ month</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PropertyCard;
