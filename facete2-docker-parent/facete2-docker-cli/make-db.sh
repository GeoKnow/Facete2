service postgresql start
export PGUSER=postgres
su postgres -c "psql <<- EOSQL
    CREATE DATABASE facete2tomcatcommon;
EOSQL
"
#CREATE USER postgres;
#GRANT ALL PRIVILEGES ON DATABASE facete2tomcatcommon TO facete2tomcatcommon;

service postgresql stop
