#!/bin/bash

LIB_DIR="/usr/share/lib/facete2-cli/"
MAIN_CLASS="org.aksw.facete2.cli.main.MainCliFacete2Server"

WAR=$(ls "$LIB_DIR/lib/"*.war)

#java -cp "$LIB_DIR:$LIB_DIR/lib/*" "-Dloader.main=${MAIN_CLASS}" "org.springframework.boot.loader.PropertiesLauncher" "$@"
java -cp "$LIB_DIR:$LIB_DIR/lib/*" $JVM_ARGS "${MAIN_CLASS}" "$WAR" "$@"

