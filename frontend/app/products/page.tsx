"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/context/AuthContent";
import ProductCard, { Product } from "@/components/ProductCard";
import Container from "@/components/Container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  SlidersHorizontal,
  X,
  Package,
  Grid3X3,
  LayoutList,
  Star,
  Filter,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { id: "electronics", name: "Electronics", count: 0 },
  { id: "fashion", name: "Fashion", count: 0 },
  { id: "home", name: "Home & Living", count: 0 },
  { id: "mobile", name: "Mobile & Accessories", count: 0 },
  { id: "beauty", name: "Beauty & Health", count: 0 },
  { id: "sports", name: "Sports & Outdoors", count: 0 },
  { id: "books", name: "Books & Media", count: 0 },
  { id: "toys", name: "Toys & Games", count: 0 },
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "rating", label: "Highest Rated" },
];

const ratingFilters = [
  { value: 4, label: "4 Stars & Up" },
  { value: 3, label: "3 Stars & Up" },
  { value: 2, label: "2 Stars & Up" },
  { value: 1, label: "1 Star & Up" },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const maxPrice = useMemo(() => {
    if (products.length === 0) return 10000;
    return Math.ceil(Math.max(...products.map(p => p.price)) / 100) * 100;
  }, [products]);

  useEffect(() => {
    if (maxPrice > 0) {
      setPriceRange([0, maxPrice]);
    }
  }, [maxPrice]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(product => {
      const cat = product.category?.toLowerCase() || "";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  useEffect(() => {
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    if (category) setSelectedCategories([category.toLowerCase()]);
    if (search) setSearchQuery(search);
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get("/products");
        setProducts(response.data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query)
      );
    }
    if (selectedCategories.length > 0) {
      result = result.filter((product) =>
        selectedCategories.some((cat) => product.category?.toLowerCase().includes(cat))
      );
    }
    result = result.filter(
      (product) => product.price >= priceRange[0] && product.price <= priceRange[1]
    );
    if (minRating > 0) {
      result = result.filter((product) => (product.rating?.average || 0) >= minRating);
    }
    if (inStockOnly) {
      result = result.filter((product) => product.quantity > 0);
    }
    switch (sortBy) {
      case "price-low": result.sort((a, b) => a.price - b.price); break;
      case "price-high": result.sort((a, b) => b.price - a.price); break;
      case "name-asc": result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name-desc": result.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "rating": result.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0)); break;
      case "newest": default: result.reverse(); break;
    }
    return result;
  }, [products, searchQuery, selectedCategories, sortBy, priceRange, minRating, inStockOnly]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSortBy("newest");
    setPriceRange([0, maxPrice]);
    setMinRating(0);
    setInStockOnly(false);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((c) => c !== categoryId) : [...prev, categoryId]
    );
  };

  const activeFiltersCount = [
    selectedCategories.length > 0,
    priceRange[0] > 0 || priceRange[1] < maxPrice,
    minRating > 0,
    inStockOnly,
    searchQuery.trim() !== "",
  ].filter(Boolean).length;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-brown mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Categories
        </h3>
        <div className="space-y-3">
          {categories.map((category) => {
            const count = categoryCounts[category.id] || 0;
            return (
              <div key={category.id} className="flex items-center space-x-3">
                <Checkbox
                  id={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => toggleCategory(category.id)}
                  className="border-line data-[state=checked]:bg-terracotta data-[state=checked]:border-terracotta"
                />
                <Label
                  htmlFor={category.id}
                  className="flex-1 text-sm font-normal cursor-pointer text-brown-light hover:text-terracotta transition-colors"
                >
                  {category.name}
                </Label>
                <span className="text-xs text-brown-light bg-sand px-2 py-0.5 rounded-full">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Separator className="bg-line" />

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-brown mb-4">Price Range</h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            max={maxPrice}
            step={10}
            className="mb-4"
          />
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <Label className="text-xs text-brown-light mb-1 block">Min</Label>
              <Input
                type="number"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                className="h-9 text-sm border-line"
                min={0}
                max={priceRange[1]}
              />
            </div>
            <span className="text-brown-light mt-5">-</span>
            <div className="flex-1">
              <Label className="text-xs text-brown-light mb-1 block">Max</Label>
              <Input
                type="number"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="h-9 text-sm border-line"
                min={priceRange[0]}
                max={maxPrice}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-line" />

      {/* Rating Filter */}
      <div>
        <h3 className="font-semibold text-brown mb-4">Customer Rating</h3>
        <div className="space-y-2">
          {ratingFilters.map((rating) => (
            <button
              key={rating.value}
              onClick={() => setMinRating(minRating === rating.value ? 0 : rating.value)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all",
                minRating === rating.value
                  ? "bg-terracotta/10 text-terracotta border border-terracotta/30"
                  : "hover:bg-sand text-brown-light"
              )}
            >
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < rating.value
                        ? "text-terracotta-light fill-terracotta-light"
                        : "text-line"
                    )}
                  />
                ))}
              </div>
              <span>& Up</span>
            </button>
          ))}
        </div>
      </div>

      <Separator className="bg-line" />

      {/* Availability */}
      <div>
        <h3 className="font-semibold text-brown mb-4">Availability</h3>
        <div className="flex items-center space-x-3">
          <Checkbox
            id="in-stock"
            checked={inStockOnly}
            onCheckedChange={(checked) => setInStockOnly(checked as boolean)}
            className="border-line data-[state=checked]:bg-terracotta data-[state=checked]:border-terracotta"
          />
          <Label htmlFor="in-stock" className="text-sm font-normal cursor-pointer text-brown-light">
            In Stock Only
          </Label>
        </div>
      </div>

      <Separator className="bg-line" />

      <Button
        variant="outline"
        onClick={clearFilters}
        className="w-full border-line text-brown-light hover:bg-sand rounded-full"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      {/* Header Section */}
      <div className="py-12" style={{ background: 'linear-gradient(135deg, #3d2c1e 0%, #5e4a3a 100%)' }}>
        <Container>
          <span className="font-[family-name:var(--font-caveat)] text-terracotta-light text-xl">Browse</span>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-cream mt-1">
            Discover Products
          </h1>
          <p className="text-sand-warm/60">
            Browse through our extensive collection of quality products
          </p>
        </Container>
      </div>

      <Container className="py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl border border-line p-6" style={{ borderRadius: '20px' }}>
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-semibold text-brown flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5" />
                  Filters
                </span>
                {activeFiltersCount > 0 && (
                  <Badge className="bg-terracotta text-white">
                    {activeFiltersCount}
                  </Badge>
                )}
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search and Sort Bar */}
            <div className="bg-white rounded-2xl border border-line p-4 mb-6" style={{ borderRadius: '20px' }}>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brown-light" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-line focus:border-terracotta rounded-full"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brown-light hover:text-brown"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Sort */}
                <div className="w-full sm:w-48">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="border-line rounded-xl">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* View Mode Toggle */}
                <div className="hidden sm:flex items-center border border-line rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === "grid"
                        ? "bg-terracotta text-white"
                        : "bg-white text-brown-light hover:bg-sand"
                    )}
                  >
                    <Grid3X3 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === "list"
                        ? "bg-terracotta text-white"
                        : "bg-white text-brown-light hover:bg-sand"
                    )}
                  >
                    <LayoutList className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Filters Button */}
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      className="lg:hidden border-terracotta text-terracotta hover:bg-terracotta hover:text-white rounded-full"
                    >
                      <SlidersHorizontal className="h-5 w-5 mr-2" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge className="ml-2 bg-terracotta text-white">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto bg-cream">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2 text-brown">
                        <SlidersHorizontal className="h-5 w-5" />
                        Filters
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Active Filters Pills */}
              {(selectedCategories.length > 0 || searchQuery) && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-line">
                  {searchQuery && (
                    <Badge className="gap-1 bg-sand text-brown hover:bg-sand/80 pl-3 rounded-full">
                      Search: &quot;{searchQuery}&quot;
                      <button
                        onClick={() => setSearchQuery("")}
                        className="ml-1 hover:bg-brown/10 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedCategories.map((cat) => {
                    const category = categories.find((c) => c.id === cat);
                    return (
                      <Badge
                        key={cat}
                        className="gap-1 bg-sand text-brown hover:bg-sand/80 pl-3 rounded-full"
                      >
                        {category?.name || cat}
                        <button
                          onClick={() => toggleCategory(cat)}
                          className="ml-1 hover:bg-brown/10 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                  {(selectedCategories.length > 0 || searchQuery) && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-terracotta hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Results Count */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-brown-light">
                {loading ? (
                  "Loading products..."
                ) : (
                  <>
                    Showing{" "}
                    <span className="font-semibold text-terracotta">
                      {filteredAndSortedProducts.length}
                    </span>{" "}
                    {filteredAndSortedProducts.length === 1 ? "product" : "products"}
                  </>
                )}
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className={cn(
                "gap-6",
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                  : "flex flex-col"
              )}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden border border-line" style={{ borderRadius: '20px' }}>
                    <div className={cn(
                      "bg-sand animate-pulse",
                      viewMode === "grid" ? "aspect-square" : "h-48 w-48"
                    )} />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-sand rounded animate-pulse" />
                      <div className="h-4 bg-sand rounded w-2/3 animate-pulse" />
                      <div className="h-6 bg-sand rounded w-1/2 animate-pulse mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-white rounded-2xl border border-terracotta/30 p-12 text-center" style={{ borderRadius: '20px' }}>
                <p className="text-terracotta text-lg">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-4 bg-terracotta hover:bg-brown text-white rounded-full"
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Products Grid */}
            {!loading && !error && (
              <>
                {filteredAndSortedProducts.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-line p-12 text-center" style={{ borderRadius: '20px' }}>
                    <Package className="mx-auto h-16 w-16 text-brown-light/30 mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-brown">
                      No products found
                    </h3>
                    <p className="text-brown-light mb-6">
                      Try adjusting your filters or search term
                    </p>
                    <Button
                      onClick={clearFilters}
                      className="bg-terracotta hover:bg-brown text-white rounded-full"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Filters
                    </Button>
                  </div>
                ) : (
                  <div className={cn(
                    "gap-6",
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                      : "flex flex-col"
                  )}>
                    {filteredAndSortedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-cream">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta"></div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
