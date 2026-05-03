import { prestigeGroup } from './prestige-group';
import { sobha } from './sobha';
import { godrej } from './godrej';
import { brigade } from './brigade';
import { lodha } from './lodha';
import type { Developer } from './types';

export const ALL_DEVELOPERS: Developer[] = [
    prestigeGroup,
    sobha,
    godrej,
    brigade,
    lodha,
];

export function getDeveloperBySlug(slug: string): Developer | undefined {
    return ALL_DEVELOPERS.find((d) => d.slug === slug);
}

export function getAllDeveloperSlugs(): string[] {
    return ALL_DEVELOPERS.map((d) => d.slug);
}

export type { Developer } from './types';
