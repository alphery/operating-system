# ⚡ Flash Browser - Ultimate V2

**A smart, hybrid browser for your OS that combines the best of embedded browsing and native popups.**

## 🚀 What's New in V2?

1.  **🏠 Native Start Page**
    - Instant load time (no network needed)
    - Beautiful "Flash" branding
    - Quick links to popular sites
    - Direct Google Search bar

2.  **🧠 Smart Mode Detection**
    - Automatically detects "un-embeddable" sites (Google, YouTube, etc.)
    - **Auto-switches** to Popup Mode for these sites
    - Keeps usage seamless!

3.  **🎨 Improved UI**
    - Clear "Popup Mode" screen when a site is opened externally
    - "Re-open Window" button if you closed the popup
    - Option to "Force Embedded" (for power users)

4.  **🕵️‍♂️ Privacy Focused**
    - Uses **DuckDuckGo** for embedded searches (better privacy + works in iframes)
    - Proxied requests for embedded sites

---

## 🛠️ How it Works

### 1. The Proxy (`/api/proxy`)
- Fetches simple websites server-side
- Rewrites URLs to stay inside the OS
- Bypasses CORS for basic static sites

### 2. The Smart Logic (`flash.js`)
- **If you type** `google.com` -> 🧠 Detects complex site -> Opens Popup 🔗
- **If you type** `example.com` -> 🌐 Safe site -> Opens Embedded iframe
- **If you search** "hello" -> 🦆 Uses DuckDuckGo Embedded

---

## 🧪 Try It Out!

1.  Open **Flash Browser**
2.  See the new **Start Page** ⚡
3.  Click **"YouTube"** tile -> Opens in Popup (Success!)
4.  Type `wikipedia.org` -> Opens in Embedded (Success!)
5.  Type `hello world` -> Searches DuckDuckGo Embedded (Success!)

---

## 📝 Why "Popup Mode"?

Big sites like Google, YouTube, and Facebook have strict **Security Headers** (`X-Frame-Options`, `CSP`) that block iframes.
Even with a proxy, these sites break because they load dynamic resources (JS, Images) that check for iframes.

*Flash Browser is smart enough to know this and handles it for you!* 😎
