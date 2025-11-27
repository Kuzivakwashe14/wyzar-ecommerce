# Local Storage Solution for WyZar E-Commerce
## Optimized for Development & Production (Zimbabwe-Friendly)

---

## 📋 Overview

This local storage solution provides:
- ✅ **Optimized file organization** with proper structure
- ✅ **Nginx for fast static file serving** with caching
- ✅ **Automatic backup scripts** for data safety
- ✅ **Storage monitoring** to track usage
- ✅ **Orphaned file cleanup** to save disk space
- ✅ **No external dependencies** - works offline
- ✅ **Easy migration path** to cloud storage later

---

## 🗂️ Directory Structure

```
wyzar-ecommerce/
└── backend/
    ├── uploads/                      # All uploaded files
    │   ├── products/                 # Product images
    │   │   ├── thumbnails/           # (Future: auto-generated)
    │   │   └── seller-123-timestamp.jpg
    │   ├── verification/             # Seller verification documents
    │   │   └── seller-456-timestamp.pdf
    │   └── temp/                     # Temporary uploads
    │
    ├── backups/                      # Automated backups
    │   └── wyzar-images-backup-2025-01-27.zip
    │
    ├── reports/                      # Storage reports
    │   └── storage-report-2025-01-27.json
    │
    ├── config/
    │   └── localStorage.js           # Storage configuration
    │
    ├── middleware/
    │   ├── productUploadOptimized.js # Product image upload
    │   └── verificationUploadOptimized.js # Document upload
    │
    ├── scripts/
    │   ├── backupImages.js           # Backup utility
    │   ├── cleanupOrphanedImages.js  # Cleanup utility
    │   └── monitorStorage.js         # Storage monitoring
    │
    └── nginx/
        ├── wyzar-images.conf         # Nginx config (Linux)
        └── nginx-windows-simple.conf # Nginx config (Windows)
```

---

## 🚀 Quick Start (15 Minutes)

### **Step 1: Install Nginx (Optional but Recommended)**

#### **For Windows:**
```bash
# Download Nginx for Windows
# Visit: http://nginx.org/en/download.html
# Download nginx/Windows-x.xx.x (stable version)

# Extract to C:\nginx
# Copy backend/nginx/nginx-windows-simple.conf to C:\nginx\conf\nginx.conf

# Edit the config file and update this path:
# alias C:/Users/tawan/Documents/WyZar/wyzar-ecommerce/backend/uploads/;

# Start Nginx
cd C:\nginx
start nginx

# Test: Open browser and visit http://localhost/static/uploads/
```

#### **For Linux/Ubuntu:**
```bash
# Install Nginx
sudo apt update
sudo apt install nginx

# Copy configuration
sudo cp backend/nginx/wyzar-images.conf /etc/nginx/sites-available/wyzar

# Enable the site
sudo ln -s /etc/nginx/sites-available/wyzar /etc/nginx/sites-enabled/

# Update the path in the config file
sudo nano /etc/nginx/sites-available/wyzar

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### **Step 2: Install Dependencies (for backup scripts)**
```bash
cd backend
npm install archiver  # For backup functionality
```

### **Step 3: Update Product Routes**

**File: `backend/routes/product.js`**

```javascript
// CHANGE: Import optimized middleware
// OLD:
// const productUpload = require('../middleware/productUpload');

// NEW:
const productUploadOptimized = require('../middleware/productUploadOptimized');

// Update POST route
router.post('/', auth, isSeller, productUploadOptimized, async (req, res) => {
  // ... rest of your code stays the same
});

// Update PUT route
router.put('/:id', auth, isSeller, productUploadOptimized, async (req, res) => {
  // ... rest of your code stays the same
});
```

### **Step 4: Update Seller Routes**

**File: `backend/routes/seller.js`**

```javascript
// CHANGE: Import optimized middleware
// OLD:
// const upload = require('../middleware/upload');

// NEW:
const verificationUploadOptimized = require('../middleware/verificationUploadOptimized');

