#!/bin/bash
rm -rf src/main/webapp/bower_components
bower cache clean
bower install
grunt bowerInstall
