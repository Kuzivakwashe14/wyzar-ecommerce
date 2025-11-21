// In backend/middleware/upload.js
const multer = require('multer');
const path = require('path');

// 1. Configure Storage
// We are setting up how to store the files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // The 'uploads/' folder we just created
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Create a unique filename to avoid conflicts
    // e.g., 'user_id-timestamp.jpg'
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 2. File Filter (Optional but recommended)
// Ensure we only accept images or PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Only images (jpeg, jpg, png) or PDF files are allowed!'), false);
  }
};

// 3. Initialize Multer
// We'll upload a single file with the field name 'verificationDocument'
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // Limit file size to 5MB
  fileFilter: fileFilter
}).single('verificationDocument'); // This name *must* match the frontend form

module.exports = upload;