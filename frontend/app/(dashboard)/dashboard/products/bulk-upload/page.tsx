"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, api } from '@/context/AuthContent';
import Papa from 'papaparse';

type CsvRow = {
  name?: string;
  description?: string;
  price?: string;
  category?: string;
  quantity?: string;
  deliveryTime?: string;
  countryOfOrigin?: string;
  condition?: string;
  brand?: string;
  tags?: string;
  images?: string;
};

type PreviewProduct = {
  rowNumber: number;
  name: string;
  description: string;
  price: string;
  category: string;
  quantity: string;
  deliveryTime: string;
  countryOfOrigin: string;
  imageUrlsFromCsv: string[];
  imageFiles: File[];
  imagePreviewUrls: string[];
};

const BulkUploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewProducts, setPreviewProducts] = useState<PreviewProduct[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const { user, isAuthenticated, loading: authLoading, login } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const revokePreviewUrls = (products: PreviewProduct[]) => {
    products.forEach((product) => {
      product.imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    });
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) login();
      else if (!user?.isSeller) router.push("/become-a-seller");
      else if (user?.isSeller && !user?.isVerified) router.push("/dashboard");
    }
  }, [isAuthenticated, user, authLoading, router]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFile = event.target.files[0];
      if (selectedFile && selectedFile.type === "text/csv") {
        setFile(selectedFile);
        setPreviewProducts((prev) => {
          revokePreviewUrls(prev);
          return [];
        });
        setParseErrors([]);
      } else {
        toast.error("Please select a valid .csv file.");
        setFile(null);
        setPreviewProducts((prev) => {
          revokePreviewUrls(prev);
          return [];
        });
        setParseErrors([]);
        event.target.value = ''; // Reset file input
      }
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "name", "description", "price", "category", "quantity",
      "deliveryTime", "countryOfOrigin", "condition", "brand", "tags", "images"
    ];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "product_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Template downloaded!");
  };

  const parseCsvToPreview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    setIsParsing(true);
    setParseErrors([]);

    try {
      const fileText = await file.text();
      const parsed = Papa.parse<CsvRow>(fileText, {
        header: true,
        skipEmptyLines: true,
      });

      const validProducts: PreviewProduct[] = [];
      const rowErrors: string[] = [];

      parsed.data.forEach((row, index) => {
        const rowNumber = index + 2;
        const name = (row.name || '').trim();
        const description = (row.description || '').trim();
        const price = (row.price || '').toString().trim();
        const category = (row.category || '').trim();
        const quantity = (row.quantity || '').toString().trim();

        if (!name || !description || !price || !category || !quantity) {
          rowErrors.push(`Row ${rowNumber}: Missing required fields (name, description, price, category, quantity).`);
          return;
        }

        const parsedPrice = Number(price);
        const parsedQuantity = Number(quantity);
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
          rowErrors.push(`Row ${rowNumber}: Invalid price.`);
          return;
        }
        if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
          rowErrors.push(`Row ${rowNumber}: Invalid quantity.`);
          return;
        }

        const imageUrlsFromCsv = (row.images || '')
          .split(',')
          .map((img) => img.trim())
          .filter((img) => img.length > 0);

        validProducts.push({
          rowNumber,
          name,
          description,
          price,
          category,
          quantity,
          deliveryTime: (row.deliveryTime || '').trim(),
          countryOfOrigin: (row.countryOfOrigin || '').trim(),
          imageUrlsFromCsv,
          imageFiles: [],
          imagePreviewUrls: [],
        });
      });

      if (parsed.errors.length > 0) {
        parsed.errors.forEach((err) => {
          const rowLabel = typeof err.row === 'number' ? String(err.row + 1) : 'unknown';
          rowErrors.push(`Row ${rowLabel}: ${err.message}`);
        });
      }

      setPreviewProducts((prev) => {
        revokePreviewUrls(prev);
        return validProducts;
      });
      setParseErrors(rowErrors);

      if (validProducts.length === 0) {
        toast.error('No valid products found in CSV.');
      } else if (rowErrors.length > 0) {
        toast.warning(`Preview generated with ${rowErrors.length} issue(s).`);
      } else {
        toast.success(`Preview ready for ${validProducts.length} product(s).`);
      }
    } catch (error: any) {
      console.error('CSV parsing error:', error);
      toast.error('Could not parse CSV file. Please check the format.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleImagesChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    setPreviewProducts((prev) => prev.map((product, i) => {
      if (i !== index) return product;
      product.imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      return {
        ...product,
        imageFiles: files,
        imagePreviewUrls: files.map((file) => URL.createObjectURL(file)),
      };
    }));
  };

  const saveAllProducts = async () => {
    if (previewProducts.length === 0) {
      toast.error('No products in preview. Parse a CSV first.');
      return;
    }

    const rowsMissingImages = previewProducts.filter((p) => p.imageFiles.length === 0).map((p) => p.rowNumber);
    if (rowsMissingImages.length > 0) {
      toast.error(`Attach at least one image for each product. Missing rows: ${rowsMissingImages.join(', ')}`);
      return;
    }

    setIsSaving(true);
    let successCount = 0;
    const failedRows: string[] = [];

    for (const product of previewProducts) {
      const formData = new FormData();
      formData.append('name', product.name);
      formData.append('description', product.description);
      formData.append('price', product.price);
      formData.append('category', product.category);
      formData.append('quantity', product.quantity);
      formData.append('deliveryTime', product.deliveryTime || 'Not specified');
      formData.append('countryOfOrigin', product.countryOfOrigin || 'Not specified');

      product.imageFiles.forEach((img) => {
        formData.append('images', img);
      });

      try {
        await api.post('/products', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        successCount += 1;
      } catch (error: any) {
        const msg = error?.response?.data?.msg || 'Failed to save product';
        failedRows.push(`Row ${product.rowNumber}: ${msg}`);
      }
    }

    if (successCount > 0 && failedRows.length === 0) {
      toast.success(`Saved ${successCount} products successfully.`);
      setPreviewProducts((prev) => {
        revokePreviewUrls(prev);
        return [];
      });
      setParseErrors([]);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else if (successCount > 0) {
      toast.warning(`Saved ${successCount} product(s), ${failedRows.length} failed.`);
      console.error('Bulk save failures:', failedRows);
    } else {
      toast.error('No products were saved. Check errors and try again.');
      console.error('Bulk save failures:', failedRows);
    }

    setIsSaving(false);
  };

  if (authLoading) {
    return <div className="container py-8"><p>Loading...</p></div>;
  }

  useEffect(() => {
    return () => {
      revokePreviewUrls(previewProducts);
    };
  }, [previewProducts]);

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Bulk Upload Products</CardTitle>
          <CardDescription>
            Upload CSV, preview each row, attach images per product, then save.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">Step 1: Download Template</h3>
            <p className="text-sm text-muted-foreground">
              Download the CSV template. The 'images' column can be used as reference links, but you will attach final files in preview.
            </p>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              Download Template
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Step 2: Generate Preview</h3>
            <p className="text-sm text-muted-foreground">
              Upload your CSV to generate a product preview before saving.
            </p>
            <form onSubmit={parseCsvToPreview} className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="csv-file">CSV File</Label>
                <Input
                  id="csv-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isParsing || isSaving}
                />
              </div>
              <Button type="submit" disabled={!file || isParsing || isSaving}>
                {isParsing ? "Parsing..." : "Generate Preview"}
              </Button>
            </form>
          </div>

          {parseErrors.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-red-600">CSV Issues</h3>
              <div className="max-h-40 overflow-y-auto rounded-md border p-3 text-sm">
                {parseErrors.map((err) => (
                  <p key={err} className="text-red-600">{err}</p>
                ))}
              </div>
            </div>
          )}

          {previewProducts.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Step 3: Attach Images & Save</h3>
              <p className="text-sm text-muted-foreground">
                Add at least one image per product, then save all products.
              </p>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {previewProducts.map((product, index) => (
                  <div key={`${product.rowNumber}-${product.name}`} className="rounded-md border p-3 space-y-2">
                    <p className="font-medium">Row {product.rowNumber}: {product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.category} • ${product.price} • Qty: {product.quantity}
                    </p>

                    {product.imageUrlsFromCsv.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        CSV image links: {product.imageUrlsFromCsv.length} found (reference only)
                      </p>
                    )}

                    <div className="space-y-1">
                      <Label htmlFor={`images-${index}`}>Upload images for this product</Label>
                      <Input
                        id={`images-${index}`}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) => handleImagesChange(index, event)}
                        disabled={isSaving}
                      />
                      <p className="text-xs text-muted-foreground">
                        {product.imageFiles.length > 0
                          ? `${product.imageFiles.length} image(s) selected`
                          : 'No images selected yet'}
                      </p>

                      {product.imagePreviewUrls.length > 0 && (
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {product.imagePreviewUrls.map((url, imgIndex) => (
                            <img
                              key={`${product.rowNumber}-${imgIndex}`}
                              src={url}
                              alt={`${product.name} preview ${imgIndex + 1}`}
                              className="h-20 w-full object-cover rounded border"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={saveAllProducts} disabled={isSaving || isParsing}>
                {isSaving ? 'Saving products...' : `Save ${previewProducts.length} Products`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div >
  );
};

export default BulkUploadPage;

