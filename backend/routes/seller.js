// In backend/routes/seller.js

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const verificationUploadOptimized = require("../middleware/verificationUploadOptimized");
const prisma = require("../config/prisma");
const multer = require("multer");
const path = require("path");
const { getStoragePath, getPublicUrl } = require("../config/localStorage");

// Configure multer for multiple verification documents
const verificationStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = getStoragePath("verification");
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      req.user.id + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Create a flexible multer upload that accepts both field names
const flexibleUpload = multer({
  storage: verificationStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPG, PNG, GIF) and PDF are allowed"));
    }
  },
}).fields([
  { name: "documents", maxCount: 10 }, // New format: multiple documents
  { name: "verificationDocument", maxCount: 1 }, // Legacy format: single document
]);

// @route   POST /api/seller/apply
// @desc    Apply to become a seller (supports both single and multiple documents)
// @access  Private (only logged-in users)
router.post("/apply", auth, flexibleUpload, async (req, res) => {
  try {
    // Get form data from the request body
    const {
      businessName,
      sellerType,
      phoneNumber,
      address,
      documentTypes,
      // Payment details
      ecocashNumber,
      ecocashName,
      bankName,
      bankAccountName,
      bankAccountNumber,
      whatsappNumber,
      whatsappNumber2,
    } = req.body;

    if (!businessName || !sellerType) {
      return res
        .status(400)
        .json({ msg: "Please fill in business name and seller type." });
    }

    // Normalize files from both upload formats
    // When using .fields(), req.files is an object with field names as keys
    let filesArray = [];
    if (req.files) {
      if (req.files.documents) {
        // New format: multiple documents
        filesArray = req.files.documents;
      } else if (req.files.verificationDocument) {
        // Legacy format: single document
        filesArray = req.files.verificationDocument;
      }
    }

    // Check if files were uploaded
    if (!filesArray || filesArray.length === 0) {
      return res
        .status(400)
        .json({ msg: "Please upload at least one verification document." });
    }

    // Parse document types (sent as JSON string from frontend for multiple docs)
    let docTypes = [];
    if (documentTypes) {
      try {
        docTypes = JSON.parse(documentTypes);
      } catch (e) {
        // If parsing fails, it might be a legacy upload - use default type
      }
    }

    // For legacy single file uploads, use a default document type
    if (docTypes.length === 0 && filesArray.length === 1) {
      // Determine default type based on seller type
      const defaultType =
        req.body.sellerType === "individual"
          ? "national_id"
          : "business_registration";
      docTypes = [defaultType];
    }

    // Ensure we have a document type for each uploaded file
    if (docTypes.length !== filesArray.length) {
      return res
        .status(400)
        .json({ msg: "Please specify document type for each uploaded file." });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { sellerDetails: true },
    });
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    // Prepare verification documents array
    const verificationDocuments = filesArray.map((file, index) => ({
      documentType: docTypes[index],
      documentPath: file.path,
      documentName: file.originalname,
      uploadedAt: new Date(),
      status: "pending",
    }));

    // Parse address if provided
    let parsedAddress = null;
    if (address) {
      try {
        parsedAddress = JSON.parse(address);
      } catch (e) {
        // Address is optional, so we can ignore parse errors
      }
    }

    // Update the user with seller information
    await prisma.user.update({
      where: { id: req.user.id },
      data: { isSeller: true, isVerified: false },
    });

    // Create or update seller details with documents
    await prisma.sellerDetails.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        businessName,
        sellerType: sellerType.toUpperCase(),
        phoneNumber,
        // Payment details
        ecocashNumber: ecocashNumber || null,
        ecocashName: ecocashName || null,
        bankName: bankName || null,
        bankAccountName: bankAccountName || null,
        bankAccountNumber: bankAccountNumber || null,
        whatsappNumber: whatsappNumber || null,
        whatsappNumber2: whatsappNumber2 || null,
        streetAddress: parsedAddress?.street || null,
        city: parsedAddress?.city || null,
        state: parsedAddress?.state || null,
        country: parsedAddress?.country || null,
        postalCode: parsedAddress?.postalCode || null,
        verificationStatus: "UNDER_REVIEW",
        verificationDocuments: {
          create: verificationDocuments.map((doc, index) => ({
            documentType: docTypes[index].toUpperCase().replace("-", "_"),
            documentPath: doc.documentPath,
            documentName: doc.documentName,
            status: "PENDING",
          })),
        },
      },
      update: {
        businessName,
        sellerType: sellerType.toUpperCase(),
        phoneNumber,
        // Payment details
        ecocashNumber: ecocashNumber || undefined,
        ecocashName: ecocashName || undefined,
        bankName: bankName || undefined,
        bankAccountName: bankAccountName || undefined,
        bankAccountNumber: bankAccountNumber || undefined,
        whatsappNumber: whatsappNumber || undefined,
        whatsappNumber2: whatsappNumber2 || undefined,
        streetAddress: parsedAddress?.street || undefined,
        city: parsedAddress?.city || undefined,
        state: parsedAddress?.state || undefined,
        country: parsedAddress?.country || undefined,
        postalCode: parsedAddress?.postalCode || undefined,
        verificationStatus: "UNDER_REVIEW",
        verificationDocuments: {
          create: verificationDocuments.map((doc, index) => ({
            documentType: docTypes[index].toUpperCase().replace("-", "_"),
            documentPath: doc.documentPath,
            documentName: doc.documentName,
            status: "PENDING",
          })),
        },
      },
    });

    // Send back the updated user data (excluding password)
    const userResponse = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        isSeller: true,
        isVerified: true,
        role: true,
        isSuspended: true,
        createdAt: true,
        updatedAt: true,
        sellerDetails: {
          include: {
            verificationDocuments: true,
          },
        },
      },
    });
    res.json({
      msg: `Application submitted successfully with ${filesArray.length} document(s)!`,
      user: userResponse,
    });
  } catch (err) {
    console.error("Error in seller application:", err.message);
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
});

