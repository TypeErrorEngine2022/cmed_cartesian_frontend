# Runtime Environment Configuration for CMED Cartesian Frontend

This document explains how environment variables are handled in the CMED Cartesian frontend application, especially when deploying to Vercel.

## How Environment Variables Work

The application uses environment variables for configuration such as API URLs and user nicknames. However, since Vite processes environment variables at **build time** (not runtime), we've implemented a special solution to allow for runtime configuration when deployed on Vercel.

### Local Development

In local development, the application uses:
- Variables from `.env` files (e.g., `.env`, `.env.development`)
- These can be accessed in code using `import.meta.env.VARIABLE_NAME`

### Production Build on Vercel

When deployed to Vercel:
1. The build process generates a `config.js` file containing runtime variables
2. These variables are read from Vercel environment variables during build
3. The `config.js` is included in the HTML as a script
4. The application checks `window.RUNTIME_CONFIG` first, then falls back to `import.meta.env`

## Setting Environment Variables on Vercel

For proper configuration:

1. Set your environment variables in the Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add variables like `VITE_API_URL` and `VITE_NICKNAME`
   
2. Ensure these have the appropriate values for your environment:
   - `VITE_API_URL`: The URL of your backend API (e.g., `https://your-backend-vercel-url.vercel.app`)
   - `VITE_NICKNAME`: The default admin nickname

3. Redeploy your application to apply the new environment variables

## How It Works

1. During the build process, `npm run build` runs:
   - The Vite build
   - The `generate-runtime-config.js` script

2. The script reads environment variables and generates `config.js` with:
   ```js
   window.RUNTIME_CONFIG = {
     apiUrl: "https://your-backend-url",
     nickname: "Admin"
   };
   ```

3. The application code checks `window.RUNTIME_CONFIG` first before using `import.meta.env`:
   ```typescript
   const API_URL = window.RUNTIME_CONFIG?.apiUrl || import.meta.env.VITE_API_URL || "http://localhost:3001";
   ```

This approach allows for runtime environment configuration while keeping sensitive information out of your GitHub repository.
