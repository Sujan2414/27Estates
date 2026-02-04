'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowRight, Building, Calendar } from 'lucide-react';

interface ProjectCardProps {
    id: string; // projects.id (uuid)
    project_name: string;
    location: string;
    min_price: string | null;
    max_price: string | null;
    bhk_options: string[] | null;
    image: string;
    status: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
    id,
    project_name,
    location,
    min_price,
    max_price,
    bhk_options,
    image,
    status,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
        >
            <Link href={`/projects/${id}`} className="block h-full">
                {/* Image Container */}
                <div className="relative h-64 overflow-hidden">
                    <Image
                        src={image || '/placeholder-project.jpg'}
                        alt={project_name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4 z-10">
                        <span className="px-3 py-1 bg-black/70 backdrop-blur-md text-white text-xs font-medium rounded-full uppercase tracking-wider">
                            {status}
                        </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                                {project_name}
                            </h3>
                            <div className="flex items-center text-gray-500 text-sm">
                                <MapPin className="w-4 h-4 mr-1" />
                                {location}
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mt-4 py-4 border-t border-gray-100">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Starting From</p>
                            <p className="font-semibold text-primary">
                                {min_price ? `${min_price}` : 'Price on Request'}
                                {max_price && ` - ${max_price}`}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Configurations</p>
                            <p className="font-medium text-gray-700 text-sm">
                                {bhk_options?.join(', ') || 'Various Options'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <Building className="w-4 h-4 text-primary" />
                            View Master Plan
                        </span>
                        <span className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                            <ArrowRight className="w-4 h-4" />
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default ProjectCard;
