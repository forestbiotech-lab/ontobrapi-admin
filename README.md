# What is OntoBrAPI?
OntoBrAPI encompases 3 major modules that provide: 1) Data submission 2) Data Storage/ curation 3) Data Sharing

### 1) Data submission
OntoBrAPI runs on a web server, which provides a Graphical User Interface (GUI) that allows the conversion of the MIAPPE spreadsheet into n-triples format. The GUI allows the user to dynamically map the MIAPPE spreadsheet to the appropriate PPEO ontological properties using a JavaScript Object Notation (JSON). The user can also start from an initial mapping in JSON and adjust any fields deemed necessary. The GUI uses the constraints coded in the ontology to validate the mapping. As an example the data types allowed for each of the data properties is enforced by the GUI, which are inherited from the rules in the ontology; the same goes for the object properties that can link classes and the data properties that can annotate the classes.

### 2) Data Storage 
OntoBrAPI relies on Virtuoso to store triples and builds a management system for data curators to validate datasets and select which datasets are ready for sharing

### 3) Data Sharing
OntoBrAPI provides a BrAPI endpoint which delivers data in the triple store as JSON. This module allows administratores to update the data properties mapped to the respective JSON output in acordance with the BrAPI specification. 



# Docker-compose 

Clone repo and init Submodules, replace repository url based on the access to the project. git@github.com...... or https://github.com.......

*For collaboratores use this*:
``` bash
git clone git@github.com:forestbiotech-lab/ontoBrAPI.git
cd ontoBrapi
cd ontoBrapi-node-docker
git submodule init
git submodule update
git checkout master
``` 
*For other users try this*:
``` bash
git clone http://github.com/forestbiotech-lab/ontoBrAPI.git
cd ontoBrapi
cd ontoBrapi-node-docker
git submodule init
git submodule set-url https://github.com/forestbiotech-lab/ontoBrAPI-node-docker.git
git checkout master
``` 

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
