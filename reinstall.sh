sudo service tomcat7 stop
sudo apt-get purge facete2-tomcat-common facete2-tomcat7

mvn clean install
sudo dpkg -i `find facete2-debian-tomcat-common/target -name *.deb`
sudo dpkg -i `find facete2-debian-tomcat7/target -name *.deb`

