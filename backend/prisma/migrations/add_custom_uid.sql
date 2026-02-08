-- Add customUid column with temporary default
ALTER TABLE "platform_users" ADD COLUMN "custom_uid" TEXT;

-- Generate custom UIDs for existing users
DO $$
DECLARE
    user_record RECORD;
    new_uid TEXT;
    counter INT := 1;
BEGIN
    FOR user_record IN SELECT id FROM "platform_users" ORDER BY created_at
    LOOP
        new_uid := 'AU' || LPAD(counter::TEXT, 6, '0');
        UPDATE "platform_users" SET "custom_uid" = new_uid WHERE id = user_record.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Now make it NOT NULL and UNIQUE
ALTER TABLE "platform_users" ALTER COLUMN "custom_uid" SET NOT NULL;
CREATE UNIQUE INDEX "platform_users_custom_uid_key" ON "platform_users"("custom_uid");

-- Add mobile_number column (nullable)
ALTER TABLE "platform_users" ADD COLUMN "mobile_number" TEXT;

-- Create index on custom_uid
CREATE INDEX "platform_users_custom_uid_idx" ON "platform_users"("custom_uid");
