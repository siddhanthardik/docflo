# Gyrex Server Deployment & Zero-Downtime Guide

This guide details how to perform server deployments and configure Nginx / PM2 so doctors never see generic browser errors (`This page couldn't load`) during system updates.

---

## 1. Zero-Downtime Deployment Command (Recommended)

When pulling updates on your server, use `pm2 reload` instead of `pm2 restart`. `pm2 reload` performs a zero-downtime rolling restart of your Node process.

```bash
# 1. Fetch latest changes
git pull

# 2. Build production bundle
npm run build

# 3. Perform Zero-Downtime Reload
pm2 reload docflo
```

---

## 2. Nginx Configuration for Maintenance Page (Optional Best Practice)

To ensure that if the Node server is temporarily down during a build or restart (returning `502 Bad Gateway` or `503 Service Unavailable`), Nginx automatically serves the branded **Gyrex System Upgrade** page (`/maintenance.html`):

### Add to Nginx `/etc/nginx/sites-available/gyrex.in`:

```nginx
server {
    server_name gyrex.in www.gyrex.in;

    # Define custom error page for 502 (Bad Gateway) and 503 (Service Unavailable)
    error_page 502 503 /maintenance.html;

    location = /maintenance.html {
        root /var/www/gyrex/public;
        internal;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
      
        # Fallback to maintenance page if Node is unreachable
        proxy_intercept_errors on;
    }
}
```

### Test & Reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 3. Custom Error Boundaries in Next.js

The following files automatically handle application-level error boundaries during feature updates:
- **`src/app/error.tsx`**: Route-level error boundary with 25-second auto-reconnect timer.
- **`src/app/global-error.tsx`**: Root-level error boundary for app layout errors.
- **`public/maintenance.html`**: Standalone HTML page with zero external dependencies for Nginx/PM2 502/503 fallback.
