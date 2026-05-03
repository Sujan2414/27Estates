export type AreaFaq = { question: string; answer: string };

export type AreaGuide = {
    slug: string;
    name: string;
    city: string;
    state: string;
    metaTitle: string;
    metaDescription: string;
    intro: string;
    priceRangePerSqft?: { min: number; max: number; currency: 'INR' };
    topProjectKeywords?: string[];
    infrastructure: string;
    investmentOutlook: string;
    faqs: AreaFaq[];
    noindex: boolean;
};
