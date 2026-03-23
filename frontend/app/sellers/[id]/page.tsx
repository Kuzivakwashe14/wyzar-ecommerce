"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/context/AuthContent";
import ProductCard, { Product } from "@/components/ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Globe, MessageCircle, Store, ShieldCheck, Package } from "lucide-react";

interface SellerProfile {
  id: string;
  businessName: string;
  sellerType: string | null;
  productCategory: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  website: string | null;
  whatsappNumber: string | null;
  isVerified: boolean;
  joinedAt: string;
}

export default function SellerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSellerProfile = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const res = await api.get(`/products/seller/${id}`);
        setSeller(res.data.seller);
        setProducts(res.data.products || []);
      } catch (err: unknown) {
        console.error("Failed to fetch seller profile:", err);
        const message =
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (err as { response?: { data?: { msg?: string } } }).response?.data?.msg === "string"
            ? (err as { response?: { data?: { msg?: string } } }).response?.data?.msg
            : "Seller information is not available.";

        setError(message || "Seller information is not available.");
      } finally {
        setLoading(false);
      }
    };

    fetchSellerProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10 space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 w-full bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-xl mx-auto border-gray-200">
          <CardContent className="p-8 text-center space-y-4">
            <Store className="h-12 w-12 text-shop_dark_green/50 mx-auto" />
            <h1 className="text-2xl font-bold text-shop_dark_green">Seller Not Available</h1>
            <p className="text-gray-600">{error || "Unable to load seller profile."}</p>
            <Button onClick={() => router.push("/products")} className="bg-shop_dark_green hover:bg-shop_light_green text-white">
              Browse Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Button
          variant="outline"
          className="border-shop_dark_green text-shop_dark_green hover:bg-shop_dark_green hover:text-white"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Link href="/products" className="text-shop_dark_green hover:underline text-sm">
          Continue shopping
        </Link>
      </div>

      <Card className="border-gray-200">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-shop_dark_green">{seller.businessName}</h1>
              <p className="text-gray-600 text-sm mt-1">
                Seller since {new Date(seller.joinedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              {seller.isVerified && (
                <Badge className="bg-shop_light_green text-white">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  Verified Seller
                </Badge>
              )}
              <Badge variant="outline" className="border-shop_orange text-shop_orange">
                <Package className="h-3.5 w-3.5 mr-1" />
                {products.length} product{products.length === 1 ? "" : "s"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {(seller.city || seller.state || seller.country) && (
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-4 w-4 text-shop_dark_green" />
                <span>
                  {[seller.city, seller.state, seller.country].filter(Boolean).join(", ")}
                </span>
              </div>
            )}

            {seller.productCategory && (
              <div className="text-gray-700">
                <span className="text-gray-500">Category: </span>
                <span className="font-medium">{seller.productCategory}</span>
              </div>
            )}

            {seller.website && (
              <a
                href={seller.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-shop_dark_green hover:underline"
              >
                <Globe className="h-4 w-4" />
                Visit website
              </a>
            )}

            {seller.whatsappNumber && (
              <a
                href={`https://wa.me/${seller.whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-shop_dark_green hover:underline"
              >
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-bold text-shop_dark_green">Products From This Seller</h2>

        {products.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="p-10 text-center">
              <Package className="h-10 w-10 mx-auto text-shop_dark_green/50 mb-3" />
              <p className="text-gray-700 font-medium">No products listed yet</p>
              <p className="text-gray-500 text-sm mt-1">Check back later for new items from this seller.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
