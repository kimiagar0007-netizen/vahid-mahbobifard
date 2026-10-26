import { useSettings } from '../context/SettingsContext.jsx';
import { useSeo } from '../lib/seo.js';
import Hero from '../components/home/Hero.jsx';
import AboutIntro from '../components/home/AboutIntro.jsx';
import CategoryGrid from '../components/home/CategoryGrid.jsx';
import FeaturedProducts from '../components/home/FeaturedProducts.jsx';
import ServicesGrid from '../components/home/ServicesGrid.jsx';
import PortfolioHighlights from '../components/home/PortfolioHighlights.jsx';
import ProcessSteps from '../components/home/ProcessSteps.jsx';
import WhyUs from '../components/home/WhyUs.jsx';
import ReviewsCta, { CtaBand } from '../components/home/ReviewsCta.jsx';

export default function Home() {
  const { seo, brand, phone, address } = useSettings();

  const business = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: brand.name_fa,
    alternateName: brand.name_en,
    description: seo.default_description,
    ...(phone ? { telephone: phone } : {}),
    ...(address ? { address: { '@type': 'PostalAddress', streetAddress: address, addressCountry: 'IR' } } : {}),
  };

  useSeo({
    title: seo.default_title,
    description: seo.default_description,
    keywords: seo.keywords,
    image: seo.og_image,
    path: '/',
    siteUrl: seo.site_url,
    siteName: brand.name_fa,
    jsonLd: business,
  });

  return (
    <>
      <Hero />
      <AboutIntro />
      <CategoryGrid />
      <FeaturedProducts />
      <ServicesGrid />
      <PortfolioHighlights />
      <ProcessSteps />
      <WhyUs />
      <ReviewsCta />
      <CtaBand />
    </>
  );
}