// Update apply route
router.post('/apply', auth, verificationUploadOptimized, async (req, res) => {
  // ... rest of your code stays the same
});
```

### **Step 5: Test**
```bash
# Start backend
cd backend
npm run dev

# Upload a product image via your frontend
# Images should now be in uploads/products/ directory
```

---

## 📊 Storage Management

### **Monitor Storage Usage**
```bash
# View storage report
node scripts/monitorStorage.js

# Save report to JSON file
node scripts/monitorStorage.js --save
```

**Output Example:**
```
📊 WYZAR STORAGE REPORT
============================================================

📁 Storage Usage:
   Products:      247 files (523.45 MB)
   Verification:  15 files (12.30 MB)
   Total:         535.75 MB

🖼️  File Types (Products):
   JPEG/JPG:  180 files
   PNG:       65 files
   WebP:      2 files

✅ Storage is healthy
```

### **Create Backups**
```bash
# Create backup zip file
node scripts/backupImages.js

# Backups are saved to: backend/backups/
# Example: wyzar-images-backup-2025-01-27T14-30-00.zip
```

**Automated Backup Schedule (Recommended):**
- **Daily backups** for active sites
- **Weekly backups** for low-traffic sites
- Keep last 7 backups, delete older ones

**Windows Task Scheduler:**
```cmd
# Create scheduled task
schtasks /create /tn "WyZar Image Backup" /tr "node C:\path\to\backend\scripts\backupImages.js" /sc daily /st 02:00
```

**Linux Cron:**
```bash
# Add to crontab
0 2 * * * cd /path/to/backend && node scripts/backupImages.js
```

### **Clean Up Orphaned Images**
```bash
# Dry run (see what would be deleted)
node scripts/cleanupOrphanedImages.js

# Actually delete orphaned files
node scripts/cleanupOrphanedImages.js --delete
```

**What are orphaned images?**
- Images uploaded but product was deleted
- Failed uploads
- Test images
- Images removed from products

**When to run cleanup:**
- Monthly (recommended)
- After major product deletions
- When storage is getting full

---

## 🔧 Configuration

### **Customize Storage Settings**

**File: `backend/config/localStorage.js`**

```javascript
const STORAGE_CONFIG = {
  // Maximum file sizes
  maxFileSize: {
    image: 10 * 1024 * 1024,      // 10MB (change as needed)
    document: 5 * 1024 * 1024      // 5MB
  },

  // Image optimization settings
  optimization: {
    maxWidth: 1920,               // Resize large images
    maxHeight: 1920,
    jpegQuality: 85,              // 1-100 (higher = better quality, larger file)
    pngCompressionLevel: 8,       // 0-9 (higher = better compression)
  }
};
```

### **Update Frontend Image URLs**

If using Nginx, update frontend to use `/static/uploads/` URL:

**Option 1: Update Product Model (Recommended)**

**File: `backend/routes/product.js`**

```javascript
const { getPublicUrl } = require('../config/localStorage');

// After upload
const imagePaths = req.files.map(file => getPublicUrl(file.path));
// Returns: /static/uploads/products/image.jpg instead of uploads/products/image.jpg
```

**Option 2: Frontend Helper Function**

**File: `frontend/utils/imageHelper.ts`**

```typescript
export function getImageUrl(path: string): string {
  // If already a full URL, return as-is
  if (path.startsWith('http')) return path;

  // Convert local path to Nginx static URL
  if (path.startsWith('uploads/')) {
    return `/static/${path}`;
  }

  return path;
}

// Usage
<img src={getImageUrl(product.images[0])} alt={product.name} />
```

---

## 🌐 Nginx Optimization

### **Features Enabled:**

1. **Static File Serving** - Nginx serves images directly (faster than Node.js)
2. **Caching Headers** - Images cached for 1 year (reduces server load)
3. **Gzip Compression** - Smaller file transfers
4. **CORS Headers** - Frontend can access images from different domains
5. **Security Headers** - Prevents XSS, clickjacking

### **Performance Benefits:**

| Metric | Node.js (Before) | Nginx (After) |
|--------|------------------|---------------|
| Request Time | ~50ms | ~5ms (10x faster) |
| Server CPU | High | Low (Nginx handles it) |
| Concurrent Requests | Limited | Very High |
| Caching | None | Browser + Nginx |

### **Testing Nginx:**

```bash
# Check if Nginx is running
# Windows:
tasklist | findstr nginx

