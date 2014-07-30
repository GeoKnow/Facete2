path="/home/raven/Projects/Eclipse/jassa-ui-angular-parent/jassa-ui-angular-core"
( cd "$path" && ./build.sh)

cp "$path/target/release/repo/jassa-ui-angular-tpls.js" "src/main/webapp/bower_components/jassa-ui-angular"

