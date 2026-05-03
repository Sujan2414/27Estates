import { whitefield } from './whitefield';
import { sarjapurRoad } from './sarjapur-road';
import { koramangala } from './koramangala';
import { hsrLayout } from './hsr-layout';
import { electronicCity } from './electronic-city';
import { indiranagar } from './indiranagar';
import type { AreaGuide } from './types';

export const ALL_AREAS: AreaGuide[] = [
    whitefield,
    sarjapurRoad,
    koramangala,
    hsrLayout,
    electronicCity,
    indiranagar,
];

export function getAreaBySlug(slug: string): AreaGuide | undefined {
    return ALL_AREAS.find((a) => a.slug === slug);
}

export function getAllAreaSlugs(): string[] {
    return ALL_AREAS.map((a) => a.slug);
}

export type { AreaGuide } from './types';
