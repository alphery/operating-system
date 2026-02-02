# 🔴 IMPORTANT: Database Connection Setup

Bro, I need one more thing from you! The secret key you gave me is the **Service Role key**, but Supabase needs the actual **DATABASE PASSWORD** for migrations.

## Get Your Database Password:

1. Go to your Supabase project: https://supabase.com/dashboard/project/anklmzmbfzkvhbpkompb
2. Click **"Project Settings"** (gear icon on left sidebar)
3. Click **"Database"** tab
4. Scroll down to **"Connection string"** section
5. Click **"URI"** tab
6. You'll see something like:
   ```
   postgresql://postgres.anklmzmbfzkvhbpkompb:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
   ```
7. Copy the password part (between `:` and `@`)
8. Paste it here and I'll update the config!

OR if you remember the password you set when creating the project, just tell me that!

---

**Why we need this:**
- The `sb_secret_*` key is for API calls
- The database password is for direct Prisma migrations
- Both are secure, we just need the right one for each purpose
