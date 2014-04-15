Prefix xsd: <http://www.w3.org/2001/XMLSchema#>
Prefix dc:  <http://purl.org/dc/terms/>
Prefix sb: <http://ns.aksw.org/spring/batch/>

Prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
Prefix ns: <http://example.org/resource/>

Prefix sml: <http://aksw.org/sparqlify/>


Create View batchJobExecution As
  Construct {
    ?s
      a sb:JobExecution ;
      sb:id ?id ; 
      sb:version ?version ;
      sb:createTime ?createTime ;
      sb:startTime ?startTime ;
      sb:endTime ?endTime ;
      sb:status ?status ;
      sb:exitCode ?exitCode ;
      sb:exitMessage ?exitMessage ;
      sb:lastUpdated ?lastUpdated ;
      sb:params ?params
      .
      
    ?jobInstance
      sb:jobExecution ?s .
  }
  With
    ?s           = uri(ns:jobExecution, ?job_execution_id)
    ?params   = uri(ns:jobExecutionParams, ?job_execution_id)
    ?id          = typedLiteral(?job_execution_id, xsd:long)
    ?version     = typedLiteral(?version, xsd:long)
    ?jobInstance = uri(ns:jobInstance, ?job_instance_id)
    ?createTime  = typedLiteral(?create_time, xsd:dateTime)
    ?startTime   = typedLiteral(?start_time, xsd:dateTime)
    ?endTime     = typedLiteral(?end_time, xsd:dateTime)
    ?status      = plainLiteral(?status)
    ?exitCode    = plainLiteral(?exit_code)
    ?exitMessage = plainLiteral(?exit_message)
    ?lastUpdated = typedLiteral(?last_updated, xsd:dateTime)     
  From
     batch_job_execution


Create View batchJobExecutionContext As
  Construct {
      ?jobExecution
        sb:shortContext ?shortContext ;
        sb:serializedContext ?serializedContext .
  }
  With
      ?jobExecution      = uri(ns:jobExecution, ?job_execution_id)
      ?shortContext      = typedLiteral(?short_context, xsd:string)
      ?serializedContext = typedLiteral(?serialized_context, xsd:string)
  From
    batch_job_execution_context 



Create View batchJobExecutionParams As
  Construct {
    ?s
      sb:member ?o .
  }
  With
    ?s = uri(ns:jobExecutionParams, ?job_execution_id)
    ?o = uri(ns:jobExecutionParam, ?job_execution_id, '-', sml:urlEncode(?key_name))
  From
    batch_job_execution_params


Create View batchJobExecutionParam As
  Construct {
    ?s
      a sb:JobExecutionParam ;
      sb:typeCd ?typeCd ;
      sb:keyName ?keyName ;
      sb:stringValue ?stringVal ;
      sb:dateValue ?dateVal ;
      sb:longValue ?longVal ;
      sb:doubleValue ?doubleVal ;
      sb:identifying ?identifying .
  }
  With
    ?s           = uri(ns:jobExecutionParam, ?job_execution_id, '-', sml:urlEncode(?key_name))
    ?typeCd      = plainLiteral(?type_cd)
    ?keyName     = plainLiteral(?key_name)
    ?stringVal   = typedLiteral(?string_val, xsd:string)
    ?dateVal     = typedLiteral(?date_val, xsd:dateTime)
    ?longVal     = typedLiteral(?long_val, xsd:long)
    ?doubleVal   = typedLiteral(?double_val, xsd:double)
    ?identifying = typedLiteral(?identifying, xsd:boolean)
  From
    batch_job_execution_params

Create View batchJobExecutionParamValueString As
  Construct {
    ?s sb:value ?o
  }
  With
    ?s = uri(ns:jobExecutionParam, ?job_execution_id, '-', sml:urlEncode(?key_name))
    ?o = typedLiteral(?string_val, xsd:string)
  From
    [[SELECT job_execution_id, key_name, string_val FROM batch_job_execution_params WHERE type_cd='STRING']]
  
Create View batchJobExecutionParamValueDate As
  Construct {
    ?s sb:value ?o
  }
  With
    ?s = uri(ns:jobExecutionParam, ?job_execution_id, '-', sml:urlEncode(?key_name))
    ?o = typedLiteral(?date_val, xsd:date)
  From
    [[SELECT job_execution_id, key_name, date_val FROM batch_job_execution_params WHERE type_cd='DATE']]

