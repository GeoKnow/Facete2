FROM ubuntu:18.04

MAINTAINER Claus Stadler <cstadler@informatik.uni-leipzig.de>

#RUN export DEBIAN_FRONTEND=noninteractive DEBCONF_NONINTERACTIVE_SEEN=true

ENV TERM=xterm\
    TZ=Europe/Berlin\
    DEBIAN_FRONTEND=noninteractive

RUN apt update && \
    apt -y install postgresql supervisor wget openjdk-8-jdk dialog libterm-readline-gnu-perl

ADD target/lib lib
# Add the service itself
#ADD target/${JAR_FILE} ${JAR_FILE}


# Init the database
#RUN service postgresql start
#RUN su postgres -c "createdb facete2tomcatcommon"
#RUN su postgres -c "psql CREATE ROLE postgres WITH PASSWORD 'testtest'"
#RUN su postgres -c "psql -d facete2tomcatcommon -f pgsql"
##  psql -d facete2tomcatcommon -c "CREATE role postgres WITH PASSWORD 'testtest'" && \
#RUN service postgresql stop

Add make-db.sh .
RUN chmod +x make-db.sh
RUN ./make-db.sh


# workaround SHMMAX problem of postgresql in some envs
#RUN sed -ie "s&^shared_buffers =.*&shared_buffers = 16MB&" "/etc/postgresql/9.3/main/postgresql.conf"

# configure supervisord
RUN mkdir -p /etc/supervisor/conf.d
ADD supervisord.conf /etc/supervisor/conf.d/supervisord.conf

RUN mkdir -p /opt/facete2/exports/
RUN chmod 777 /opt/facete2/exports

EXPOSE 8080
EXPOSE 80

CMD ["/usr/bin/supervisord"]

