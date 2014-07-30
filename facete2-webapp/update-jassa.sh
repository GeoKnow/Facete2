jassaPath="/home/raven/Projects/Eclipse/jassa-parent/jassa-js"
( cd "$jassaPath" && mvn package )

cp "$jassaPath/target/jassa/webapp/resources/js/jassa.js" "src/main/webapp/bower_components/jassa"

