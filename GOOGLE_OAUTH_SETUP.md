# Google OAuth Setup Guide

## 🚨 Google Sign-In Not Working?

If you're seeing a "400 Bad Request" error when clicking "Continue with Google", follow this troubleshooting guide.

## 📋 Step-by-Step Setup Instructions

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API

### 2. Create OAuth 2.0 Credentials

1. In the Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen if prompted
4. Choose "Web application" as the application type
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)

### 3. Get Your Credentials

After creating the OAuth client, you'll get:
- **Client ID**: A long string ending in `.googleusercontent.com`
- **Client Secret**: A shorter secret string

### 4. Configure Environment Variables

Create a `.env.local` file in your project root (or add to existing `.env` file):

```env
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-actual-google-client-id-here"
GOOGLE_CLIENT_SECRET="your-actual-google-client-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

**Example:**
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID="123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abcdefghijklmnopqrstuvwxyz123456"
NEXTAUTH_URL="http://localhost:3000"
```

### 5. Restart Your Application

```bash
npm run dev
```

### 6. Test Google Sign-In

1. Visit `http://localhost:3000/auth/signin`
2. Click "Continue with Google"
3. You should now be able to sign in successfully

## 🔧 Alternative: Use Traditional Login

If you don't want to set up Google OAuth, you can use the traditional email/password login:

1. Go to the sign-in page
2. Use the "Or continue with email" form
3. Sign up first at `/auth/signup` if you haven't already

## ❓ Troubleshooting

### 🔧 400 Error Solutions:

1. **Check Redirect URIs in Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - APIs & Services → Credentials
   - Edit your OAuth 2.0 Client ID
   - Under "Authorized redirect URIs", make sure you have:
     - `http://localhost:3000/api/auth/callback/google`
   - **Important:** The URI must match EXACTLY (no trailing slashes, correct protocol)

2. **Check Authorized JavaScript Origins:**
   - In the same OAuth client settings
   - Under "Authorized JavaScript origins", add:
     - `http://localhost:3000`
   - **Note:** This is just the domain, no path

3. **Verify Environment Variables:**
   - Make sure your `.env.local` has:
     ```
     NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-client-id"
     GOOGLE_CLIENT_SECRET="your-client-secret"
     NEXTAUTH_URL="http://localhost:3000"
     ```

4. **Clear Browser Cache:**
   - Sometimes old cached redirects cause issues
   - Try in an incognito/private window

5. **Restart Your Server:**
   - Stop the dev server (Ctrl+C)
   - Run `npm run dev` again

### Common Issues:
- **Still getting 400 errors?** Double-check your Client ID and Secret are correct
- **Redirect URI mismatch?** Make sure the authorized redirect URIs match exactly
- **Development vs Production?** Use different credentials for dev/prod environments

## 📞 Need Help?

If you're still having issues, check:
1. Google Cloud Console OAuth consent screen is properly configured
2. Your domain is authorized in the OAuth client settings
3. Environment variables are loaded correctly (restart the server after changes)

---

**Note:** Google OAuth setup can be complex. If you prefer, you can disable Google sign-in entirely and just use the traditional email/password authentication.