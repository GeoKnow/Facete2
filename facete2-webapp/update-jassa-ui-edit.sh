path="/home/raven/Projects/Eclipse/jassa-ui-angular-parent/jassa-ui-angular-edit"
( cd "$path" && grunt)

mkdir -p "src/main/webapp/bower_components/jassa-ui-angular-edit"
cp "$path/dist/jassa-ui-angular-edit-tpls-0.9.0-SNAPSHOT.js" "src/main/webapp/bower_components/jassa-ui-angular/jassa-ui-angular-edit-tpls.js"

cp "$path/css/jassa-ui-angular-edit.css" "src/main/webapp/bower_components/jassa-ui-angular/jassa-ui-angular-edit.css"

