"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { api, useAuth } from "@/context/AuthContent";
import { toast } from "sonner"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

// --- Validation Schemas ---

const step1Schema = z.object({
  businessName: z.string().min(3, "Business name must be at least 3 characters"),
  sellerType: z.string().default("individual"),
  jobTitle: z.string().min(2, "Job title is required"),
  website: z.string().regex(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, "Invalid URL").or(z.literal("")).optional(),
  productCategory: z.string().min(2, "Category is required"),
  totalSkuCount: z.string().min(1, "SKU count is required"), // Input as string, convert later
  annualRevenue: z.string().min(1, "Revenue selection is required"),
  primarySalesChannel: z.string().min(1, "Sales channel is required"),
  phoneNumber: z.string().min(9, "Phone number is required"),
  whatsappNumber: z.string().min(9, "WhatsApp number is required"),
  // Address
  streetAddress: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  province: z.string().min(2, "Province/State is required"),
});

const step2Schema = z.object({
  // Documents
  doc_certificate: z.any().optional(), // Required for Business
  doc_tax: z.any().optional(),
  doc_id: z.any().refine((files) => files?.length === 1, "ID Document is required"),
  doc_bank: z.any().refine((files) => files?.length === 1, "Bank Confirmation is required"),
});

const step3Schema = z.object({
  // Agreements
  catalogStandardsAgreed: z.boolean().refine(val => val === true, { message: "You must agree to the Catalog Standards" }),
  slaAgreed: z.boolean().refine(val => val === true, { message: "You must agree to the Service Level Agreement" }),
  // Payment Details
  ecocashNumber: z.string().optional(),
  ecocashName: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
});

// Merged schema for final submission (loose validation as we validate per step)
const finalSchema = step1Schema.merge(step2Schema).merge(step3Schema);

