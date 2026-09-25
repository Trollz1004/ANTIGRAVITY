import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createCatalogProduct } from "../db";

export interface CurbItem {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  source: "Craigslist" | "Facebook Marketplace" | "Freebie App";
  location: string;
  postedTime: string;
  itemUrl: string;
  aiFlipAnalysis: {
    estimatedResalePrice: number;
    estimatedProfit: number;
    recommendation: "HIGH PROFIT FLIP" | "GREAT VALUE" | "SKIP";
    suggestedPlatforms: string[];
    conditionScore: string;
  };
}

// Simulated real-time local curb alert & under-$10 finder feeds
const MOCK_CURB_ITEMS: CurbItem[] = [
  {
    id: "curb-106",
    title: "BULK WHOLESALE Resale Lot: 15 Vintage Video Games ($10)",
    description: "Clearing out storage locker! Bulk wholesale liquidation lot of PS2/Xbox vintage games. Only $10 for the whole lot. Quick resale profit.",
    price: 10,
    imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
    source: "Craigslist",
    location: "Metro Area",
    postedTime: "5 mins ago",
    itemUrl: "https://craigslist.org/bar/curb-106",
    aiFlipAnalysis: {
      estimatedResalePrice: 150.0,
      estimatedProfit: 140.0,
      recommendation: "HIGH PROFIT FLIP",
      suggestedPlatforms: ["eBay", "Mercari"],
      conditionScore: "8.5/10",
    },
  },
  {
    id: "curb-107",
    title: "FREE Bulk Resale Mystery Box - Designer Clothes",
    description: "Box of 12 gently used brand name apparel items (Nike, Levi's, Gap). Free on curb for resale or personal use.",
    price: 0,
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
    source: "Freebie App",
    location: "Oak Park",
    postedTime: "15 mins ago",
    itemUrl: "https://freebieapp.com/item/107",
    aiFlipAnalysis: {
      estimatedResalePrice: 180.0,
      estimatedProfit: 180.0,
      recommendation: "HIGH PROFIT FLIP",
      suggestedPlatforms: ["Poshmark", "eBay", "Depop"],
      conditionScore: "9/10",
    },
  },
  {
    id: "curb-101",
    title: "FREE Vintage Solid Oak Nightstand - Curb Alert",
    description: "Solid oak nightstand left at curb on Elm Street. Minor surface scratch on top, easily refinished. Must pick up today.",
    price: 0,
    imageUrl: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80",
    source: "Craigslist",
    location: "Elm St / 3rd Ave",
    postedTime: "12 mins ago",
    itemUrl: "https://craigslist.org/free/curb-101",
    aiFlipAnalysis: {
      estimatedResalePrice: 75.0,
      estimatedProfit: 75.0,
      recommendation: "HIGH PROFIT FLIP",
      suggestedPlatforms: ["eBay", "Facebook Marketplace", "Mercari"],
      conditionScore: "8/10",
    },
  },
  {
    id: "curb-102",
    title: "Curb Alert: Bose SoundDock Speaker System ($5)",
    description: "Moving out sale! Working Bose speaker dock with aux input. Only asking $5. Photos attached.",
    price: 5,
    imageUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80",
    source: "Facebook Marketplace",
    location: "Downtown",
    postedTime: "25 mins ago",
    itemUrl: "https://facebook.com/marketplace/item/102",
    aiFlipAnalysis: {
      estimatedResalePrice: 45.0,
      estimatedProfit: 40.0,
      recommendation: "HIGH PROFIT FLIP",
      suggestedPlatforms: ["eBay", "Mercari"],
      conditionScore: "9/10",
    },
  },
  {
    id: "curb-103",
    title: "Free Retro Nintendo Game Boy Storage Case",
    description: "Cleaning out garage. Original 90s Game Boy hard shell carrying case. Free on curb.",
    price: 0,
    imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
    source: "Freebie App",
    location: "West End",
    postedTime: "40 mins ago",
    itemUrl: "https://freebieapp.com/item/103",
    aiFlipAnalysis: {
      estimatedResalePrice: 35.0,
      estimatedProfit: 35.0,
      recommendation: "GREAT VALUE",
      suggestedPlatforms: ["eBay", "Poshmark"],
      conditionScore: "7/10",
    },
  },
  {
    id: "curb-104",
    title: "Cast Iron Skillet Pre-seasoned 10-inch ($8)",
    description: "Lodge 10-inch cast iron skillet, great condition, $8 obo.",
    price: 8,
    imageUrl: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80",
    source: "Craigslist",
    location: "North Suburbs",
    postedTime: "1 hour ago",
    itemUrl: "https://craigslist.org/bar/curb-104",
    aiFlipAnalysis: {
      estimatedResalePrice: 30.0,
      estimatedProfit: 22.0,
      recommendation: "GREAT VALUE",
      suggestedPlatforms: ["eBay", "Mercari"],
      conditionScore: "9/10",
    },
  },
  {
    id: "curb-105",
    title: "FREE Leather Jacket - Vintage Brown Leather (Curb)",
    description: "Genuine brown leather bomber jacket left out in box. Size Large. Free to first person who grabs it.",
    price: 0,
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
    source: "Craigslist",
    location: "Maple St",
    postedTime: "1.5 hours ago",
    itemUrl: "https://craigslist.org/free/curb-105",
    aiFlipAnalysis: {
      estimatedResalePrice: 120.0,
      estimatedProfit: 120.0,
      recommendation: "HIGH PROFIT FLIP",
      suggestedPlatforms: ["Poshmark", "eBay", "Depop"],
      conditionScore: "8.5/10",
    },
  },
];