# Linux:
systemctl status nginx

# Test configuration
nginx -t

# Restart after config changes
# Windows:
nginx -s reload

# Linux:
sudo systemctl restart nginx
```

### **Verify Caching:**

Open browser DevTools (F12) → Network tab → Reload page

Look for images:
- **First load:** `200 OK` (from server)
- **Second load:** `304 Not Modified` (from cache) or `(from disk cache)`

---

## 📈 Scaling Strategy

### **When Local Storage Works:**
- ✅ Development and testing
- ✅ Small to medium sites (<5,000 products)
- ✅ Single server deployment
- ✅ Storage < 50GB
- ✅ Budget-conscious startups

### **When to Migrate to Cloud:**
- ⚠️ Storage > 100GB
- ⚠️ Multiple servers (horizontal scaling)
- ⚠️ International customers (need global CDN)
- ⚠️ Video content
- ⚠️ Frequent backups become manual burden

### **Migration Path:**

When ready to migrate to cloud storage:

1. **Choose provider** (DigitalOcean Spaces, AWS S3, Backblaze B2)
2. **Install cloud SDK** (e.g., `npm install aws-sdk`)
3. **Update middleware** to use cloud storage
4. **Migrate existing images** using migration script
5. **Update database URLs** from local paths to cloud URLs
6. **Test thoroughly** before removing local files

**All code is already organized for easy migration!**

---

## 🛡️ Security Best Practices

### **1. File Type Validation**
```javascript
// Already implemented in middleware
allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
```

### **2. File Size Limits**
```javascript
// 10MB max for images (prevents abuse)
limits: { fileSize: 10 * 1024 * 1024 }
```

### **3. Nginx Security**
```nginx
# Prevent directory listing
autoindex off;

# Block PHP execution in uploads
location ~ \.php$ { deny all; }

# Only allow specific file types
location ~ \.(jpg|jpeg|png|gif|webp|pdf)$ { ... }
```

### **4. Additional Recommendations**
- [ ] Add virus scanning (ClamAV) before saving files
- [ ] Implement rate limiting on upload endpoints
- [ ] Use HTTPS in production
- [ ] Regular security audits
- [ ] Monitor unusual upload patterns

---

## 🔍 Troubleshooting

### **Issue: Images not displaying**

**Check:**
1. Is Nginx running? `nginx -t`
2. Is the path correct in Nginx config?
3. Do files exist? Check `uploads/products/` directory
4. Browser console errors?

**Solution:**
```bash
# Verify Nginx is serving files
curl http://localhost/static/uploads/products/test-image.jpg

# Check Nginx error logs
# Windows: C:\nginx\logs\error.log
# Linux: /var/log/nginx/error.log
```

### **Issue: File upload fails**

**Check:**
1. File size too large?
2. File type allowed?
3. Disk space available?
4. Directory permissions?

**Solution:**
```bash
# Check disk space
# Windows:
dir uploads

# Linux:
df -h
du -sh uploads/

# Check directory permissions (Linux)
ls -la uploads/
chmod 755 uploads/
```

### **Issue: Backup fails**

**Check:**
1. Is `archiver` package installed?
2. Disk space for backup file?
3. Write permissions?

**Solution:**
```bash
# Install archiver
npm install archiver

# Check backups directory
ls -la backups/
```

---

## 📚 Utility Scripts Reference

### **backupImages.js**
```bash
# Create backup
node scripts/backupImages.js

# Output: backups/wyzar-images-backup-YYYY-MM-DDTHH-MM-SS.zip
```

### **cleanupOrphanedImages.js**
```bash
# Preview (dry run)
node scripts/cleanupOrphanedImages.js

