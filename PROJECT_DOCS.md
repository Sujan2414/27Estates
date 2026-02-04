# Project Documentation: 21 Estates

## 1. Project Overview
**21 Estates** is a premium luxury real estate advisory platform. The website serves as a digital storefront to showcase high-end capabilities, services, and curated property selections. The design philosophy focuses on "Light Luxury"—clean, minimal, and sophisticated.

## 2. Tech Stack (Simple Terms)
We are using modern, robust technologies to ensure the site is fast, SEO-friendly, and easy to scale.
- **Next.js**: The core framework. It makes the website extremely fast and Google-friendly (SEO).
- **TypeScript**: Ensures code reliability and fewer bugs.
- **Tailwind CSS**: Used for styling. It allows us to build custom, pixel-perfect designs without fighting with pre-made templates.
- **Framer Motion**: Handles all the smooth animations (fade-ins, tickers, interactions) that give the "premium" feel.
- **Shadcn UI**: A collection of high-quality, re-usable components (like buttons, dialogs) that we can fully customize.

## 3. Design System
The visual identity is built around a specific "Light Luxury" palette.

### Colors
- **Primary Color (Dark Turquoise)**: `#1F524B`
  - Used for: Headings, Active Buttons, Backgrounds (Testimonials), Brand Elements.
- **Secondary Color (Gold)**: `#BFA270`
  - Used for: Accents, Dividers, Subtitles, Hover States.
- **Base Color (Light Grey)**: `#F6F6F5`
  - Used for: Website Backgrounds, Section Backgrounds (Welcome, Cards).

### Typography
- **Headings**: `Lexend Deca` (Clean, modern, readable).
- **Body Text**: `Inter` (Simple, neutral, professional).

## 4. Website Structure

### Current Pages
- **Home Page** (`/`): The main landing page.
  - *Hero Section*: Brand introduction.
  - *Welcome Section*: "About Us" digest.
  - *Services Carousel*: Interactive card slider for core services.
  - *Featured Properties*: Grid of curated listings.
  - *Testimonials*: Ticker of client success stories.
  - *Contact CTA*: Lead generation form/button.
- **Service Detail Pages** (`/services/[slug]`): Dynamic pages for specific services (e.g., Corporate Real Estate).

### Future Roadmap & Strategy

#### A. Property Listing Subdomain
**Plan**: Move the property search and detailed listings to a dedicated subdomain, likely `property.21estates.com`.
- **Why?**: Keeps the main site focused on "Advisory & Brand" while the subdomain acts as a functional "Search Engine".
- **Benefit**: Better SEO separation and allows for complex search features without slowing down the main brand site.

#### B. Dedicated Pages
To improve SEO and content depth, we will move away from single-page sections where appropriate:
- **Service Pages**: Each service (Residential, Commercial, etc.) will have its own full dedicated page with detailed info.
- **Blog Section**: A new section for "Market Insights" with individual pages for every article.

## 5. Implementation Notes
- **Responsive Design**: The site works on all devices (Mobile, Tablet, Desktop).
- **Performance**: Images are optimized, and unnecessary scripts are avoided.
- **Maintenance**: All data (properties, services, testimonials) is structured so it can be easily connected to a CMS (Content Management System) in the future.
