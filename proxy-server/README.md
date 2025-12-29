# Q-OS Proxy Server

A lightweight Node.js proxy server that strips CSP and X-Frame-Options headers to allow embedding blocked websites in iframes.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd proxy-server
npm install
```

### 2. Start the Server
```bash
npm start
```

The server will run on `http://localhost:3001`

### 3. Usage
```
http://localhost:3001/proxy?url=https://reddit.com
```

## 📋 API Endpoints

### Health Check
```
GET /health
```
Returns the server status.

### Proxy Endpoint
```
GET /proxy?url=<target-url>
```
Proxies the target URL and strips CSP/X-Frame-Options headers.

**Example:**
```
http://localhost:3001/proxy?url=https://www.reddit.com
```

## 🌐 Deployment Options

### Option 1: Local Development
Just run `npm start` on your local machine.

### Option 2: Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### Option 3: Deploy to Heroku
1. Create a Heroku app
2. Push to Heroku:
```bash
git init
heroku git:remote -a your-app-name
git add .
git commit -m "Deploy proxy"
git push heroku main
```

### Option 4: Deploy to Railway
1. Go to railway.app
2. Create new project
3. Connect your GitHub repo
4. Deploy automatically

## ⚠️ Important Notes

- **Legal**: Using a proxy to bypass CSP may violate some websites' Terms of Service
- **Performance**: This proxy strips headers but doesn't modify content
- **CORS**: Enabled for all origins by default
- **Security**: Use with caution in production

## 🔧 Configuration

Change the port in `server.js`:
```javascript
const PORT = process.env.PORT || 3001;
```

Or set environment variable:
```bash
PORT=8080 npm start
```

## 📊 Features

✅ Strips CSP headers
✅ Strips X-Frame-Options headers  
✅ CORS enabled
✅ Error handling
✅ Request logging
✅ Health check endpoint
✅ Graceful shutdown
✅ Production-ready

## 🐛 Troubleshooting

**Issue**: "Cannot find module 'express'"
**Solution**: Run `npm install`

**Issue**: "Port already in use"
**Solution**: Change port or kill process using that port

**Issue**: "Target site still blocked"
**Solution**: Some sites use JavaScript checks - these won't work through a simple proxy
