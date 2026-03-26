-- Fix reports table: reporter_id should be TEXT to match users.id type
ALTER TABLE reports ALTER COLUMN reporter_id TYPE TEXT;
