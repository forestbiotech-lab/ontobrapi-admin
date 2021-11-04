# Docker-compose 

Rebuild web
``` bash
docker-compose up -d --build
```

# ontoBrAPI
BrAPI endpoint running virtuoso to serve SparQL queries


Default user and password are: **dba** 

From docker image
The dba password can be set at container start up via the DBA_PASSWORD environment variable. If not set, the default dba password will be used.

SPARQL update permission
The SPARQL_UPDATE permission on the SPARQL endpoint can be granted by setting the SPARQL_UPDATE environment variable to true.

.ini configuration
All properties defined in virtuoso.ini can be configured via the environment variables. The environment variable should be prefixed with VIRT_ and have a format like VIRT_$SECTION_$KEY. $SECTION and $KEY are case sensitive. They should be CamelCased as in virtuoso.ini. E.g. property ErrorLogFile in the Database section should be configured as VIRT_Database_ErrorLogFile=error.log.

## NodeJS
Development, run it sper

## Import OWL

Open Interactive SQL (iSQL)

Load OWL file:
```SQL
  SPARQL LOAD <https://raw.githubusercontent.com/MIAPPE/MIAPPE-ontology/master/PPEO.owl>;
```



``` SQL
SPARQL
DEFINE get:soft "replace" 
SELECT DISTINCT * 
FROM <http://purl.org/ppeo/PPEO.owl#> 
WHERE 
  {
    ?s ?p ?o
  }
```

Setting up prefixes

``` SQL
PREFIX miappe: <http://purl.org/ppeo/PPEO.owl#>
```


Add data to graph

```
SPARQL

PREFIX miappe: <http://purl.org/ppeo/PPEO.owl#>

 
INSERT INTO GRAPH miappe: {
   miappe:country <http://www.w3.org/2001/XMLSchema#string> "Portugal"
}
```


Query the data
``` SQL
SPARQL

PREFIX miappe: <http://purl.org/ppeo/PPEO.owl#>

SELECT DISTINCT * 
FROM <http://purl.org/ppeo/PPEO.owl#> 
WHERE 
  {
    miappe:country ?p ?o
  }
```

Adding Ensaios

``` SQL

PREFIX miappe: <http://purl.org/ppeo/PPEO.owl#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
 

INSERT INTO GRAPH miappe: {
   miappe:hasIdentifier xsd:string  "353"

}
```

``` SQL
PREFIX miappe: <http://purl.org/ppeo/PPEO.owl#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX rdf: <http://www.w3.org/2000/01/rdf-schema#> 

INSERT INTO GRAPH miappe:{
   miappe:N353 a miappe:study . 
   miappe:hasIdentifier rdf:subClassOf miappe:N353 .
   miappe:hasIdentifier xsd:string  "353" .
   miappe:obs_unit_1 a miappe:observation_unit .   
   miappe:obs_unit_1 miappe:partOf miappe:N353 .
   miappe:hasIdentifier rdf:subClassOf miappe:obs_unit_1 .
   miappe:hasInternalIdentifier rdf:subClassOf miappe:hasIdentifier .
   miappe:hasInternalIdentifier xsd:string "1" .
}
```

Search in create graph

``` sql

PREFIX miappe: <http://purl.org/ppeo/PPEO.owl#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX rdf: <http://www.w3.org/2000/01/rdf-schema#> 

SELECT ?s ?p ?o ?d from miappe:
WHERE {
   miappe:hasIdentifier ?p ?o .
   miappe:hasInternalIdentifier ?p ?d .
}

```
