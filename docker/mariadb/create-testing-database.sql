-- Separate database for the Pest suite so `php artisan test` never touches dev data.
CREATE DATABASE IF NOT EXISTS testing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON testing.* TO 'kulatissa'@'%';
