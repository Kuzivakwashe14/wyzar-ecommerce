# ImageKit Integration Guide

This guide explains how ImageKit has been configured in your WyZar E-Commerce application.

## Overview

ImageKit is now integrated for cloud-based image management, providing:
- **Fast CDN delivery** worldwide
- **Automatic image optimization** (format, quality, size)
- **Real-time transformations** (resize, crop, etc.)
- **Reduced server load** - no local storage needed
- **Better performance** for your users

## Setup Steps

### 1. Get ImageKit Credentials

1. Sign up at [ImageKit.io](https://imagekit.io) (free tier available)
2. Go to your [ImageKit Dashboard](https://imagekit.io/dashboard)
3. Navigate to **Developer Options** → **API Keys**
4. Copy your:
   - **Public Key**
   - **Private Key**
   - **URL Endpoint** (e.g., `https://ik.imagekit.io/your_id`)

### 2. Configure Environment Variables

Update your `backend/.env` file with your ImageKit credentials:

```env
# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key_here
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key_here
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id_here
```

### 3. Run Database Migration

The Product model now includes `imageFileIds` field to track ImageKit file IDs:

```bash
cd backend
npx prisma migrate dev --name add_imagekit_support
```

### 4. Restart Your Application

```bash
# Backend
cd backend
npm start

# Frontend
cd ../frontend
npm run dev
```

## What Changed

### Backend Changes

1. **New Dependencies**
   - `@imagekit/nodejs` - ImageKit Node.js SDK

2. **New Configuration** (`backend/config/imagekit.js`)
   - ImageKit client initialization
   - Upload/delete functions
   - Image optimization utilities

3. **New Middleware** (`backend/middleware/imagekitUpload.js`)
   - Product image uploads
   - Verification document uploads
   - Payment proof uploads

4. **New Route** (`backend/routes/imagekit.js`)
   - `/api/imagekit/config` - Get public config
   - `/api/imagekit/auth` - Get auth parameters

5. **Updated Routes**
   - Product creation now uploads to ImageKit
   - Product updates replace images on ImageKit
   - Product deletion removes images from ImageKit

6. **Database Schema**
   - Added `imageFileIds` field to Product model

### Frontend Changes

1. **New Dependencies**
   - `@imagekit/react` - ImageKit React SDK

2. **New Components**
   - `ImageKitProvider` - Context provider for ImageKit
   - `OptimizedImage` - Smart image component
   - `ProductImage` - Product-specific image component
   - `AvatarImage` - Avatar image component

3. **New Utilities** (`frontend/lib/imagekit.ts`)
   - Image URL optimization
   - Responsive image srcsets
   - Thumbnail generation

4. **Updated Layout**
   - ImageKit provider added to app layout

## Usage Examples

### Backend - Upload Product Images

The routes automatically handle ImageKit uploads:

```javascript
// POST /api/products
// Upload images via multipart/form-data
// Field name: 'productImages' (up to 5 images)
```

### Frontend - Display Optimized Images

Use the new `OptimizedImage` components:

```tsx
import { ProductImage } from '@/components/ui/OptimizedImage';

// In your component
<ProductImage
  src={product.images[0]}
  alt={product.name}
  size="medium"
  onClick={() => handleImageClick()}
/>
```

### Frontend - Image Transformations

```tsx
import { OptimizedImage } from '@/components/ui/OptimizedImage';

<OptimizedImage
  src={imageUrl}
  alt="Product"
  width={800}
  height={600}
  transformation={{
    quality: 90,
    format: 'auto',
    crop: 'at_max',
    focus: 'auto'
  }}
/>
```

### Get Optimized URL Programmatically

```tsx
import { getOptimizedImageUrl, getThumbnailUrl } from '@/lib/imagekit';

// Get optimized URL
const optimizedUrl = getOptimizedImageUrl(imageUrl, {
  width: 800,
  quality: 85,
  format: 'auto'
});

// Get thumbnail
const thumbnailUrl = getThumbnailUrl(imageUrl, 200);
```

## Benefits

### Performance
- **CDN**: Images served from global CDN
- **Auto-format**: WebP for supported browsers
- **Lazy loading**: Images load as needed
- **Compression**: Automatic size optimization

### Storage
- **No local storage**: Server disk space freed
- **Easy backup**: Images stored in cloud
- **Scalable**: No storage limits to worry about

### Features
- **On-the-fly resize**: Any size without pre-processing
- **Quality control**: Automatic quality optimization
- **Format conversion**: Auto WebP/AVIF support
- **Transformations**: Crop, rotate, blur, etc.

## Image Transformations

ImageKit supports many transformations:

```tsx
{
  width: 800,           // Resize width
  height: 600,          // Resize height
  quality: 85,          // Quality (1-100)
  format: 'auto',       // Format (auto/webp/jpg/png)
  crop: 'at_max',       // Crop mode
  focus: 'auto',        // Focus area
  blur: 10,             // Blur amount
  rotation: 90,         // Rotation angle
}
```

## Migration from Local Storage

### Existing Images
Your existing local images will continue to work. When products are updated with new images:
1. New images → Uploaded to ImageKit
2. Old images → Remain on local storage

### Full Migration (Optional)
To migrate all existing images to ImageKit, you can create a migration script:

```javascript
// backend/scripts/migrateToImagekit.js
const prisma = require('../config/prisma');
const { uploadToImageKit } = require('../config/imagekit');
const fs = require('fs');
const path = require('path');

async function migrateImages() {
  const products = await prisma.product.findMany();
  
  for (const product of products) {
    const newImages = [];
    const newFileIds = [];
    
    for (const imagePath of product.images) {
      if (!imagePath.includes('ik.imagekit.io')) {
        // Local image - upload to ImageKit
        const localPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(localPath)) {
          const fileBuffer = fs.readFileSync(localPath);
          const result = await uploadToImageKit(
            fileBuffer,
            path.basename(imagePath),
            'products'
          );
          
          if (result.success) {
            newImages.push(result.url);
            newFileIds.push(result.fileId);
          }
        }
      } else {
        // Already on ImageKit
        newImages.push(imagePath);
      }
    }
    
    // Update product
    await prisma.product.update({
      where: { id: product.id },
      data: {
        images: newImages,
        imageFileIds: newFileIds
      }
    });
    
    console.log(`Migrated product: ${product.id}`);
  }
}

migrateImages();
```

## Troubleshooting

### Images not loading
1. Check ImageKit credentials in `.env`
2. Verify backend is running and accessible
3. Check browser console for errors
4. Ensure frontend can reach `/api/imagekit/config`

### Upload fails
1. Check file size (10MB limit for images)
2. Verify file type (jpg, png, gif, webp)
3. Check ImageKit dashboard for quota limits
4. Ensure auth middleware is working

### Transformation not working
1. Verify URL contains ImageKit domain
2. Check transformation syntax
3. Test URL directly in browser
4. Review ImageKit dashboard logs

## API Endpoints

### Backend Endpoints

- `GET /api/imagekit/config` - Get public config (urlEndpoint, publicKey)
- `GET /api/imagekit/auth` - Get auth parameters (requires authentication)
- `POST /api/products` - Create product with images (auto-uploads to ImageKit)
- `PUT /api/products/:id` - Update product (auto-uploads to ImageKit)
- `DELETE /api/products/:id` - Delete product (removes from ImageKit)

## Security

- **Private key** never exposed to frontend
- **Public key** safe to use in client-side code
- **Signed uploads** require backend authentication
- **File validation** on both client and server

## Cost Considerations

ImageKit free tier includes:
- 20 GB bandwidth/month
- 20 GB storage
- Unlimited transformations

For production, consider upgrading based on your traffic.

## Support

- ImageKit Docs: https://docs.imagekit.io
- Node.js SDK: https://github.com/imagekit-developer/imagekit-nodejs
- React SDK: https://github.com/imagekit-developer/imagekit-react

## Next Steps

1. ✅ Set up ImageKit credentials
2. ✅ Run database migration
3. ✅ Test image upload
4. ✅ Test product creation
5. ⬜ (Optional) Migrate existing images
6. ⬜ Monitor usage in ImageKit dashboard
