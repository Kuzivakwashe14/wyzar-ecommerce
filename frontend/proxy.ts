import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define routes that require authentication
// Note: Next.js route groups like (dashboard) don't appear in URLs
const isProtectedRoute = createRouteMatcher([
  "/messages(.*)",
  "/dashboard(.*)",
  "/become-a-seller(.*)",
  "/checkout(.*)",
  "/my-orders(.*)",
  "/order(.*)",
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
