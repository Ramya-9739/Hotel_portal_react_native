#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DO
    \$\$
    BEGIN
       IF NOT EXISTS (
          SELECT FROM pg_catalog.pg_roles
          WHERE  rolname = 'api_user') THEN
          CREATE ROLE api_user LOGIN PASSWORD '${API_DB_PASSWORD}';
       END IF;
    END
    \$\$;
EOSQL