Create View batchJobExecutionParamValueLong As
  Construct {
    ?s sb:value ?o
  }
  With
    ?s = uri(ns:jobExecutionParam, ?job_execution_id, '-', sml:urlEncode(?key_name))
    ?o = typedLiteral(?long_val, xsd:long)
  From
    [[SELECT job_execution_id, key_name, long_val FROM batch_job_execution_params WHERE type_cd='LONG']]

Create View batchJobExecutionParamValueDouble As
  Construct {
    ?s sb:value ?o
  }
  With
    ?s = uri(ns:jobExecutionParam, ?job_execution_id, '-', sml:urlEncode(?key_name))
    ?o = typedLiteral(?double_val, xsd:double)
  From
    [[SELECT job_execution_id, key_name, double_val FROM batch_job_execution_params WHERE type_cd='DOUBLE']]
  

     
Create View batchJobInstance As
  Construct {
    ?s
      a sb:JobInstance ;
      sb:id ?id ;
      rdfs:label ?name ;
      sb:version ?version ;
      sb:key ?key .
  }
  With
    ?s       = uri(ns:jobInstance, ?job_instance_id)
    ?id      = typedLiteral(?job_instance_id, xsd:long)
    ?version = typedLiteral(?version, xsd:long)
    ?name    = plainLiteral(?job_name)
    ?key     = plainLiteral(?job_key)
  From
    batch_job_instance

 
Create View batchStepExecution As
  Construct {
    ?s
      a sb:StepExecution ;
      sb:id ?id ; 
      sb:version ?version ;
      rdfs:label ?stepName ;
      
      sb:startTime ?startTime ;
      sb:endTime ?endTime ;
      sb:status ?status ;
      
      sb:commitCount ?commitCount ;
      sb:readCount ?readCount ;
      sb:filterCount ?filterCount ;
      sb:writeCount ?writeCount ;
      sb:readSkipCount ?readSkipCount ;
      sb:writeSkipCount ?writeSkipCount ;
      sb:processSkipCount ?processSkipCount ;
      sb:rollbackCount ?rollbackCount ;
      
      sb:exitCode ?exitCode ;
      sb:exitMessage ?exitMessage ;
      sb:lastUpdated ?lastUpdated .
     
   ?jobExecution
     sb:stepExecution ?s .
  }
  With
    ?s           = uri(ns:stepExecution, ?step_execution_id)
    ?id          = typedLiteral(?step_execution_id, xsd:long)
    ?version     = typedLiteral(?version, xsd:long)
    ?stepName    = plainLiteral(?step_name)
    //?jobInstance = typedLiteral(?job_instance_id, xsd:long)
    ?startTime   = typedLiteral(?start_time, xsd:dateTime)
    ?endTime     = typedLiteral(?end_time, xsd:dateTime)
    ?status      = plainLiteral(?status)
    ?commitCount = typedLiteral(?commit_count, xsd:long)
    ?readCount   = typedLiteral(?read_count, xsd:long)
    ?filterCount = typedLiteral(?filter_count, xsd:long)
    ?writeCount  = typedLiteral(?write_count, xsd:long)
    ?readSkipCount  = typedLiteral(?read_skip_count, xsd:long)
    ?writeSkipCount  = typedLiteral(?write_skip_count, xsd:long)
    ?processSkipCount  = typedLiteral(?process_skip_count, xsd:long)
    ?rollbackCount  = typedLiteral(?rollback_count, xsd:long)
    ?exitCode    = plainLiteral(?exit_code)
    ?exitMessage = plainLiteral(?exit_message)
    ?lastUpdated = typedLiteral(?last_updated, xsd:dateTime)     
    
    ?jobExecution = uri(ns:jobExecution, ?job_execution_id)
  From
     batch_step_execution


Create View batchStepExecutionContext As
  Construct {
      ?stepExecution
        sb:shortContext ?shortContext ;
        sb:serializedContext ?serializedContext .
  }
  With
      ?stepExecution     = uri(ns:stepExecution, ?step_execution_id)
      ?shortContext      = typedLiteral(?short_context, xsd:string)
      ?serializedContext = typedLiteral(?serialized_context, xsd:string)
  From
    batch_step_execution_context 


 