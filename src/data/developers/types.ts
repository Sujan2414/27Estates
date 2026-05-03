export type DeveloperFaq = { question: string; answer: string };

export type Developer = {
    slug: string;
    name: string;          // Display name, e.g. "Prestige Group"
    dbName: string;        // Exact value used in projects.developer_name
    dbAliases?: string[];  // Optional alternate spellings to also match
    founded?: number;
    headquarters?: string;
    brief: string;
    metaTitle: string;
    metaDescription: string;
    faqs: DeveloperFaq[];
    noindex: boolean;
};
