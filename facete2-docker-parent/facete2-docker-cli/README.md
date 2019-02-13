# facete2

 * [facete2](https://github.com/GeoKnow/Facete2)


## Build

    docker build -t facete2 .


## Run

 * run one instance, open http://<docker ip>:8080/facete2 in your browser:


    docker run -d -p 8080:8080 -p 80:80 --name facete2 facete2

 * run many times, open http://<docker ip>:<container port>/facete2 in your browser:


    docker run --rm -P facete2
    docker ps


## Data Sets

 * freebase exzerpt liegt unter: http://cstadler.aksw.org/conti/
 * FP7
    * Sparql IRI: http://fp7-pp.publicdata.eu/sparql
    * Named Graph: http://fp7-pp.publicdata.eu/
 * Freebase Germany
    * Sparql IRI:  http://cstadler.aksw.org/conti/freebase/germany/sparql
    * Named Graph: http://freebase.com/2013-09-22/data/
    * Join Summary Service: http://cstadler.aksw.org/service/join-summary/sparql
    * Join Summary Graph: http://freebase.com/2013-09-22/data/


## ToDos

 * current config is a bad hack, even it works though
 * fix facete2-tomcat7 package as it starts tomcat with error, thus causes regular build to fail
