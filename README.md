# Facete2

The next version of Facete

## Quick Setup

#### The Bleeding Edge Debian Package (Note: Not recommended for production)
For the latest development version (built on every commit) perform the following steps

Create the file

    /etc/apt/sources.list.d/cstadler.aksw.org.list

and add the content

    deb     http://cstadler.aksw.org/repos/apt precise main contrib non-free

Import the public key with

    sudo su
    wget -O - http://cstadler.aksw.org/repos/apt/conf/packages.precise.gpg.key | apt-key add -

Install the application with

    sudo apt-get install facete2-tomcat7

Point your browser to

[http://localhost:8080/facete2](http://localhost:8080/facete2)

This project is built on these of our other projects:

* [JAvaScript Suite for Sparql Access](https://github.com/GeoKnow/Jassa)
* [Jassa User Interface Components](https://github.com/GeoKnow/Jassa-UI-Angular)
* [jena-sparql-api](https://github.com/AKSW/jena-sparql-api)

