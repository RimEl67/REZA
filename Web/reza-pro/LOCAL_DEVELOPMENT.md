# Local Development Setup

## ✅ Configuration Complete

Your local development environment is now configured to use the **hosted API** at `https://api.reza.ma`.

## 🚀 Running the Development Server

1. **Start the development server:**
   ```bash
   cd /root/reza/saas
   npm run dev
   ```

2. **Access your local UI:**
   - Open: http://localhost:3000
   - Your UI will connect to: https://api.reza.ma/api

## 📋 Environment Configuration

The `.env.local` file is configured with:
```env
NEXT_PUBLIC_API_URL=https://api.reza.ma/api
REACT_APP_API_URL=https://api.reza.ma
REACT_APP_ENV=development
```

## 🔧 How It Works

- **Local UI**: Runs on `http://localhost:3000`
- **API Calls**: Go directly to `https://api.reza.ma/api`
- **Next.js Rewrites**: Proxy `/api/*` and `/uploads/*` to the hosted API

## ⚠️ Important Notes

1. **CORS**: Make sure the hosted API has CORS configured to allow requests from `http://localhost:3000`

2. **Authentication**: You'll be using the production API, so:
   - Use production credentials for testing
   - Be careful with test data

3. **Hot Reload**: Changes to your UI code will automatically reload in the browser

## 🛠️ Troubleshooting

### If API calls fail:
- Check browser console for CORS errors
- Verify the API is accessible: `curl https://api.reza.ma/api/health`
- Check `.env.local` file exists and has correct values

### To use local API instead:
- Change `NEXT_PUBLIC_API_URL` in `.env.local` to `http://localhost:5000/api`
- Or remove `.env.local` to use defaults

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linter
