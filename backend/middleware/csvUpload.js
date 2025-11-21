const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage(); // Use memory storage for CSV files to parse them directly

const csvUpload = multer({
  storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
}).single('products-csv');

function checkFileType(file, cb) {
  const filetypes = /csv/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype === 'text/csv';

  if (extname || mimetype) {
    return cb(null, true);
  } else {
    cb('Error: CSV Files Only!');
  }
}

module.exports = csvUpload;
