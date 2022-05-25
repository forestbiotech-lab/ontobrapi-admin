
-----------------|
List Observations|
-----------------|


SPARQL
PREFIX ppeo: <http://purl.org/ppeo/PPEO.owl#>
SELECT DISTINCT ?s 
FROM <https://bit.ly/3yJFXvw>
WHERE 
  {
    ?s ?p ppeo:observation

  }




http://brapi.biodata.pt/raiz/obs_000001
http://brapi.biodata.pt/raiz/obs_000002
http://brapi.biodata.pt/raiz/obs_000003


SPARQL
PREFIX ppeo: <http://purl.org/ppeo/PPEO.owl#>
SELECT DISTINCT ?s 
FROM <https://bit.ly/3yJFXvw>
WHERE 
  {
    <http://brapi.biodata.pt/raiz/obs_000004> ?p ?o . 
    ?s ?p ppeo:observation_level .
  }



SPARQL
PREFIX ppeo: <http://purl.org/ppeo/PPEO.owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>


SELECT DISTINCT ?obs_unit
FROM <https://bit.ly/3yJFXvw>
WHERE
  {
    <http://brapi.biodata.pt/raiz/obs_000122> rdf:type  ppeo:observation .
    <http://brapi.biodata.pt/raiz/obs_000122> ppeo:hasObservedSubject ?obs_unit .
  }


Values of each attributes should be inferred or explicitly declared?
``` json
data:[
  { 
    "_anchor":{"s":"?","p":"?","o":"observation"},
    "germplasmDbId":{"_attributes":{"valueType":"string","o":"germplasmDbId"}},
    "observationUnit":{"_attributes":{"valueType":"string","o":"observation_unit"}}, //one for each position and for each study

    
  }
]

```

mismatch between names....

SPARQL
PREFIX ppeo: <http://purl.org/ppeo/PPEO.owl#>
SELECT DISTINCT ?s 
FROM <https://bit.ly/3yJFXvw>
WHERE 
  {
    <http://brapi.biodata.pt/raiz/obs_000004> ?p ppeo:observation . 
    ?s ?p ppeo:observation_unit .
  }

 http://brapi.biodata.pt/raiz/position_10_n356
 http://brapi.biodata.pt/raiz/position_117_n356
 http://brapi.biodata.pt/raiz/position_1_n353
 http://brapi.biodata.pt/raiz/position_1_n369
 http://brapi.biodata.pt/raiz/position_2_n353
 http://brapi.biodata.pt/raiz/position_2_n369
 http://brapi.biodata.pt/raiz/position_4_n353
 http://brapi.biodata.pt/raiz/position_7_n353
No. of rows in result: 8

Each string attribute that gets multiples results requires multiplying the results. 

Which means testing these results to see which combinations are true. 