export default function BecomeASellerPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, refreshUser, login } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  const [phoneCode, setPhoneCode] = useState("+263");
  const [whatsappCode, setWhatsappCode] = useState("+263");

  const form = useForm<z.input<typeof finalSchema>>({
    resolver: zodResolver(finalSchema),
    mode: "onChange",
    defaultValues: {
      sellerType: "individual",
      businessName: "",
      jobTitle: "",
      website: "",
      productCategory: "",
      totalSkuCount: "",
      annualRevenue: "",
      primarySalesChannel: "",
      phoneNumber: "",
      whatsappNumber: "",
      streetAddress: "",
      city: "",
      province: "",
      ecocashNumber: "",
      ecocashName: "",
      bankName: "",
      bankAccountName: "",
      bankAccountNumber: "",
      catalogStandardsAgreed: false,
      slaAgreed: false,
      doc_id: undefined,
      doc_bank: undefined,
      doc_certificate: undefined,
      doc_tax: undefined,
    },
  });

  // Protect Route
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) login();
      if (isAuthenticated && user?.isSeller) router.push("/dashboard");
    }
  }, [isAuthenticated, user, loading, router, login]);

  // --- Step Navigation & Logic ---

  const nextStep = async () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = await form.trigger([
        "businessName", "sellerType", "jobTitle", "productCategory", 
        "totalSkuCount", "annualRevenue", "primarySalesChannel", 
        "phoneNumber", "whatsappNumber", "website"
      ]);
      
      // Gatekeeper Check
      const revenue = form.getValues("annualRevenue");
      // Strict rejection logic removed, now just verification flow.
      // But we can warn or flag.
      
    } else if (currentStep === 2) {
      // Validate documents
      const sellerType = form.getValues("sellerType");
      const fieldsToValidate: any[] = ["doc_id", "doc_bank"];
      if (sellerType === "business") {
        fieldsToValidate.push("doc_certificate");
      }
      isValid = await form.trigger(fieldsToValidate);
    }

    if (isValid) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  // --- Submission ---

  async function onSubmit(values: z.input<typeof finalSchema>) {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      // Append Step 1 Data
      formData.append("businessName", values.businessName);
      formData.append("sellerType", values.sellerType ?? "individual");
      formData.append("jobTitle", values.jobTitle);
      
      // Handle website prefixing manually
      if (values.website) {
        let site = values.website;
        if (!site.startsWith("http") && site.includes(".")) {
          site = `https://${site}`;
        }
        formData.append("website", site);
      }

      formData.append("productCategory", values.productCategory);
      formData.append("totalSkuCount", values.totalSkuCount);
      formData.append("annualRevenue", values.annualRevenue);
      formData.append("primarySalesChannel", values.primarySalesChannel);
      formData.append("phoneNumber", `${phoneCode}${values.phoneNumber.replace(/^0+/, "")}`);
      formData.append("whatsappNumber", `${whatsappCode}${values.whatsappNumber.replace(/^0+/, "")}`);

      // Serialize Address to JSON
      const addressData = {
        street: values.streetAddress,
        city: values.city,
        state: values.province,
        country: "Zimbabwe" // Defaulting to Zimbabwe for now
      };
      formData.append("address", JSON.stringify(addressData));
      
      // Append Step 3 Data
      formData.append("catalogStandardsAgreed", String(values.catalogStandardsAgreed));
      formData.append("slaAgreed", String(values.slaAgreed));
      if(values.ecocashNumber) formData.append("ecocashNumber", values.ecocashNumber);
      if(values.ecocashName) formData.append("ecocashName", values.ecocashName);
      if(values.bankName) formData.append("bankName", values.bankName);
      if(values.bankAccountName) formData.append("bankAccountName", values.bankAccountName);
      if(values.bankAccountNumber) formData.append("bankAccountNumber", values.bankAccountNumber);

      // Append Files & Document Types
      const documentTypes: string[] = [];
      
      // Helper to append file
      const appendFile = (fileList: any, type: string) => {
        if (fileList && fileList.length > 0) {
          formData.append("documents", fileList[0]);
          documentTypes.push(type);
        }
      };

      appendFile(values.doc_id, "national_id");
      appendFile(values.doc_bank, "bank_statement");
      if (values.sellerType === "business") {
        appendFile(values.doc_certificate, "business_registration");
      }
      if (values.doc_tax && values.doc_tax.length > 0) {
        appendFile(values.doc_tax, "tax_certificate");
      }

      formData.append("documentTypes", JSON.stringify(documentTypes));

      // Submit
      await api.post("/seller/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await refreshUser();
      toast.success("Application Submitted", {
        description: "Your seller application is under review.",
      });
      router.push("/dashboard");

    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 429) {
         toast.error("Too Many Attempts", {
           description: "You've submitted too many applications. Please wait a while before trying again.",
         });
      } else {
        toast.error("Application Failed", {
          description: error.response?.data?.msg || "Something went wrong.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- Render Steps ---

  const renderStep1 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField control={form.control} name="businessName" render={({ field }) => (
          <FormItem>
            <FormLabel>Business Name</FormLabel>
            <FormControl><Input placeholder="e.g. Zim Tech" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="jobTitle" render={({ field }) => (
          <FormItem>
            <FormLabel>Your Job Title</FormLabel>
            <FormControl><Input placeholder="e.g. Owner, Manager" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <FormField control={form.control} name="sellerType" render={({ field }) => (
        <FormItem>
          <FormLabel>Seller Type</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select Seller Type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="individual">Individual / Sole Trader</SelectItem>
              <SelectItem value="business">Registered Business</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField control={form.control} name="phoneNumber" render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <div className="flex gap-2">
                <Select defaultValue="+263" onValueChange={(val) => setPhoneCode(val)}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="+263" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="+263">ZW (+263)</SelectItem>
                     <SelectItem value="+27">ZA (+27)</SelectItem>
                     <SelectItem value="+1">US (+1)</SelectItem>
                     <SelectItem value="+44">UK (+44)</SelectItem>
                     <SelectItem value="+86">CN (+86)</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="772123456" {...field} />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField
                  control={form.control}
                  name="whatsappNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp Number</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Select value={whatsappCode} onValueChange={setWhatsappCode}>
                            <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="+263" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="+263">+263</SelectItem>
                              <SelectItem value="+27">+27</SelectItem>
                              <SelectItem value="+1">+1</SelectItem>
                              <SelectItem value="+44">+44</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input placeholder="771234567" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
      </div>

      <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Operating Address</h3>
                  <FormField
                    control={form.control}
                    name="streetAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Samora Machel Ave" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Harare" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="province"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Province / State</FormLabel>
                          <FormControl>
                            <Input placeholder="Harare" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

      <FormField control={form.control} name="website" render={({ field }) => (
        <FormItem>
          <FormLabel>Website / Social Link (Optional)</FormLabel>
          <FormControl>
            <Input 
              placeholder="www.yourbusiness.com" 
              {...field} 
              onBlur={() => {
                const val = field.value;
                if (val && !val.startsWith("http") && val.includes(".")) {
                  field.onChange("https://" + val);
                }
                field.onBlur();
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField control={form.control} name="productCategory" render={({ field }) => (
          <FormItem>
            <FormLabel>Main Product Category</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="clothing">Clothing & Fashion</SelectItem>
                <SelectItem value="home">Home & Garden</SelectItem>
                <SelectItem value="beauty">Health & Beauty</SelectItem>
                <SelectItem value="toys">Toys & Hobbies</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="totalSkuCount" render={({ field }) => (
          <FormItem>
            <FormLabel>Estimated SKU Count</FormLabel>
             <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="10">1-10</SelectItem>
                <SelectItem value="50">11-50</SelectItem>
                <SelectItem value="200">51-200</SelectItem>
                <SelectItem value="500">201+</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField control={form.control} name="annualRevenue" render={({ field }) => (
          <FormItem>
            <FormLabel>Annual Revenue (USD)</FormLabel>
             <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="<10k">Less than $10,000</SelectItem>
                <SelectItem value="10k-50k">$10,000 - $50,000</SelectItem>
                <SelectItem value="50k-500k">$50,000 - $500,000</SelectItem>
                <SelectItem value=">500k">$500,000+</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="primarySalesChannel" render={({ field }) => (
          <FormItem>
            <FormLabel>Primary Sales Channel</FormLabel>
             <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="retail">Physical Retail Store</SelectItem>
                <SelectItem value="online_store">Own Online Store</SelectItem>
                <SelectItem value="social">Social Media (FB/Insta)</SelectItem>
                <SelectItem value="wholesale">Wholesale</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
      </div>

    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mb-6">
        <h4 className="font-semibold text-blue-800 mb-1">Verify Your Identity</h4>
        <p className="text-sm text-blue-700">Please upload clear images (JPG/PNG) or PDFs. Max 5MB each.</p>
      </div>

      <FormField control={form.control} name="doc_id" render={({ field: { value, onChange, ...field } }) => (
        <FormItem>
          <FormLabel>Government ID (Passport / National ID) *</FormLabel>
          <FormControl>
            <div className="space-y-2">
              <Input 
                {...field} 
                type="file" 
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => onChange(e.target.files)} 
              />

            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

       <FormField control={form.control} name="doc_bank" render={({ field: { value, onChange, ...field } }) => (
        <FormItem>
          <FormLabel>Bank Confirmation / Statement *</FormLabel>
          <FormDescription>Proof of account for payouts.</FormDescription>
          <FormControl>
            <div className="space-y-2">
              <Input 
                {...field} 
                type="file" 
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => onChange(e.target.files)} 
              />

            </div>
          </FormControl>
           <FormMessage />
        </FormItem>
      )} />

      {form.watch("sellerType") === "business" && (
        <FormField control={form.control} name="doc_certificate" render={({ field: { value, onChange, ...field } }) => (
          <FormItem>
            <FormLabel>Company Registration Certificate *</FormLabel>
            <FormControl>
              <div className="space-y-2">
                <Input 
                  {...field} 
                  type="file" 
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => onChange(e.target.files)} 
                />

              </div>
            </FormControl>
             <FormMessage />
          </FormItem>
        )} />
      )}

      <FormField control={form.control} name="doc_tax" render={({ field: { value, onChange, ...field } }) => (
        <FormItem>
          <FormLabel>Tax Clearance (Optional)</FormLabel>
          <FormControl>
            <div className="space-y-2">
              <Input 
                {...field} 
                type="file" 
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => onChange(e.target.files)} 
              />

            </div>
          </FormControl>
           <FormMessage />
        </FormItem>
      )} />

    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Operational Agreements</h3>
        
        <FormField control={form.control} name="catalogStandardsAgreed" render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>I agree to the Catalog Quality Standards</FormLabel>
              <FormDescription>All product images will be on neutral backgrounds and include accurate descriptions/UPCs.</FormDescription>
            </div>
          </FormItem>
        )} />

        <FormField control={form.control} name="slaAgreed" render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>I agree to the Service Level Agreement (SLA)</FormLabel>
              <FormDescription>I will ship orders within 48 hours, provide tracking, and maintain a low defect rate.</FormDescription>
            </div>
          </FormItem>
        )} />
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium text-shop_dark_green">Payout Details</h3>
        
        {/* EcoCash Section */}
        <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700">EcoCash</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField control={form.control} name="ecocashNumber" render={({ field }) => (
              <FormItem>
                <FormLabel>EcoCash Number</FormLabel>
                <FormControl><Input placeholder="e.g., 0772123456" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="ecocashName" render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name</FormLabel>
                <FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* Bank Transfer Section */}
        <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700">Bank Transfer (Optional)</h4>
          <FormField control={form.control} name="bankName" render={({ field }) => (
              <FormItem>
                <FormLabel>Bank Name</FormLabel>
                <FormControl><Input placeholder="e.g. CBZ Bank" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField control={form.control} name="bankAccountName" render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name</FormLabel>
                <FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
             <FormField control={form.control} name="bankAccountNumber" render={({ field }) => (
              <FormItem>
                <FormLabel>Account Number</FormLabel>
                <FormControl><Input placeholder="e.g., 1234567890" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (loading || (!isAuthenticated && !loading)) {
    return <div className="flex justify-center p-20">Loading...</div>;
  }

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-2 text-shop_dark_green">Become a WyZar Seller</h1>
      <p className="text-center text-gray-500 mb-8">Join the premium marketplace for top brands.</p>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm font-medium mb-2 text-gray-600">
          <span className={currentStep >= 1 ? "text-shop_dark_green" : ""}>Step 1: Application</span>
          <span className={currentStep >= 2 ? "text-shop_dark_green" : ""}>Step 2: Documents</span>
          <span className={currentStep >= 3 ? "text-shop_dark_green" : ""}>Step 3: Agreements</span>
        </div>
        <Progress value={(currentStep / 3) * 100} className="h-2" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.error("Validation Errors:", JSON.stringify(errors, null, 2));
          console.log("Current Form Values:", form.getValues());
          toast.error("Form Validation Failed", {
            description: Object.values(errors).map((e: any) => e.message).join(", ") || "Unknown error. Check console."
          });
        })} className="bg-white p-6 md:p-8 rounded-xl border shadow-sm space-y-8">
          
          <AnimatePresence mode="wait">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </AnimatePresence>

          <div className="flex justify-between pt-4 border-t">
            {currentStep > 1 ? (
              <Button type="button" variant="outline" onClick={prevStep}>Back</Button>
            ) : (
              <div></div>
            )}
            
            {currentStep < 3 ? (
              <Button type="button" onClick={nextStep} className="bg-shop_dark_green hover:bg-shop_dark_green/90 text-white">
                Next Step
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="bg-shop_dark_green hover:bg-shop_dark_green/90 text-white w-full md:w-auto px-8">
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            )}
          </div>

        </form>
      </Form>
    </div>
  );
}
