-- Separate database for the Pest suite so `php artisan test` never touches dev data.
SELECT 'CREATE DATABASE testing'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'testing')\gexec