export const curbAlertsRouter = router({
  search: protectedProcedure
    .input(
      z.object({
        zipCode: z.string().optional(),
        maxPrice: z.number().max(10).default(10),
        keywords: z.string().default("curb alert, free, bulk, wholesale, resale, liquidation"),
        hasPhotoOnly: z.boolean().default(true),
        source: z.enum(["all", "craigslist", "facebook_marketplace", "freebie_apps"]).default("all"),
      })
    )
    .query(({ input }) => {
      // Enforce HARD RULES: price <= $10, photo required
      let items = MOCK_CURB_ITEMS.filter((item) => {
        if (item.price > input.maxPrice) return false;
        if (input.hasPhotoOnly && (!item.imageUrl || item.imageUrl.trim() === "")) return false;
        if (input.source !== "all") {
          const srcNormalized = item.source.toLowerCase().replace(/\s+/g, "_");
          if (!srcNormalized.includes(input.source)) return false;
        }
        if (input.keywords && input.keywords.trim() !== "") {
          const kwList = input.keywords.toLowerCase().split(/[\s,]+/);
          const text = (item.title + " " + item.description).toLowerCase();
          const matches = kwList.some((kw) => text.includes(kw));
          if (!matches) return false;
        }
        return true;
      });

      return {
        totalFound: items.length,
        maxPriceCap: input.maxPrice,
        photoFilterActive: input.hasPhotoOnly,
        items,
      };
    }),

  importToCatalog: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().default(""),
        sourcePrice: z.number().max(10),
        targetResalePrice: z.number().positive(),
        imageUrl: z.string().url(),
        category: z.string().default("Free & Curb Scout Finds"),
        sourceUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Add product to Crosslisting OS catalog
      const newProduct = await createCatalogProduct({
        sku: `CURB-${Date.now().toString().slice(-6)}`,
        title: input.title,
        brandOrStudio: "Curb Find",
        category: input.category,
        format: "Physical Item",
        condition: "Good",
        description: input.description,
        upc: "",
        actorUserId: ctx.user.id,
      });

      return {
        success: true,
        productId: newProduct.id,
        sku: newProduct.sku,
        message: `Successfully imported '${input.title}' into Catalog (Target Resale: $${input.targetResalePrice})`,
      };
    }),
});
