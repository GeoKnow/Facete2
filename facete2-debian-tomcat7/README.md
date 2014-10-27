# Facete2 Deployment Guide for Tomcat 7 on Ubuntu

## Prerequisites

Although Facete2 comes packaged as a Debian package, you need to adjust a few system settings before it will work.

Important: Before installing the Facete2 Debian package, please make sure you have a Java JDK installed and that your Tomcat configuration is adjusted according to the following instructions.
Otherwise, you may be left with a non-functional deployed war file.

* If you have not done already, install a JDK using one of the commands below. Be aware that if you have `openjdk-6-jre` (just the runtime!) installed and you additionally install `openjdk-7-jdk`, you have 2 versions of Java on your system. If `openjdk-6-jre` is then still set as the default Java, upon launching the Facete2 in your browser you will see an exception that a JDK is required to run this web application.

        # Pick a jdk if you need one.
        # sudo apt-get install openjdk-6-jdk
        # sudo apt-get install openjdk-7-jdk

        # Fixing your Java configuration is out of scope for this guide,
        # but this command lists the installed Java versions and may help you
        # on your decision on which jdk to install:
        
        dpkg --get-selections | grep openjdk-

* On Ubuntu, the following jar - if it exists - may be corrupted. In this case, overwrite it with a fresh version using the command:

        sudo wget -O /usr/share/java/tomcat-dbcp-7.0.30.jar http://search.maven.org/remotecontent?filepath=org/apache/tomcat/tomcat-dbcp/7.0.30/tomcat-dbcp-7.0.30.jar

* Make sure that there is an approriate JDBC driver in tomcat's lib folder. If not, you can install one using the command below. Note that we sucessfully tested version 8.4-701 against Postgresql 9.* databases, however we had issues related to incompatible datatype mappings with the 9.* JDBC drivers.

        sudo wget -P /usr/share/tomcat7/lib/ http://repo1.maven.org/maven2/postgresql/postgresql/8.4-701.jdbc4/postgresql-8.4-701.jdbc4.jar

* For running the Facete2, Tomcat needs to be configured to at least 512MB or RAM.
A common recommendation to achieve this is to set `JAVA_HOME` or `CATALINA_HOME`, however this may have no effect - at least on some Ubuntu distributions, such as 12.04 - as their values may be overwriten, such as seen in the snippet below.
Edit the file `/etc/default/tomcat7` and perform the following change. 

        # The original options look something like this:
        # JAVA_OPTS="-Djava.awt.headless=true -Xmx128m -XX:+UseConcMarkSweepGC"
        
        JAVA_OPTS="-Djava.awt.headless=true -Xmx512m -XX:+UseConcMarkSweepGC"

If you followed about recommendations, your chances of getting a working deployment have increased drastically.


* If you install the Facete2 from file - rather than a repository - you first need to install the following dependencies manually:

        sudo apt-get install tomcat7 dbconfig-common xsltproc postgresql

* The Facete2 debian package is available at:

[http://cstadler.aksw.org/repos/apt/pool/main/f/facete2-tomcat7/](http://cstadler.aksw.org/repos/apt/pool/main/f/facete2-tomcat7/)

* Download the facete2-tomcat7 package and install it with (fill out `${version}` appropriately):

        sudo dpkg -i facete2-tomcat7_${version}.deb

* When prompted for the database password, enter one. Important note: Currently there is a character escaping issue - do not use characters that have special meaning in XML in the password, otherwise you need to manually fix the file `/etc/tomcat7/Catalina/localhost/facete2.xml`.

* Visiting the following URL with your browser should show the Facete2 application

[http://localhost:8080/facete2](http://localhost:8080/facete2)

* If this is the case: Congratulations! Otherwise, check out the trouble shooting guide.


## Trouble Shooting
* In the browser I see an exception that I need a full JDK installed.
 * Check the prerequisites about the notes about the JDK.
* In the browser I see a blank page.
 * Check `/var/log/tomcat7/catalina.out` for exceptions.
* In `catalina.out`, I see an exception mentioning `Heap space`
 * Probably Tomcat does not have enough memory. Check the prerequisites section.
* In `catalina.out`, I see `java.lang.NoSuchMethodError: org.postgresql.core.BaseConnection.getLargeObjectAPI()Lorg/postgresql/largeobject/LargeObjectManager;`
 * Place the PostgreSQL JDBC driver into `/usr/share/tomcat7/lib`. Check the prerequisites section.
* On Ubuntu, the Tomcat log shows: `java.lang.ClassNotFoundException: org.apache.tomcat.dbcp.dbcp.BasicDataSourceFactory`
 * You may be suffering from a corrupted jar file [see here](http://stackoverflow.com/questions/14712308/ubuntu-tomcat7-java-lang-classnotfoundexception-org-apache-tomcat-dbcp-dbcp-bas)
 * Fix: `sudo wget -O /usr/share/java/tomcat-dbcp-7.0.30.jar http://search.maven.org/remotecontent?filepath=org/apache/tomcat/tomcat-dbcp/7.0.30/tomcat-dbcp-7.0.30.jar`
 * `sudo service tomcat7 restart`
