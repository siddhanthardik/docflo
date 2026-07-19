-- Assign Starter Package to doctors with NULL packageId
UPDATE "doctors"
SET "packageId" = (SELECT id FROM "packages" WHERE name ILIKE '%Starter%' LIMIT 1)
WHERE "packageId" IS NULL AND EXISTS (SELECT 1 FROM "packages" WHERE name ILIKE '%Starter%');
