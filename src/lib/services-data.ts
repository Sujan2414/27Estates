export interface ProcessStep {
    title: string;
    description: string;
}

export interface Benefit {
    title: string;
    description: string;
}

export interface Stat {
    value: string;
    label: string;
}

export interface FAQ {
    question: string;
    answer: string;
}

export interface Service {
    id: string;
    title: string;
    description: string;
    slug: string;
    image: string;
    heroTitle: string;
    heroImage: string;
    heroCta: string;
    serviceList: string[];
    insights: string[];
    ctaTitle: string;
    // Rich content fields
    overview: string;
    detailedDescription: string;
    process: ProcessStep[];
    benefits: Benefit[];
    stats: Stat[];
    faqs: FAQ[];
    whyChooseUs: string[];
    featuredImage: string;
}

export const services: Service[] = [
    {
        id: "corporate",
        title: "Corporate Real Estate",
        description: "Unlock premium office spaces for GCCs and MNCs.",
        slug: "corporate-real-estate",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200",
        heroTitle: "Unlock Premium Office Spaces for GCCs and MNCs",
        heroImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2070",
        heroCta: "Get Quote",
        serviceList: [
            "Tenant representation and lease structuring",
            "Renewal negotiations and rent reviews",
            "Flexible workspaces and portfolio optimization",
            "Build-to-suit solutions for large occupiers",
            "Workplace strategy and space planning",
            "Transaction management and due diligence"
        ],
        insights: [
            "India is projected to add over 80 million sq. ft. of Grade A office space by 2027, with Bangalore leading absorption at 25%.",
            "GCC setups have increased by 40% year-over-year, with technology and BFSI sectors driving demand for premium workspaces.",
            "Flexible workspace adoption in corporate portfolios has risen from 5% to 18% post-pandemic, reshaping lease strategies.",
            "Green-certified buildings command 12-15% rental premiums, with WELL and LEED certifications becoming tenant mandates."
        ],
        ctaTitle: "Get a Custom Quote",
        overview: "Our Corporate Real Estate practice helps Global Capability Centers, multinational corporations, and large enterprises find and optimize their workspace footprint across India's top-tier markets.",
        detailedDescription: "With over a decade of experience advising Fortune 500 companies and high-growth startups alike, we bring institutional-grade advisory to every engagement. From site selection and lease negotiation to portfolio optimization and workplace strategy, our end-to-end approach ensures your real estate decisions align perfectly with your business objectives. We understand that corporate real estate is not just about square footage — it's about creating environments that attract talent, foster innovation, and drive business performance.",
        process: [
            {
                title: "Requirement Analysis",
                description: "We begin with a deep dive into your business objectives, growth projections, workforce strategy, and budget parameters to define precise real estate requirements."
            },
            {
                title: "Market Intelligence",
                description: "Our research team provides granular market analysis including micro-market comparisons, rental benchmarking, infrastructure mapping, and future development corridors."
            },
            {
                title: "Shortlisting & Site Visits",
                description: "We curate a targeted shortlist of properties that match your criteria, arrange site visits, and provide detailed comparison reports with our recommendations."
            },
            {
                title: "Negotiation & Structuring",
                description: "Our transaction experts negotiate favorable commercial terms, structure lease agreements, and ensure regulatory compliance at every stage."
            },
            {
                title: "Fit-out & Handover",
                description: "We coordinate with architects, contractors, and project managers to ensure seamless fit-out execution and timely move-in."
            }
        ],
        benefits: [
            {
                title: "Cost Optimization",
                description: "Our market intelligence and negotiation expertise consistently deliver 10-20% savings on lease costs compared to market rates."
            },
            {
                title: "Speed to Market",
                description: "Established relationships with developers and a pre-vetted inventory enable faster decision-making and accelerated timelines."
            },
            {
                title: "Risk Mitigation",
                description: "Thorough due diligence, compliance checks, and structured documentation protect your interests throughout the lease lifecycle."
            },
            {
                title: "Future-Ready Spaces",
                description: "We factor in growth projections, technology requirements, and workplace trends to ensure your space remains relevant."
            }
        ],
        stats: [
            { value: "50+", label: "GCC Setups Annually" },
            { value: "8M+", label: "Sq. Ft. Transacted" },
            { value: "95%", label: "Client Retention Rate" },
            { value: "15+", label: "Years of Experience" }
        ],
        faqs: [
            {
                question: "What size of office spaces do you typically handle?",
                answer: "We handle corporate requirements ranging from 5,000 sq. ft. to 500,000+ sq. ft. across single and multi-city portfolios. Our sweet spot is mid-to-large occupiers looking for 20,000-200,000 sq. ft."
            },
            {
                question: "Which cities do you operate in?",
                answer: "While our primary expertise is in Bangalore, we have network partners across Mumbai, Hyderabad, Pune, Chennai, Delhi-NCR, and other Tier 1 cities for pan-India mandates."
            },
            {
                question: "Do you charge the tenant or the landlord?",
                answer: "Our fees are typically borne by the landlord/developer in leasing transactions. For advisory mandates and portfolio optimization engagements, we work on a transparent fee structure agreed upfront."
            },
            {
                question: "How long does a typical corporate leasing process take?",
                answer: "From requirement briefing to lease execution, a standard transaction takes 8-12 weeks. Build-to-suit projects typically require 12-18 months including construction."
            }
        ],
        whyChooseUs: [
            "Deep relationships with every major developer and landlord in Bangalore's commercial market",
            "Dedicated research team providing real-time market intelligence and rental benchmarks",
            "End-to-end project management from site selection through fit-out completion",
            "Proven track record with global brands including Zepto, Beckn, and numerous Fortune 500 GCCs"
        ],
        featuredImage: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80"
    },
    {
        id: "residential",
        title: "Residential Real Estate",
        description: "Primary sales, resales, and management representing luxury homes.",
        slug: "residential-real-estate",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200",
        heroTitle: "Primary Sales, Resales, and Luxury Home Management",
        heroImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2053",
        heroCta: "Submit Requirements",
        serviceList: [
            "Buying and renting advisory for premium homes",
            "Property management and tenant sourcing",
            "Investment analysis and portfolio advisory",
            "Resale and secondary market transactions",
            "NRI investment advisory and documentation",
            "Interior design coordination and move-in support"
        ],
        insights: [
            "Bangalore's luxury residential market (INR 3 Cr+) has grown 35% year-over-year, outpacing all other Indian metros in the segment.",
            "North Bangalore corridors around Hebbal and Yelahanka are witnessing 15-20% annual appreciation driven by infrastructure development.",
            "NRI investments in Bangalore residential real estate have surged 45%, with IT corridors and villa communities being top preferences.",
            "The average ticket size for luxury apartments in Bangalore has crossed INR 4.5 Crore, reflecting the city's maturing premium segment."
        ],
        ctaTitle: "Submit Your Requirements",
        overview: "Our Residential Real Estate practice is designed for discerning homebuyers, investors, and NRIs seeking premium properties in Bangalore's most coveted neighborhoods.",
        detailedDescription: "Whether you're purchasing your dream villa, investing in a high-appreciation corridor, or managing a rental portfolio, our advisors bring deep local knowledge and a curated inventory of Bangalore's finest homes. We go beyond traditional brokerage — our advisory model ensures that every transaction is backed by thorough market research, legal due diligence, and post-purchase support. From ultra-luxury penthouses to gated villa communities, we represent the most prestigious developments across Bangalore.",
        process: [
            {
                title: "Lifestyle Consultation",
                description: "We understand your lifestyle preferences, family requirements, commute patterns, budget, and investment horizon to recommend the right neighborhoods and property types."
            },
            {
                title: "Curated Selection",
                description: "From our exclusive inventory of pre-vetted properties, we present a handpicked selection with detailed insights on pricing, appreciation potential, and developer reputation."
            },
            {
                title: "Site Visits & Evaluation",
                description: "We arrange personalized property tours, provide comparative analysis, and share our honest assessment of each option's strengths and considerations."
            },
            {
                title: "Negotiation & Documentation",
                description: "Our transaction team handles price negotiation, agreement drafting, RERA compliance verification, and coordinates with legal counsel for seamless closings."
            },
            {
                title: "Post-Purchase Support",
                description: "From loan processing coordination to interior design referrals and property management setup, we ensure a smooth transition into your new home."
            }
        ],
        benefits: [
            {
                title: "Exclusive Access",
                description: "Pre-launch access to premium projects and off-market listings that aren't available through conventional channels."
            },
            {
                title: "Investment Intelligence",
                description: "Data-driven recommendations backed by micro-market analysis, price trends, and infrastructure development insights."
            },
            {
                title: "End-to-End Service",
                description: "From property search to key handover, including legal verification, loan assistance, and interior coordination."
            },
            {
                title: "NRI-Friendly Process",
                description: "Specialized support for overseas buyers including virtual tours, power of attorney guidance, and FEMA compliance."
            }
        ],
        stats: [
            { value: "500+", label: "Homes Sold" },
            { value: "INR 2000 Cr+", label: "Transaction Value" },
            { value: "200+", label: "Premium Projects" },
            { value: "98%", label: "Client Satisfaction" }
        ],
        faqs: [
            {
                question: "Do you handle both new launches and resale properties?",
                answer: "Yes, we handle primary sales (new launches from developers), resale/secondary market transactions, and rental properties. Our inventory covers apartments, villas, plots, and penthouses."
            },
            {
                question: "What is your service area in Bangalore?",
                answer: "We cover all premium residential corridors including North Bangalore (Hebbal, Yelahanka, Devanahalli), East Bangalore (Whitefield, Sarjapur Road), South Bangalore (JP Nagar, Bannerghatta), and Central Bangalore."
            },
            {
                question: "Can you help NRIs purchase property remotely?",
                answer: "Absolutely. We offer virtual property tours, handle all documentation through power of attorney, coordinate with banks for NRI home loans, and ensure full FEMA compliance for overseas buyers."
            },
            {
                question: "Do you provide property management services?",
                answer: "Yes, our property management vertical handles tenant sourcing, rent collection, maintenance coordination, and periodic property inspections for owners who prefer a hands-off approach."
            }
        ],
        whyChooseUs: [
            "Exclusive channel partner relationships with Bangalore's top 50 premium developers",
            "In-house legal team for title verification and documentation support",
            "Dedicated NRI desk with multilingual advisors and global timezone availability",
            "Post-sale support including interior design, property management, and resale advisory"
        ],
        featuredImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
    },
    {
        id: "warehousing",
        title: "Warehousing & Logistics",
        description: "Strategic logistics hubs and industrial park solutions.",
        slug: "warehousing-logistics",
        image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200",
        heroTitle: "Strategic Logistics Hubs and Industrial Solutions",
        heroImage: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=2070",
        heroCta: "Search Warehouses",
        serviceList: [
            "Landlord and tenant representation for warehouses",
            "Technical due diligence and compliance audits",
            "Lease renewals and rent optimization for industrial parks",
            "Build-to-suit warehouse development advisory",
            "Cold chain and specialized storage solutions",
            "Last-mile distribution center site selection"
        ],
        insights: [
            "India's warehousing sector is projected to reach 500 million sq. ft. by 2027, growing at a CAGR of 25%, driven by e-commerce and 3PL expansion.",
            "Grade A warehouse rents in Bangalore have appreciated 8-12% annually, with the Nelamangala-Dobaspet belt emerging as the premium logistics corridor.",
            "Institutional investment in Indian warehousing has crossed $5 billion, with global funds like Blackstone, Brookfield, and GLP leading acquisitions.",
            "E-commerce fulfillment centers now account for 35% of new warehouse demand, with companies seeking multi-level sortation facilities near urban centers."
        ],
        ctaTitle: "Start Your Search",
        overview: "Our Warehousing and Logistics practice provides end-to-end solutions for occupiers, developers, and investors in India's fast-growing industrial and logistics real estate sector.",
        detailedDescription: "As e-commerce, quick-commerce, and third-party logistics reshape supply chains, the demand for modern, Grade A warehousing has never been higher. Our team combines deep sector expertise with on-ground market intelligence to help clients find the right facility — whether it's a 50,000 sq. ft. fulfillment center or a 5,00,000 sq. ft. distribution hub. We advise on location strategy, facility design, lease structuring, and compliance across Bangalore's key logistics corridors.",
        process: [
            {
                title: "Supply Chain Assessment",
                description: "We analyze your supply chain network, throughput requirements, proximity needs, and operational parameters to define the optimal facility profile."
            },
            {
                title: "Location Strategy",
                description: "Using our proprietary logistics mapping tools, we evaluate corridors based on highway connectivity, labor availability, regulatory environment, and proximity to demand centers."
            },
            {
                title: "Facility Evaluation",
                description: "Our technical team conducts comprehensive assessments including structural audits, fire safety compliance, loading bay specifications, and floor load capacity."
            },
            {
                title: "Commercial Negotiation",
                description: "We negotiate lease terms optimized for warehouse operations — including lock-in periods, escalation caps, maintenance responsibilities, and exit provisions."
            },
            {
                title: "Fit-out & Operations",
                description: "We coordinate racking systems, MHE planning, automation integration, and regulatory approvals to ensure your facility is operations-ready on schedule."
            }
        ],
        benefits: [
            {
                title: "Corridor Expertise",
                description: "Deep knowledge of every logistics corridor around Bangalore — from Nelamangala and Hoskote to Bidadi and Anekal."
            },
            {
                title: "Technical Rigor",
                description: "In-house technical assessments cover structural integrity, fire safety, electrical load, and compliance with the latest warehouse standards."
            },
            {
                title: "Developer Network",
                description: "Relationships with all major warehouse developers including Embassy Industrial Parks, Indospace, Welspun One, and ESR."
            },
            {
                title: "Cost Efficiency",
                description: "Our benchmarking data and negotiation expertise deliver optimal rent structures with favorable escalation and lock-in terms."
            }
        ],
        stats: [
            { value: "12M+", label: "Sq. Ft. Warehousing Transacted" },
            { value: "40+", label: "Logistics Parks Covered" },
            { value: "60+", label: "Corporate Clients" },
            { value: "3", label: "Key Corridors" }
        ],
        faqs: [
            {
                question: "What kind of warehouse facilities do you handle?",
                answer: "We handle Grade A and Grade B warehouses, cold storage facilities, fulfillment centers, manufacturing units, and build-to-suit developments ranging from 10,000 sq. ft. to 1,000,000+ sq. ft."
            },
            {
                question: "Which logistics corridors around Bangalore do you cover?",
                answer: "We cover all key corridors: Nelamangala-Dobaspet (NH4 towards Pune/Mumbai), Hoskote-Narsapura (NH75 towards Chennai), and Bidadi-Ramanagara (NH275 towards Mysore). We also cover emerging corridors around Devanahalli and Anekal."
            },
            {
                question: "Can you help with build-to-suit warehouse development?",
                answer: "Yes, we advise on BTS projects from land identification and developer selection to design review and construction monitoring. We ensure the facility is built to your exact operational specifications."
            },
            {
                question: "Do you handle cold chain and specialized storage?",
                answer: "Absolutely. We have experience with temperature-controlled facilities, pharmaceutical warehouses, hazardous material storage, and specialized e-commerce sortation centers."
            }
        ],
        whyChooseUs: [
            "Largest warehousing transaction database in the Bangalore market",
            "In-house technical team for facility audits and compliance verification",
            "Relationships with all Tier 1 warehouse developers and industrial park operators",
            "Specialized expertise in e-commerce, cold chain, and quick-commerce logistics"
        ],
        featuredImage: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80"
    },
    {
        id: "land",
        title: "Land & Industrial",
        description: "Land acquisition, JV structuring, and industrial advisory.",
        slug: "land-industrial",
        image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1200",
        heroTitle: "Land Acquisition, JV Structuring, and Industrial Advisory",
        heroImage: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=2013",
        heroCta: "Land Query",
        serviceList: [
            "Industrial land purchase and disposal advisory",
            "Operator search and build-to-suit coordination",
            "Advisory for factories, SEZs, and industrial zones",
            "Joint venture structuring for development projects",
            "Land aggregation for large-scale developments",
            "Regulatory and zoning compliance advisory"
        ],
        insights: [
            "Karnataka's pro-business policies and industrial incentives have attracted INR 25,000 Cr+ in manufacturing investments over the past 3 years.",
            "Land values along Bangalore's peripheral corridors have appreciated 20-30% annually, driven by infrastructure projects including the Satellite Town Ring Road.",
            "KIADB and private industrial parks are seeing record demand for ready-to-build plots, with occupancy rates exceeding 90% in established zones.",
            "Joint development agreements in Bangalore have evolved with more sophisticated revenue-sharing models, reducing risk for both landowners and developers."
        ],
        ctaTitle: "Submit Land Query",
        overview: "Our Land and Industrial practice helps manufacturers, developers, and investors navigate the complexities of land acquisition, industrial site selection, and joint venture structuring across Karnataka.",
        detailedDescription: "Land transactions in India are among the most complex real estate engagements — involving title verification, zoning regulations, conversion processes, and regulatory approvals. Our specialized team brings decades of combined experience in handling large-scale land deals, from greenfield industrial acquisitions to joint development agreements for residential and mixed-use projects. We work with both buyers and sellers, providing transparent valuations, legal due diligence support, and end-to-end transaction management.",
        process: [
            {
                title: "Requirement Mapping",
                description: "We define your land requirements including acreage, zoning classification, infrastructure needs, proximity parameters, and budget to identify the right parcels."
            },
            {
                title: "Land Identification & Survey",
                description: "Our ground team identifies suitable parcels, conducts physical surveys, verifies boundaries, checks encumbrances, and assesses access roads and utilities."
            },
            {
                title: "Legal Due Diligence",
                description: "Our legal partners conduct thorough title searches (30+ years), verify land use permissions, check for pending litigation, and ensure clear ownership chains."
            },
            {
                title: "Valuation & Negotiation",
                description: "We provide fair market valuations based on recent comparable transactions and negotiate terms that protect your interests, including payment structures and contingencies."
            },
            {
                title: "Registration & Transfer",
                description: "We coordinate the entire registration process including stamp duty optimization, mutation, conversion (if required), and possession handover."
            }
        ],
        benefits: [
            {
                title: "Ground Intelligence",
                description: "Physical verification of every parcel with boundary surveys, access checks, and utility mapping that prevents costly surprises."
            },
            {
                title: "Legal Certainty",
                description: "Multi-layered due diligence process that verifies titles, permissions, encumbrances, and compliance before you commit."
            },
            {
                title: "Regulatory Navigation",
                description: "Expert guidance on land use conversion, KIADB processes, environmental clearances, and industrial approvals."
            },
            {
                title: "JV Structuring",
                description: "Sophisticated deal structuring for joint developments with fair risk allocation, milestone-based payments, and transparent revenue sharing."
            }
        ],
        stats: [
            { value: "2000+", label: "Acres Transacted" },
            { value: "INR 5000 Cr+", label: "Land Deal Value" },
            { value: "75+", label: "Industrial Clients" },
            { value: "100%", label: "Title Verification Rate" }
        ],
        faqs: [
            {
                question: "What types of land parcels do you deal with?",
                answer: "We handle agricultural land (with conversion advisory), industrial plots (KIADB, private parks), residential development land, commercial land parcels, and mixed-use development sites. Our typical transaction size ranges from 1 acre to 200+ acres."
            },
            {
                question: "How do you ensure clean land titles?",
                answer: "We engage certified legal teams to conduct 30-year title searches, verify encumbrance certificates, check revenue records, validate mutations, and confirm there are no pending disputes or government acquisition notices."
            },
            {
                question: "Can you help with land use conversion?",
                answer: "Yes, we advise on the complete conversion process from agricultural to non-agricultural use, including DC conversion, revenue department approvals, and compliance with Karnataka Land Revenue Act provisions."
            },
            {
                question: "Do you structure joint development agreements?",
                answer: "Absolutely. We've structured JDAs for both residential and commercial developments, advising on revenue-sharing models, milestone payments, RERA implications, and exit mechanisms for all parties."
            }
        ],
        whyChooseUs: [
            "Ground-level presence in all key development corridors around Bangalore",
            "Network of verified land aggregators and village-level contacts for off-market deals",
            "In-house legal advisory for title verification and conversion processes",
            "Experience with institutional-grade transactions including PE-backed acquisitions"
        ],
        featuredImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"
    },
    {
        id: "hospitality",
        title: "Hospitality & Retail",
        description: "Hotels, malls, and pop-ups with retail footage.",
        slug: "hospitality-retail",
        image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&q=80&w=1200",
        heroTitle: "Hotels, Malls, High-Street Retail, and Pop-Up Solutions",
        heroImage: "https://images.unsplash.com/photo-1519642918688-7e43b19245d8?auto=format&fit=crop&q=80&w=2076",
        heroCta: "Explore Spaces",
        serviceList: [
            "High-street and mall leasing advisory",
            "Retail design, build, and fit-out coordination",
            "Hospitality venue and hotel site advisory",
            "Pop-up and experiential retail space sourcing",
            "Food & beverage location strategy",
            "Brand expansion and multi-city rollout planning"
        ],
        insights: [
            "Bangalore's organized retail footprint is expected to grow by 30% over the next 3 years, with new mall developments in Whitefield, Hebbal, and Devanahalli.",
            "High-street retail rents on Bangalore's prime corridors (Indiranagar, Koramangala, Church Street) have surged 25% post-pandemic as experiential retail gains momentum.",
            "The hotel sector in Bangalore is witnessing record occupancy of 78%, with branded room inventory set to expand by 4,000 keys by 2028.",
            "Pop-up retail and experiential brand activations have become a INR 500 Cr+ market in Bangalore, with D2C brands leading the trend."
        ],
        ctaTitle: "Explore Available Spaces",
        overview: "Our Hospitality and Retail practice helps brands, restaurateurs, hotel operators, and retail chains find the perfect space to create memorable customer experiences in Bangalore's most vibrant locations.",
        detailedDescription: "From flagship stores on Indiranagar's 100 Feet Road to cloud kitchens in emerging neighborhoods, our retail advisory covers the full spectrum. We understand that retail real estate is fundamentally different — it's about footfall, visibility, adjacencies, and brand positioning. Our advisors combine real estate expertise with retail business acumen to help you find spaces that don't just fit your budget but drive your business forward. In hospitality, we advise hotel operators, co-living brands, and F&B concepts on site selection, lease structuring, and market entry strategy.",
        process: [
            {
                title: "Brand & Market Assessment",
                description: "We analyze your brand positioning, target demographics, footfall requirements, and competitive landscape to define the optimal location strategy."
            },
            {
                title: "Location Scouting",
                description: "Our on-ground team identifies available spaces across malls, high streets, standalone properties, and mixed-use developments with detailed footfall and visibility analysis."
            },
            {
                title: "Feasibility & Deal Structuring",
                description: "We prepare financial feasibility models, negotiate revenue-share or fixed-rent structures, and ensure lease terms are aligned with retail business cycles."
            },
            {
                title: "Design & Fit-out Coordination",
                description: "We connect you with pre-vetted architects and contractors specializing in retail and hospitality interiors, managing the entire fit-out process."
            },
            {
                title: "Launch & Operations Support",
                description: "From regulatory approvals (FSSAI, fire NOC, trade license) to marketing tie-ups with mall management, we support you through launch and beyond."
            }
        ],
        benefits: [
            {
                title: "Footfall Intelligence",
                description: "Data-driven location analysis including pedestrian counts, vehicle traffic, demographic profiling, and competitive mapping."
            },
            {
                title: "Retail-Specific Expertise",
                description: "Understanding of retail lease structures including revenue share, minimum guarantee, CAM charges, and signage rights."
            },
            {
                title: "Brand Adjacencies",
                description: "Knowledge of tenant mix strategies to ensure your brand is positioned alongside complementary retailers and F&B concepts."
            },
            {
                title: "Multi-Location Rollout",
                description: "Scalable advisory for brands planning multi-city or multi-location expansion with standardized processes and vendor networks."
            }
        ],
        stats: [
            { value: "150+", label: "Retail Spaces Leased" },
            { value: "25+", label: "Malls & High Streets" },
            { value: "80+", label: "Brand Partners" },
            { value: "12", label: "Cities Covered" }
        ],
        faqs: [
            {
                question: "Do you handle both mall leasing and high-street retail?",
                answer: "Yes, we handle leasing across all retail formats — malls, high streets, standalone shops, kiosks, food courts, and pop-up spaces. We also advise on experiential retail and brand activation venues."
            },
            {
                question: "Can you help with hotel and hospitality site selection?",
                answer: "Absolutely. We advise hotel operators, co-living companies, serviced apartment brands, and resort developers on site selection, feasibility studies, and lease/management contract structuring."
            },
            {
                question: "What kind of F&B brands do you work with?",
                answer: "We work with standalone restaurants, QSR chains, cloud kitchen operators, breweries, cafes, and fine dining concepts. Our F&B advisory covers everything from high-street locations to food court spaces."
            },
            {
                question: "Do you support pop-up and short-term retail leases?",
                answer: "Yes, we have a dedicated pop-up advisory desk that helps D2C brands, luxury labels, and seasonal businesses find short-term spaces ranging from 1 week to 6 months across malls and event venues."
            }
        ],
        whyChooseUs: [
            "Relationships with every major mall operator and high-street landlord in Bangalore",
            "Retail-specific market research including footfall data and consumer demographics",
            "Experience across F&B, fashion, electronics, luxury, and lifestyle retail segments",
            "Successful track record with both India-entry brands and local multi-outlet expansions"
        ],
        featuredImage: "https://images.unsplash.com/photo-1519642918688-7e43b19245d8?auto=format&fit=crop&w=1200&q=80"
    },
    {
        id: "marketing-mandate",
        title: "Marketing and Mandate",
        description: "Strategic marketing, sales mandates, and 360° branding for developers.",
        slug: "marketing-mandate",
        image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=1200",
        heroTitle: "Strategic Marketing & Exclusive Sales Mandates",
        heroImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=2070",
        heroCta: "Discuss a Mandate",
        serviceList: [
            "Exclusive project sales mandates",
            "360° marketing strategy and execution",
            "Project branding, naming, and positioning",
            "Digital marketing and lead generation",
            "Marketing collateral and brochure design",
            "Sales gallery and customer experience design"
        ],
        insights: [
            "Projects with strong brand narratives command a 12-15% price premium over comparable non-branded developments in similar micro-markets.",
            "Digital-first launches are now generating 65% of pre-sales velocity, reducing the reliance on traditional print media by half.",
            "The 'Experience Center' concept has revolutionized sales conversions, with immersive walkthroughs increasing closure rates by 40%.",
            "Integrated mandate models (Sales + Marketing) reduce developer overheads by 30% while aligning incentives for faster inventory liquidation."
        ],
        ctaTitle: "Partner With Us",
        overview: "We act as the strategic growth partner for developers, taking complete ownership of project marketing and sales through exclusive mandates and integrated go-to-market strategies.",
        detailedDescription: "In a competitive real estate landscape, a project's success is defined not just by its construction quality but by its market positioning. Our Marketing and Mandate division bridges the gap between architectural vision and market reality. We don't just sell inventory; we build desire. From crafting a project's marketing strategy and designing high-impact collateral to deploying trained sales teams and managing the entire go-to-market execution, we offer a turnkey solution. We treat your project as our own, ensuring that every marketing campaign and sales pitch is calibrated to maximize realization and velocity.",
        process: [
            {
                title: "Discovery & Positioning",
                description: "We analyze the land potential, target demographic, and competitive landscape to define a unique market position and pricing strategy."
            },
            {
                title: "Brand Identity Creation",
                description: "Our creative team crafts the project name, logo, visual language, and master narrative that resonates with the aspirations of the target buyer."
            },
            {
                title: "Collateral & Assets",
                description: "We produce brochure design, 3D visualizations, walkthrough videos, website development, and sales deck creation ensuring a premium cohesive look."
            },
            {
                title: "Go-to-Market Strategy",
                description: "We execute a 360-degree launch plan covering digital, print, PR, and channel partner activation to generate a high-quality sales funnel."
            },
            {
                title: "Sales Execution",
                description: "Our dedicated sales professionals manage site visits, negotiations, and closures, using CRM technology to track every lead to conversion."
            }
        ],
        benefits: [
            {
                title: "Higher Velocity",
                description: "Integrated sales and marketing efforts eliminate friction, leading to faster pre-sales and consistent inventory movement."
            },
            {
                title: "Premium Realization",
                description: "Strong branding and positioning allow projects to command a premium over market rates, directly impacting the bottom line."
            },
            {
                title: "Zero Distraction",
                description: "Developers can focus on construction and delivery while we handle the entire revenue generation engine."
            },
            {
                title: "Data-Driven Decisions",
                description: "Real-time market feedback, lead analytics, and pricing dynamic inputs help optimize strategies on the fly."
            }
        ],
        stats: [
            { value: "10+", label: "Exclusive Mandates" },
            { value: "2.5M+", label: "Sq. Ft. Managed" },
            { value: "INR 1200 Cr+", label: "Inventory Value" },
            { value: "35%", label: "Faster Sales Velocity" }
        ],
        faqs: [
            {
                question: "What is an exclusive sales mandate?",
                answer: "An exclusive mandate means we take full responsibility for selling your project. We deploy our own sales team, manage marketing, and coordinate channel partners, acting as your single point of contact for revenue."
            },
            {
                question: "Do you handle the creative branding in-house?",
                answer: "Yes, our creative team handles naming, logo design, brochures, websites, and ad creatives. This ensures the sales pitch and the marketing visuals are perfectly aligned."
            },
            {
                question: "How do you structure your commercial terms?",
                answer: "We typically work on a success-fee model (percentage of sales value) with a marketing retainer. This aligns our incentives with yours—we win when you sell."
            },
            {
                question: "Do you work with other channel partners in a mandate?",
                answer: "Yes, we act as the 'Master Channel Partner'. We activate and manage the entire broker network, ensuring they have the right collateral and training, while we control the pricing and inventory."
            }
        ],
        whyChooseUs: [
            "Proven track record of turning around stuck projects through re-branding and strategic pricing",
            "Unique blend of 'Agency' creativity and 'Brokerage' sales aggression",
            "Technology-led sales process providing complete transparency to developers",
            "Deep understanding of luxury buyer psychology and lifestyle marketing"
        ],
        featuredImage: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80"
    }
];
