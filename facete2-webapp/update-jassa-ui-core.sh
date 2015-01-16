path="/home/raven/Projects/Eclipse/jassa-ui-angular-parent/jassa-ui-angular-core"
( cd "$path" && grunt)

cp "$path/dist/jassa-ui-angular-tpls-0.9.0-SNAPSHOT.js" "src/main/webapp/bower_components/jassa-ui-angular/jassa-ui-angular-tpls.js"

cp "$path/css/jassa-ui-angular.css" "src/main/webapp/bower_components/jassa-ui-angular/jassa-ui-angular.css"

