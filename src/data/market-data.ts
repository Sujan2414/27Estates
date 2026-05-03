// Bangalore Real Estate Market Data — quarterly snapshot.
// Numbers below are placeholder ranges based on publicly-available 2026 Q1
// reports (CREDAI / 99acres / MagicBricks aggregate listings). Replace with
// 27 Estates internal CRM data + RERA filings before flipping the page from
// noindex to index.

export type AreaPriceTrend = {
    area: string;
    pricePerSqftMin: number;
    pricePerSqftMax: number;
    yoyChangePct: number;
    rentalYieldPct: number;
    typicalSegment: string;
    asOf: string; // ISO date
};

export const BANGALORE_PRICE_TRENDS: AreaPriceTrend[] = [
    { area: 'Whitefield',      pricePerSqftMin: 7200,  pricePerSqftMax: 11500, yoyChangePct: 7.2,  rentalYieldPct: 3.5, typicalSegment: 'Mid-luxury apartments + villas',         asOf: '2026-04-01' },
    { area: 'Sarjapur Road',   pricePerSqftMin: 6800,  pricePerSqftMax: 10500, yoyChangePct: 9.1,  rentalYieldPct: 3.7, typicalSegment: 'Mid-luxury apartments + plotted devts.', asOf: '2026-04-01' },
    { area: 'Koramangala',     pricePerSqftMin: 11000, pricePerSqftMax: 16000, yoyChangePct: 4.5,  rentalYieldPct: 2.8, typicalSegment: 'Premium apartments, retail',             asOf: '2026-04-01' },
    { area: 'HSR Layout',      pricePerSqftMin: 9000,  pricePerSqftMax: 13500, yoyChangePct: 6.0,  rentalYieldPct: 3.2, typicalSegment: 'Premium apartments',                     asOf: '2026-04-01' },
    { area: 'Electronic City', pricePerSqftMin: 5500,  pricePerSqftMax: 8500,  yoyChangePct: 8.4,  rentalYieldPct: 4.1, typicalSegment: 'Mid-segment apartments',                 asOf: '2026-04-01' },
    { area: 'Indiranagar',     pricePerSqftMin: 13000, pricePerSqftMax: 18500, yoyChangePct: 3.2,  rentalYieldPct: 2.5, typicalSegment: 'Ultra-luxury apartments, retail',        asOf: '2026-04-01' },
    { area: 'Hebbal',          pricePerSqftMin: 8500,  pricePerSqftMax: 12500, yoyChangePct: 6.8,  rentalYieldPct: 3.4, typicalSegment: 'Luxury apartments + villas',             asOf: '2026-04-01' },
    { area: 'Devanahalli',     pricePerSqftMin: 5500,  pricePerSqftMax: 8000,  yoyChangePct: 11.2, rentalYieldPct: 3.0, typicalSegment: 'Plotted developments, airport corridor', asOf: '2026-04-01' },
];

export const MARKET_HIGHLIGHTS = {
    asOfQuarter: 'Q1 2026',
    cityAverageYoY: 7.1, // % YoY
    bestPerformingArea: 'Devanahalli',
    bestRentalYieldArea: 'Electronic City',
    publishedBy: '27 Estates',
};
