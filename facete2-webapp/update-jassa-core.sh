jassaPath="/home/raven/Projects/Eclipse/jassa-core-parent"
( cd "$jassaPath" && gulp browserify)

cp "$jassaPath/dist/jassa.js" "src/main/webapp/bower_components/jassa"

