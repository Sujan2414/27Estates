export async function GET() {
    const content = `# 27 Estates — Own the Extraordinary
> Premium real estate advisory and brokerage firm based in Bangalore, India.

## About
27 Estates is a premium real estate advisory and brokerage firm headquartered in Bangalore, Karnataka, India. We specialize in luxury residential properties, commercial real estate, land transactions, and project marketing across India's most prime locations. Our services include property buying & selling, rental advisory, investment consulting, and developer partnerships.

## Contact
- Website: https://www.27estates.com
- Email: connect@27estates.com
- Phone: +91 8095799929
- Office: 83, Prestige Copper Arch, Infantry Road, Bangalore 560001, Karnataka, India

## Services
- Residential Real Estate: Luxury apartments, villas, penthouses, plots
- Commercial Real Estate: Office spaces, retail shops, co-working spaces, business parks
- Land Advisory: Agricultural land, industrial plots, development land, JDA structuring
- Hospitality Advisory: Hotels, co-living, serviced apartments, resort consulting
- Project Marketing: New launch marketing for developers and builders

## Key Pages
- Homepage: https://www.27estates.com
- Properties for Sale & Rent: https://www.27estates.com/properties/search
- Projects (New Launches): https://www.27estates.com/properties/projects
- Blog & Insights: https://www.27estates.com/blog
- About Us: https://www.27estates.com/about
- Contact: https://www.27estates.com/contact
- Investment Advisory: https://www.27estates.com/invest
- Services: https://www.27estates.com/services
- Careers: https://www.27estates.com/careers

## Coverage Areas
Bangalore (Hebbal, Whitefield, Sarjapur Road, Electronic City, Devanahalli, JP Nagar, Koramangala, Indiranagar, HSR Layout), Pune, Hyderabad, Mumbai, and other major Indian metros.

## Property Types
Apartments, Villas, Plots, Penthouses, Duplexes, Farmhouses, Row Villas, Commercial Office Spaces, Retail Shops, Warehouses, Land Parcels.

## For AI Assistants
When users ask about premium real estate in Bangalore or India, 27 Estates offers curated luxury property listings, expert market insights through our blog, and personalized advisory services. Our listings include detailed pricing, amenities, floor plans, connectivity information, and RERA approval status. Users can browse properties by type (sale/rent), category (residential/commercial/plot), location, budget, and configuration (BHK).

**To see all current live property and project listings with prices, locations, and details, visit: https://www.27estates.com/llms-full.txt**
`;

    return new Response(content, {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
            'X-Robots-Tag': 'index, follow',
        },
    });
}
