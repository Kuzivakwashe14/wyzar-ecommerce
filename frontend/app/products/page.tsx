"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/context/AuthContent";
import ProductCard, { Product } from "@/components/ProductCard";
import Container from "@/components/Container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function ProductsPageInner() {
      const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Derived states
  const maxPrice = useMemo(
    () => Math.max(...products.map((product) => product.price), 0),
    [products]
  );

  const categoryCounts = useMemo(() => {
    return products.reduce((acc, product) => {
      const category = product.category?.toLowerCase();
      if (category) {
        acc[category] = (acc[category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [products]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/products");
        setProducts(response.data);
      } catch (err) {
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter((product) => {
      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesDescription = product.description
          ?.toLowerCase()
          .includes(query);
        if (!matchesName && !matchesDescription) return false;
      }

      // Apply category filters
      if (selectedCategories.length > 0) {
        const category = product.category?.toLowerCase();
        if (!category || !selectedCategories.includes(category)) return false;
      }

      // Apply price range filter
      const [minPrice, maxPrice] = priceRange;
      if (product.price < minPrice || product.price > maxPrice) return false;

      // Apply rating filter
      if (minRating > 0) {
        if (!product.rating || typeof product.rating.average !== 'number' || product.rating.average < minRating) return false;
      }

      return true;
    });

    // Apply stock filter
    if (inStockOnly) {
      result = result.filter((product) => product.quantity > 0);
    }

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "rating":
        result.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
        break;
      case "newest":
      default:
        result.reverse();
        break;
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
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const activeFiltersCount = [
    selectedCategories.length > 0,
    priceRange[0] > 0 || priceRange[1] < maxPrice,
    minRating > 0,
    inStockOnly,
    searchQuery.trim() !== "",
  ].filter(Boolean).length;

  // Filter Sidebar Content
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
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
                  className="border-gray-300 data-[state=checked]:bg-shop_dark_green data-[state=checked]:border-shop_dark_green"
                />
                <Label
                  htmlFor={category.id}
                  className="flex-1 text-sm font-normal cursor-pointer text-gray-700 hover:text-shop_dark_green transition-colors"
                >
                  {category.name}
                </Label>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">
          Price Range
        </h3>
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
              <Label className="text-xs text-gray-500 mb-1 block">Min</Label>
              <Input
                type="number"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                className="h-9 text-sm"
                min={0}
                max={priceRange[1]}
              />
            </div>
            <span className="text-gray-400 mt-5">-</span>
            <div className="flex-1">
              <Label className="text-xs text-gray-500 mb-1 block">Max</Label>
              <Input
                type="number"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="h-9 text-sm"
                min={priceRange[0]}
                max={maxPrice}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Rating Filter */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">
          Customer Rating
        </h3>
        <div className="space-y-2">
          {ratingFilters.map((rating) => (
            <button
              key={rating.value}
              onClick={() => setMinRating(minRating === rating.value ? 0 : rating.value)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                minRating === rating.value
                  ? "bg-shop_dark_green/10 text-shop_dark_green border border-shop_dark_green/30"
                  : "hover:bg-gray-100 text-gray-700"
              )}
            >
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < rating.value
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <span>& Up</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Availability */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">
          Availability
        </h3>
        <div className="flex items-center space-x-3">
          <Checkbox
            id="in-stock"
            checked={inStockOnly}
            onCheckedChange={(checked) => setInStockOnly(Boolean(checked))}
            className="border-gray-300 data-[state=checked]:bg-shop_dark_green data-[state=checked]:border-shop_dark_green"
          />
          <Label
            htmlFor="in-stock"
            className="text-sm font-normal cursor-pointer text-gray-700"
          >
            In Stock Only
          </Label>
        </div>
      </div>

      <Separator />

      {/* Clear Filters Button */}
      <Button
        variant="outline"
        onClick={clearFilters}
        className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-shop_dark_green text-white py-12">
        <Container>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Discover Products
          </h1>
          <p className="text-white/80">
            Browse through our extensive collection of quality products
          </p>
        </Container>
      </div>

      <Container className="py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-72 shrink-0">
            <Card className="sticky top-24 border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5" />
                    Filters
                  </span>
                  {activeFiltersCount > 0 && (
                    <Badge className="bg-shop_dark_green text-white">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FilterContent />
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search and Sort Bar */}
            <Card className="mb-6 border-gray-200">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-shop_dark_green"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Sort */}
                  <div className="w-full sm:w-48">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="border-gray-300">
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
                  <div className="hidden sm:flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "p-2 transition-colors",
                        viewMode === "grid"
                          ? "bg-shop_dark_green text-white"
                          : "bg-white text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      <Grid3X3 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "p-2 transition-colors",
                        viewMode === "list"
                          ? "bg-shop_dark_green text-white"
                          : "bg-white text-gray-600 hover:bg-gray-100"
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
                        className="lg:hidden border-shop_dark_green text-shop_dark_green hover:bg-shop_dark_green hover:text-white"
                      >
                        <SlidersHorizontal className="h-5 w-5 mr-2" />
                        Filters
                        {activeFiltersCount > 0 && (
                          <Badge className="ml-2 bg-shop_dark_green text-white">
                            {activeFiltersCount}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
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
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                    {searchQuery && (
                      <Badge className="gap-1 bg-shop_light_pink text-shop_dark_green hover:bg-shop_light_pink/80 pl-3">
                        Search: &quot;{searchQuery}&quot;
                        <button
                          onClick={() => setSearchQuery("")}
                          className="ml-1 hover:bg-shop_dark_green/10 rounded-full p-0.5"
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
                          className="gap-1 bg-shop_light_pink text-shop_dark_green hover:bg-shop_light_pink/80 pl-3"
                        >
                          {category?.name || cat}
                          <button
                            onClick={() => toggleCategory(cat)}
                            className="ml-1 hover:bg-shop_dark_green/10 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                    {(selectedCategories.length > 0 || searchQuery) && (
                      <button
                        onClick={clearFilters}
                        className="text-sm text-shop_dark_green hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results Count */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                {loading ? (
                  "Loading products..."
                ) : (
                  <>
                    Showing{" "}
                    <span className="font-semibold text-shop_dark_green">
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
                  <Card key={i} className="overflow-hidden border-gray-200">
                    <div className={cn(
                      "bg-gray-200 animate-pulse",
                      viewMode === "grid" ? "aspect-square" : "h-48 w-48"
                    )} />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                      <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse mt-4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <Card className="border-red-300">
                <CardContent className="p-12 text-center">
                  <p className="text-red-600 text-lg">{error}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="mt-4 bg-shop_dark_green hover:bg-shop_light_green text-white"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Products Grid */}
            {!loading && !error && (
              <>
                {filteredAndSortedProducts.length === 0 ? (
                  <Card className="border-gray-200">
                    <CardContent className="p-12 text-center">
                      <Package className="mx-auto h-16 w-16 text-shop_dark_green/50 mb-4" />
                      <h3 className="text-xl font-semibold mb-2 text-shop_dark_green">
                        No products found
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Try adjusting your filters or search term
                      </p>
                      <Button
                        onClick={clearFilters}
                        className="bg-shop_dark_green hover:bg-shop_light_green text-white"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset Filters
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className={cn(
                    "gap-6",
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                      : "flex flex-col"
                  )}>
                    {filteredAndSortedProducts.map((product) => (
                      <ProductCard key={product._id} product={product} />
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
    <Suspense>
      <ProductsPageInner />
    </Suspense>
  );
}

