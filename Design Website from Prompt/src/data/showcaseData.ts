export interface ShowcaseItem {
  id: string;
  type: "MAKEUP" | "PARLOUR";
  category: string;
  title: string;
  description: string;
  image: string;
  highlight?: string;
}

export const MAKEUP_SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: "sc-mk-bridal-styles",
    type: "MAKEUP",
    category: "Bridal Makeup",
    title: "Bridal Makeup Styles",
    description: "Explore bridal makeup styles for wedding ceremonies, varmala, and grand receptions.",
    image: "https://images.unsplash.com/photo-1783495687666-ca55fe595de4?w=800&h=1000&fit=crop&auto=format&q=80",
    highlight: "Signature Look",
  },
  {
    id: "sc-mk-hd-bridal",
    type: "MAKEUP",
    category: "Bridal Makeup",
    title: "HD Bridal Looks",
    description: "High-definition photo-friendly bridal makeover looks customized for your ceremonies.",
    image: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&h=1000&fit=crop&auto=format&q=80",
    highlight: "Camera-Ready",
  },
  {
    id: "sc-mk-trad-bridal",
    type: "MAKEUP",
    category: "Bridal Makeup",
    title: "Traditional Bridal Looks",
    description: "Traditional Indian-inspired makeup styles can be customized for your occasion.",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1000&fit=crop&auto=format&q=80",
    highlight: "Classic Elegance",
  },
];

export interface ParlourSection {
  title: string;
  description: string;
  items: ShowcaseItem[];
}

export const PARLOUR_SHOWCASE_SECTIONS: ParlourSection[] = [
  {
    title: "Skin Care Showcase",
    description: "Examples of available facial and beauty skin care treatments.",
    items: [
      {
        id: "sc-par-facial",
        type: "PARLOUR",
        category: "Skin Care",
        title: "Facial & Skin Care",
        description: "Rejuvenating facial treatments tailored to cleanse, hydrate, and refresh your skin.",
        image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=1000&fit=crop&auto=format&q=80",
      },
      {
        id: "sc-par-glow-refresh",
        type: "PARLOUR",
        category: "Skin Care",
        title: "Glow & Refresh Care",
        description: "Skin-brightening and soothing care tailored for special occasions and functions.",
        image: "https://images.unsplash.com/photo-1761718210089-ba3bb5ccb54f?w=800&h=1000&fit=crop&auto=format&q=80",
      },
      {
        id: "sc-par-pre-bridal",
        type: "PARLOUR",
        category: "Skin Care",
        title: "Pre-Bridal Skin Care",
        description: "Specialized pre-wedding skin preparation and nourishing care for brides-to-be.",
        image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=1000&fit=crop&auto=format&q=80",
      },
    ],
  },
  {
    title: "Hair Care / Hair Cut Showcase",
    description: "Representative examples of haircuts, styling, and hair conditioning treatments.",
    items: [
      {
        id: "sc-par-haircut",
        type: "PARLOUR",
        category: "Hair Care",
        title: "Women's Haircut",
        description: "Custom haircut and shape leveling tailored to your face structure and personal style.",
        image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=1000&fit=crop&auto=format&q=80",
      },
      {
        id: "sc-par-spa",
        type: "PARLOUR",
        category: "Hair Care",
        title: "Hair Spa",
        description: "Deep conditioning and nourishing hair spa treatments to revive dry, tired hair.",
        image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=1000&fit=crop&auto=format&q=80",
      },
    ],
  },
];
