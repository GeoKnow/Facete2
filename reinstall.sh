echo "Installing dependent packages"
sudo apt-get install dbconfig-common xsltproc postgresql

echo "Stopping tomcat"
sudo service tomcat7 stop

echo "Purging debs"
sudo apt-get purge facete2-tomcat-common facete2-tomcat7

echo "Removing old deb packages"
find -name '*.deb' | xargs rm

echo "Running mvn install"
(cd facete2-debian-tomcat-common && mvn install)
(cd facete2-debian-tomcat7 && mvn install)

echo "Installing debs"
sudo dpkg -i `find facete2-debian-tomcat-common/target -name *.deb`
sudo dpkg -i `find facete2-debian-tomcat7/target -name *.deb`

