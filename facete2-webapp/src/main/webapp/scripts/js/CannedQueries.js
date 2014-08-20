var CannedQueries = {

jobExecutionStatus:
'Select ?je ?jeec ?jes ?jec ?se ?sel ?sec {\
    ?je\
    a batch:JobExecution ;\
    batch:exitCode ?jeec ;\
    batch:status ?jes ;\
    batch:shortContext ?jec ;\
    batch:stepExecution ?se .\
\
  ?se\
    rdfs:label ?sel ;\
    batch:shortContext ?sec .\
}',

essentialDataElementStr:
'\
  Optional {\
    ?instanceUri a ?typeUri .\
    Optional {\
      ?typeUri2 <http://www.w3.org/2000/01/rdf-schema#subClassOf> ?typeUri\
    }\
    Filter(!Bound(?typeUri2))\
  }\
  Optional { ?instanceUri <http://www.w3.org/2000/01/rdf-schema#label> ?instanceLabel . Filter(langMatches(lang(?instanceLabel), "de"))}\
  Optional { ?instanceUri <http://www.w3.org/2003/01/geo/wgs84_pos#long> ?lon }\
  Optional { ?instanceUri <http://www.w3.org/2003/01/geo/wgs84_pos#lat> ?lat }\
  Optional { ?instanceUri <http://www.w3.org/2000/01/rdf-schema#seeAlso> ?instancePage }\
  Optional { ?typeUri <http://www.w3.org/2000/01/rdf-schema#label> ?typeLabel .Filter(langMatches(lang(?typeLabel), "en")) }\
  Optional { ?typeUri <http://www.w3.org/2000/01/rdf-schema#seeAlso> ?typePage }\
',

};
