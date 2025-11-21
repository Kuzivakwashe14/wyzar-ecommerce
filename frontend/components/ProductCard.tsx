// In frontend/components/ProductCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image"; // Next.js optimized image component
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // We'll add this
import { getImageUrl } from "@/lib/utils";

// Define the Product type to match our API response
// This helps with TypeScript and auto-complete
export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  images: string[];
  seller: {
    _id: string;
    sellerDetails: {
      businessName: string;
    };
  };
  createdAt: string;
  deliveryTime?: string;
  countryOfOrigin?: string;
  rating?: {
    average: number;
    count: number;
  };
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {

  // Construct the full image path
  // We use the first image in the 'images' array
  const imageUrl = getImageUrl(product.images[0]);

  return (
    <Link href={`/products/${product._id}`}>
      <Card className="w-full overflow-hidden transition-shadow hover:shadow-lg">
        <CardHeader className="p-0">
          <div className="relative w-full aspect-square">
            <Image
              src={imageUrl}
              alt={product.name}
              fill // Makes the image fill the container
              style={{ objectFit: 'cover' }} // Ensures the image covers the area
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized={true}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="text-lg font-semibold truncate">
            {product.name}
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 mt-1">
            By {product.seller.sellerDetails.businessName}
          </CardDescription>
        </CardContent>
        <CardFooter className="flex justify-between items-center p-4 pt-0">
          <span className="text-lg font-bold text-primary">
            ${product.price.toFixed(2)}
          </span>
          <Badge variant="outline">{product.category}</Badge>
        </CardFooter>
      </Card>
    </Link>
  );
}