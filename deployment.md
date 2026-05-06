# Deployment Guide: navigationtrading.com Migration

## Overview
Move the custom-coded site from `webclass.navigationtrading.com` (Vercel subdomain) to `navigationtrading.com` (main domain), while keeping WordPress handling the `/blog` path.

**Current state:**
- `webclass.navigationtrading.com` → Vercel (custom coded)
- `navigationtrading.com` → WordPress (being replaced)
- Code: GitHub → Vercel
- DNS: Cloudflare

**Final state:**
- `navigationtrading.com` → Vercel (custom coded) + `/blog` proxy to WordPress
- `navigationtrading.com/blog` → WordPress (via Cloudflare Worker)
- Code: GitHub → Vercel (same CI/CD pipeline)
- DNS: Cloudflare

---

## Step 1: Add Root Domain to Vercel

**In Vercel dashboard:**
1. Go to your project (currently deployed as `webclass.navigationtrading.com`)
2. Settings → Domains
3. Click "Add Domain"
4. Enter: `navigationtrading.com`
5. Vercel will show you the nameservers/CNAME to add to Cloudflare

---

## Step 2: Update Cloudflare DNS

**In Cloudflare dashboard:**
1. Go to DNS Records
2. Find the record pointing to WordPress (currently the root domain `@` or `navigationtrading.com`)
3. Change it to point to Vercel:
   - **Type:** CNAME (or A record, depending on Vercel's instruction)
   - **Name:** @ (root domain)
   - **Target:** Vercel's endpoint (e.g., `cname.vercel-dns.com` or your project's assigned domain)
4. Save

**Verify:** After 5-10 minutes, `navigationtrading.com` should load your custom site.

---

## Step 3: Create Cloudflare Worker for `/blog` Proxy

**In Cloudflare dashboard:**
1. Go to Workers & Pages → Create application → Create Worker
2. Name it: `blog-proxy` (or similar)
3. Paste this code:

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // If request is to /blog, proxy to WordPress
    if (url.pathname.startsWith('/blog')) {
      const wpHost = 'YOUR-WORDPRESS-URL'; // e.g., wp.navigationtrading.com or your host IP
      const wpUrl = new URL(url.pathname + url.search, wpHost);
      
      // Forward all headers (important for cookies, auth, etc.)
      const headers = new Headers(request.headers);
      headers.set('Host', new URL(wpHost).hostname);
      
      return fetch(wpUrl.toString(), {
        method: request.method,
        headers: headers,
        body: request.method !== 'GET' ? request.body : undefined
      });
    }
    
    // Everything else: fetch from Vercel (main domain)
    return fetch(request);
  }
};
```

4. Click "Deploy"

---

## Step 4: Add Worker Route in Cloudflare

**In Cloudflare dashboard:**
1. Go to Workers & Pages → blog-proxy (your worker)
2. Settings → Triggers → Routes
3. Click "Add route"
4. Enter: `navigationtrading.com/blog*`
5. Select the worker: `blog-proxy`
6. Save

---

## Step 5: Configure WordPress Base URL

**In WordPress admin (your WordPress installation):**
1. Settings → General
2. **WordPress Address (URL):** `https://navigationtrading.com/blog`
3. **Site Address (URL):** `https://navigationtrading.com/blog`
4. Save Changes

This tells WordPress that it's running at `/blog`, so all internal links work correctly.

---

## Step 6: Verify Everything Works

**Test these URLs:**

| URL | Should load |
|---|---|
| `navigationtrading.com` | Custom site (Vercel) |
| `navigationtrading.com/blog` | WordPress blog homepage |
| `navigationtrading.com/blog/post-title` | WordPress blog post |
| `webclass.navigationtrading.com` | Still works (Vercel subdomain) |

---

## Important Notes

- **WordPress hosting:** After switchover, WordPress doesn't need to be at `navigationtrading.com` anymore. It can live at:
  - A temporary URL like `wp.navigationtrading.com`
  - Your host's direct IP or control panel URL
  - Just needs to be accessible from Cloudflare Worker
  
- **SSL/HTTPS:** Cloudflare should auto-provision SSL for the main domain. Verify in SSL/TLS settings.

- **WordPress plugins:** Some WordPress plugins that generate sitemaps or canonical URLs may need adjustment. Test thoroughly.

- **Cache:** Cloudflare caching might cache blog pages. Test with `?nocache=1` if needed, or adjust cache rules for `/blog`.

- **Rollback:** Before doing this, save the current DNS records so you can quickly revert if something breaks.

---

## Timeline

- **Step 1:** 5 minutes (Vercel)
- **Step 2:** 5 minutes (Cloudflare DNS)
- **Propagation:** 5-10 minutes (DNS TTL)
- **Step 3-4:** 5 minutes (Cloudflare Worker)
- **Step 5:** 2 minutes (WordPress)
- **Testing:** 10-15 minutes

**Total:** ~30-45 minutes + DNS propagation

---

## Support

If anything breaks:
1. Check Cloudflare Worker logs (Workers dashboard → Logs)
2. Check WordPress error logs (if accessible)
3. Verify the WordPress URL in Step 5 is correct
4. Test the Worker proxy independently with `curl` or browser console
