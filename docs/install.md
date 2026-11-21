# DecorBiz Installation & Deployment Guide

## 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Firebase Project**: Created on Firebase Console (Spark or Blaze plan) with:
  - Email/Password Authentication enabled
  - Cloud Firestore enabled
- **ImageKit Account**: Free plan with Media Library endpoint and keys
- **Hosting**: Vercel or any static host with Node.js serverless function support

## 2. Setup Steps
1. Clone the repository and configure environment variables:
   ```bash
   cp .env.example .env
   ```
2. Fill `.env` with your Firebase project keys and ImageKit credentials.
3. Validate environment configuration:
   ```bash
   npm run check-env
   ```
4. Run project setup and seed initial catalogue lines:
   ```bash
   npm run setup
   ```
5. Deploy Firestore Security Rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
6. Start local development server:
   ```bash
   npm run dev
   ```

## 3. URLs
- Public Storefront / Business Card: `http://localhost:3000/`
- Staff ERP Login: `http://localhost:3000/erp/login` (noindex)
- Customer Login: `http://localhost:3000/account/login`
