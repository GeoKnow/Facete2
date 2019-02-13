ARG LIB_DIR=/usr/share/lib/facete2-cli/
#ARG JAR_FILE=facete2-cli.jar
#ARG MAIN_CLASS=org.aksw.facete2.cli.main.MainCliFacete2Server
ARG ARTIFACT_ID=facete2-cli

FROM ubuntu:18.04

MAINTAINER Claus Stadler <cstadler@informatik.uni-leipzig.de>

ARG JAR_FILE
ARG MAIN_CLASS
ARG ARTIFACT_ID
#ARG MAIN_IMAGE

#RUN export DEBIAN_FRONTEND=noninteractive DEBCONF_NONINTERACTIVE_SEEN=true

ENV TERM=xterm\
    TZ=Europe/Berlin\
    DEBIAN_FRONTEND=noninteractive

RUN apt update && \
    apt -y install postgresql supervisor wget openjdk-8-jdk dialog libterm-readline-gnu-perl

#WORKDIR /usr/share/${ARTIFACT_ID}/
#
#WORKDIR $LIB_DIR
WORKDIR /usr/share/lib/facete2-cli/

# Add Maven dependencies (not shaded into the artifact; Docker-cached)
ADD target/lib lib
# Add the service itself
#ADD target/${JAR_FILE} ${JAR_FILE}
COPY target/*.jar .

ADD pgsql /tmp/
ADD make-db.sh .
RUN chmod +x make-db.sh
RUN ./make-db.sh


ADD usr.bin.facete2 /usr/bin/facete2
RUN chmod +x /usr/bin/facete2


ADD usr.bin.facete2-wrapper /usr/bin/facete2-wrapper
RUN chmod +x /usr/bin/facete2-wrapper


# workaround SHMMAX problem of postgresql in some envs
#RUN sed -ie "s&^shared_buffers =.*&shared_buffers = 16MB&" "/etc/postgresql/9.3/main/postgresql.conf"

# configure supervisord
RUN mkdir -p /etc/supervisor/conf.d
ADD supervisord.conf /etc/supervisor/conf.d/supervisord.conf

RUN mkdir -p /opt/facete2/exports/
RUN chmod 777 /opt/facete2/exports


EXPOSE 7532
EXPOSE 7532

CMD ["/usr/bin/supervisord"]

