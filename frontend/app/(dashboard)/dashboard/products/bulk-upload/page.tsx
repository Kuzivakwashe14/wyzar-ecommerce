"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, api } from '@/context/AuthContent';

const BulkUploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) router.push("/login");
      else if (!user?.isSeller) router.push("/become-a-seller");
    }
  }, [isAuthenticated, user, authLoading, router]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFile = event.target.files[0];
      if (selectedFile && selectedFile.type === "text/csv") {
        setFile(selectedFile);
      } else {
        toast.error("Please select a valid .csv file.");
        setFile(null);
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("products-csv", file);

    try {
      const response = await api.post('/products/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = response.data;

      if (response.status >= 400) { // Axios treats non-2xx as errors, this is for explicit feedback
        if (result.errors && result.errors.length > 0) {
          const errorMessages = result.errors.map((err: any) => `Row ${err.row}: ${err.error}`).join('\n');
          toast.error(`Upload failed with ${result.errors.length} errors.`, {
            description: errorMessages,
          });
        } else {
          toast.error(result.msg || "An unknown error occurred.");
        }
      } else {
        toast.success(result.message || "Products uploaded successfully!");
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      const result = error.response?.data;
      if (result && result.errors && result.errors.length > 0) {
        const errorMessages = result.errors.map((err: any) => `Row ${err.row}: ${err.error}`).join('\n');
        toast.error(result.msg || `Processed with ${result.errors.length} errors.`, {
          description: errorMessages,
        });
      } else if (result && result.msg) {
        toast.error(result.msg);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <div className="container py-8"><p>Loading...</p></div>;
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Bulk Upload Products</CardTitle>
          <CardDescription>
            Add multiple products at once by uploading a CSV file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">Step 1: Download Template</h3>
            <p className="text-sm text-muted-foreground">
              Download the CSV template. You can include image links in the 'images' column (comma-separated for multiple images).
            </p>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              Download Template
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Step 2: Upload Your File</h3>
            <p className="text-sm text-muted-foreground">
              Fill out the template and upload the saved CSV file here.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="csv-file">CSV File</Label>
                <Input
                  id="csv-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" disabled={!file || isLoading}>
                {isLoading ? "Uploading..." : "Upload Products"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div >
  );
};

export default BulkUploadPage;

