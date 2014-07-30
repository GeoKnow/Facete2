path="/home/raven/Projects/Eclipse/jassa-ui-angular-parent/jassa-ui-angular-openlayers"
( cd "$path" && ./build.sh)

cp "$path/target/release/repo/jassa-ui-angular-openlayers-tpls.js" "src/main/webapp/bower_components/jassa-ui-angular-openlayers"

