# WyZar E-commerce - Render Deployment Guide

## 📋 Prerequisites

1. **Neon PostgreSQL Database** — `DATABASE_URL` ready
2. **ImageKit Account** — `https://ik.imagekit.io/ojgoa8b40/`
3. **Render Account** — [render.com](https://render.com/)
4. **Code pushed to GitHub**

---

## 🚀 Deploy from GitHub (Recommended)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Add Docker configuration for Render deployment"
git push origin main
```

### Step 2: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub account, select the `wyzar-ecommerce` repo
4. Configure:
   - **Environment**: Docker
   - **Dockerfile path**: `./Dockerfile`
   - **Port**: `8000`
   - **Health check path**: `/health`

### Step 3: Set Environment Variables

Add these in the Render dashboard under **Environment**:

```
DATABASE_URL=postgresql://neondb_owner:npg_5bf7oOhynlFQ@ep-late-flower-aijrpe9i-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://YOUR-APP-NAME.onrender.com
ALLOWED_ORIGINS=https://YOUR-APP-NAME.onrender.com
CLERK_PUBLISHABLE_KEY=pk_test_aGVscGVkLXNuYXBwZXItMjYuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_GRM8KLfUkTeJQU8PKzLMi0NA1AbtS3GMTEVFk338ZX
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_aGVscGVkLXNuYXBwZXItMjYuY2xlcmsuYWNjb3VudHMuZGV2JA
JWT_SECRET=z3xGpsah64uM/cqXUISo7R5XigQwZABsGZZatG9g+ftNHbNCwaRZSrftog53t7dt
ENCRYPTION_KEY=4b715039a142d3268501724d48f064ea08e994fc8ffba41b6e134ea0962ee67d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tawandmahachi@gmail.com
EMAIL_PASSWORD=bdng duyb jhrc mhyw
EMAIL_FROM=WyZar <noreply@wyzar.co.zw>
PAYNOW_INTEGRATION_ID=22532
PAYNOW_INTEGRATION_KEY=379add5d-b5b1-4607-932f-64ce772c949e
PAYNOW_RETURN_URL=https://YOUR-APP-NAME.onrender.com/checkout/success
PAYNOW_RESULT_URL=https://YOUR-APP-NAME.onrender.com/api/orders/paynow/callback
PAYNOW_TEST_EMAIL=kuzivakwashekubiku@gmail.com
USE_HTTPS=false
```

> **Important**: Replace `YOUR-APP-NAME` with your actual Render service name.

### Step 4: Set Build Args

In Render's build configuration, add these Docker build arguments:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_aGVscGVkLXNuYXBwZXItMjYuY2xlcmsuYWNjb3VudHMuZGV2JA
NEXT_PUBLIC_API_URL=https://YOUR-APP-NAME.onrender.com
```

### Step 5: Deploy

Click **"Deploy"** and wait 5-10 minutes for build completion.

---

## 🐳 Deploy from Docker Image (Docker Hub)

If you prefer to build the image locally and push to Docker Hub:

### Step 1: Build the Docker Image

```bash
docker build -t your-dockerhub-username/wyzar-ecommerce:latest \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_aGVscGVkLXNuYXBwZXItMjYuY2xlcmsuYWNjb3VudHMuZGV2JA \
  --build-arg NEXT_PUBLIC_API_URL=https://YOUR-APP-NAME.onrender.com \
  .
```

### Step 2: Login & Push to Docker Hub

```bash
docker login
docker push your-dockerhub-username/wyzar-ecommerce:latest
```

### Step 3: Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New"** → **"Web Service"**
3. Select **"Deploy an existing image from a registry"**
4. Enter image: `your-dockerhub-username/wyzar-ecommerce:latest`
5. Set **Port**: `8000`
6. Set **Health check path**: `/health`
7. Add all environment variables from **Step 3** above (GitHub method)
8. Click **"Create Web Service"**

### Updating the Deployment

When you make code changes, rebuild and push a new image:

```bash
# Rebuild
docker build -t your-dockerhub-username/wyzar-ecommerce:latest \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_aGVscGVkLXNuYXBwZXItMjYuY2xlcmsuYWNjb3VudHMuZGV2JA \
  --build-arg NEXT_PUBLIC_API_URL=https://YOUR-APP-NAME.onrender.com \
  .

# Push
docker push your-dockerhub-username/wyzar-ecommerce:latest
```

Render will automatically redeploy when it detects a new image (if auto-deploy is enabled), or you can trigger a manual redeploy from the dashboard.

---

## 🧪 Local Testing with Docker

```bash
# Start all services (includes PostgreSQL)
docker compose up --build -d

# Check status
docker compose ps

# View logs
docker compose logs -f app

# Access application at http://localhost:8000

# Stop services
docker compose down
```

---

## 🔧 Troubleshooting

| Problem                          | Solution                                                 |
| -------------------------------- | -------------------------------------------------------- |
| **Database connection fails**    | Verify `DATABASE_URL` is correct, check SSL mode         |
| **Frontend 404 errors**          | Check nginx config, verify Next.js build succeeded       |
| **WebSocket not working**        | Verify CORS includes your Render domain                  |
| **Clerk redirect issues**        | Add your domain to Clerk Dashboard → Configure → Domains |
| **File uploads lost on restart** | Migrate to ImageKit for persistent storage               |

---

## 🔐 Production Security Checklist

- [ ] Change all default secrets (JWT_SECRET, ENCRYPTION_KEY)
- [ ] Use strong database password
- [ ] Update CORS origins to only include your domain
- [ ] Configure Clerk for production
- [ ] Set up payment gateway for production mode
- [ ] Update Clerk dashboard with production redirect URLs

---

**Last Updated**: February 2026
