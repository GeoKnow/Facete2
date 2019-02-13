service postgresql start
export PGUSER=postgres
su postgres -c "psql <<- EOSQL
    ALTER ROLE postgres WITH PASSWORD 'postgres';
    CREATE DATABASE facete2tomcatcommon;
EOSQL
"
#CREATE USER postgres;
#GRANT ALL PRIVILEGES ON DATABASE facete2tomcatcommon TO facete2tomcatcommon;

su postgres -c "psql -d facete2tomcatcommon -f /tmp/pgsql"

service postgresql stop