// @route   POST /api/seller/upload-document
// @desc    Upload additional verification document for existing seller
// @access  Private (seller only)
router.post("/upload-document", auth, (req, res) => {
  // Use single file upload
  verificationUploadOptimized(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ msg: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ msg: "No document uploaded." });
    }

    const { documentType } = req.body;

    if (!documentType) {
      return res.status(400).json({ msg: "Document type is required." });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { sellerDetails: true },
      });
      if (!user) {
        return res.status(404).json({ msg: "User not found." });
      }

      if (!user.isSeller) {
        return res
          .status(403)
          .json({ msg: "Only sellers can upload verification documents." });
      }

      if (!user.sellerDetails) {
        return res.status(400).json({ msg: "Seller details not found." });
      }

      // Add new document
      const newDocument = await prisma.verificationDocument.create({
        data: {
          sellerDetailsId: user.sellerDetails.id,
          documentType: documentType.toUpperCase().replace("-", "_"),
          documentPath: req.file.path,
          documentName: req.file.originalname,
          status: "PENDING",
        },
      });

      // Update verification status if it was rejected
      if (user.sellerDetails.verificationStatus === "REJECTED") {
        await prisma.sellerDetails.update({
          where: { id: user.sellerDetails.id },
          data: { verificationStatus: "UNDER_REVIEW" },
        });
      }

      res.json({
        msg: "Document uploaded successfully",
        document: newDocument,
      });
    } catch (err) {
      console.error("Error uploading document:", err.message);
      res.status(500).json({ msg: "Server Error", error: err.message });
    }
  });
});

// @route   PUT /api/seller/profile
// @desc    Update seller profile
// @access  Private (seller only)
router.put("/profile", auth, async (req, res) => {
  const { 
    businessName, phoneNumber, address,
    // Payment details
    ecocashNumber, ecocashName, bankName, bankAccountName, bankAccountNumber,
    whatsappNumber, whatsappNumber2
  } = req.body;

  if (!businessName) {
    return res.status(400).json({ msg: "Business name is required." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { sellerDetails: true },
    });

    if (!user || !user.isSeller) {
      return res.status(401).json({ msg: "Not authorized." });
    }

    if (!user.sellerDetails) {
      return res.status(400).json({ msg: "Seller details not found." });
    }

    // Update the sellerDetails
    await prisma.sellerDetails.update({
      where: { id: user.sellerDetails.id },
      data: {
        businessName,
        phoneNumber: phoneNumber || undefined,
        // Payment details
        ecocashNumber: ecocashNumber || undefined,
        ecocashName: ecocashName || undefined,
        bankName: bankName || undefined,
        bankAccountName: bankAccountName || undefined,
        bankAccountNumber: bankAccountNumber || undefined,
        whatsappNumber: whatsappNumber || undefined,
        whatsappNumber2: whatsappNumber2 || undefined,
        streetAddress: address?.street || undefined,
        city: address?.city || undefined,
        state: address?.state || undefined,
        country: address?.country || undefined,
        postalCode: address?.postalCode || undefined,
      },
    });

    // Send back the updated user data (excluding password)
    const userResponse = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        isSeller: true,
        isVerified: true,
        role: true,
        isSuspended: true,
        createdAt: true,
        updatedAt: true,
        sellerDetails: {
          include: {
            verificationDocuments: true,
          },
        },
      },
    });
    res.json({ msg: "Profile updated successfully!", user: userResponse });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