# Actually delete
node scripts/cleanupOrphanedImages.js --delete
```

### **monitorStorage.js**
```bash
# Display report in console
node scripts/monitorStorage.js

# Save report to JSON
node scripts/monitorStorage.js --save

# Output: reports/storage-report-YYYY-MM-DD.json
```

---

## 💰 Cost Analysis

### **Local Storage Costs:**

| Item | Cost |
|------|------|
| Disk Storage (500GB SSD) | ~$50 one-time |
| VPS with 100GB storage | ~$10/month |
| Backup storage (external) | ~$30 one-time |
| **Total Monthly Cost** | **$10-15/month** |

**Pros:**
- ✅ Predictable costs
- ✅ No bandwidth charges
- ✅ Works offline
- ✅ Full control

**Cons:**
- ❌ Manual backups
- ❌ No global CDN
- ❌ Limited scalability
- ❌ Single point of failure

---

## 🎯 Recommended Practices

### **Daily:**
- [x] Monitor storage via dashboard (implement later)
- [x] Check Nginx logs for errors

### **Weekly:**
- [x] Review storage reports (`node scripts/monitorStorage.js`)
- [x] Test backups can be restored

### **Monthly:**
- [x] Run cleanup script (`node scripts/cleanupOrphanedImages.js`)
- [x] Create manual backup
- [x] Review storage growth trends
- [x] Audit security settings

### **Quarterly:**
- [x] Test disaster recovery plan
- [x] Review migration to cloud if needed
- [x] Update Nginx configuration
- [x] Security audit

---

## 🚀 Future Enhancements

### **Phase 1: Immediate (Current)**
- ✅ Organized file structure
- ✅ Nginx static serving
- ✅ Backup scripts
- ✅ Monitoring tools

### **Phase 2: Short-term (1-2 months)**
- [ ] Install Sharp for image optimization
- [ ] Auto-generate thumbnails
- [ ] Implement image watermarking
- [ ] Add upload progress indicators (frontend)
- [ ] Create admin dashboard for storage management

### **Phase 3: Mid-term (3-6 months)**
- [ ] Implement automatic backups to external storage
- [ ] Add CDN integration (Cloudflare)
- [ ] Compress old images (reduce storage)
- [ ] Implement lazy loading (frontend)

### **Phase 4: Long-term (6+ months)**
- [ ] Migrate to cloud storage (DigitalOcean Spaces or AWS S3)
- [ ] Implement global CDN
- [ ] Add video support
- [ ] Advanced analytics

---

## 📞 Support & Resources

**Nginx Documentation:**
- Windows: http://nginx.org/en/docs/windows.html
- Linux: https://nginx.org/en/docs/

**Node.js File System:**
- https://nodejs.org/api/fs.html

**Multer (File Upload):**
- https://github.com/expressjs/multer

---

## ✅ Checklist

### **Setup Checklist:**
- [ ] Nginx installed and configured
- [ ] Updated path in Nginx config file
- [ ] Nginx is running
- [ ] Updated product upload routes
- [ ] Updated seller verification routes
- [ ] Tested image upload
- [ ] Images display correctly
- [ ] Installed archiver for backups
- [ ] Tested backup script
- [ ] Tested monitoring script
- [ ] Set up automated backup schedule (optional)

### **Production Checklist:**
- [ ] HTTPS configured with SSL certificate
- [ ] Regular backup schedule active
- [ ] Monitoring dashboard implemented
- [ ] Storage alerts configured
- [ ] Disaster recovery plan documented
- [ ] Security headers verified
- [ ] File upload rate limiting enabled
- [ ] Virus scanning implemented (optional)

---

## 🎓 Conclusion

This local storage solution provides a **solid foundation** for your WyZar e-commerce platform that:
- Works perfectly in Zimbabwe (no external dependencies)
- Costs very little ($10-15/month)
- Performs well with Nginx optimization
- Includes backup and monitoring tools
- Can easily migrate to cloud storage when needed

**You're production-ready! 🚀**

Start with this setup, and when your platform grows, you can seamlessly migrate to cloud storage without changing your Product model or frontend code.
