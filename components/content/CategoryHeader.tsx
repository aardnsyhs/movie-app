"use client";

import { CATEGORY_LABELS, type Category } from "@/lib/types";
import { TrendingUp } from "lucide-react";

interface CategoryHeaderProps {
  category: Category;
  itemCount?: number;
}

/**
 * Category header - shown instead of hero for non-trending categories
 */
export function CategoryHeader({ category, itemCount }: CategoryHeaderProps) {
  return (
    <section className="pt-24 pb-8 -mt-16 bg-gradient-to-b from-white/5 to-transparent">
      <div className="container-main">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-6 h-6 text-red-500" />
          <span className="text-sm text-white/50 uppercase tracking-wider">
            Browse Category
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {CATEGORY_LABELS[category]}
        </h1>
        {itemCount !== undefined && (
          <p className="text-white/60">{itemCount} titles available</p>
        )}
      </div>
    </section>
  );
}

/**
 * Skeleton for category header
 */
export function CategoryHeaderSkeleton() {
  return (
    <section className="pt-24 pb-8 -mt-16 bg-gradient-to-b from-white/5 to-transparent">
      <div className="container-main">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-6 h-6 rounded skeleton" />
          <div className="w-32 h-4 rounded skeleton" />
        </div>
        <div className="w-48 h-10 rounded skeleton mb-2" />
        <div className="w-32 h-5 rounded skeleton" />
      </div>
    </section>
  );
}
