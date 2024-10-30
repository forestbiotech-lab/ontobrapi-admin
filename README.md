# Admin module of OntoBrAPI
This repo is a submodule of /forestbiotech-lab/ontobrapi it is the module that handles both curation of the triples that will be incorporated into the triple store along with the mapping of PPEO to the BrAPI call

serves on:
- /admin
- /admin/brapi

## Triple Store curation
This is yet to be implemented, but will contain the ability to validate submitted .nt files from users. The curator will have the job of determining weather it is appropriate to add this new file. 
- /admin/curation

## BrAPI 
Administration of the mapping of BrAPI call to the PPEO ontology. This page shows a list of the loaded graphs withing the triple store. The calls are currenlty only being performed on the chosen graph. The selection input element allows the definition of the from part of the SparQL query for the formulation of the BrAPI calls. It is currently stored along with the credentials to access the triple store. The file is changed each time the new graph is select and the graph is read before performing any calls. This ensures that the process is dynamic without the need to reload the server. 

The future prospect is to be able to import multiple graphs, stored locally in order to aggregate the multiple n-triple files that are generated by the users. This allows the administrator to select the graph that should be provided to the general users.

```owl 
<https://ontobrapi> rdf:type owl:ontology
<https://ontobrapi> owl:imports <local-graph>
```

- /admin/brapi

## Update calls
Service that scarps plantbreeding/BrAPI/specifications/ and grabs the call schemas

```bash
npm run update-calls
```


## Getting started
Make sure .config.json is correctly configured, install dependencies build frontend dependencies and run app.
```bash
    npm i
    npm run build
    npm start
```

## Importing multiple n-triple files

An N-triples file that imports multiple ontologies can be defined by using the @import directive. The @import directive allows you to reference another N-triples file within your current file. When the file is imported, the triples from the imported file are added to the current file.

Here is an example of how to define an N-triples file that imports two ontologies:

```owl
@import "ontology1.ntriples";
@import "ontology2.ntriples";

# Triples from your current file
<subject> <predicate> <object> .
```

In this example, the ontology1.ntriples and ontology2.ntriples files are imported into the current file. The triples from these files are then added to the current file.

Here is an example of how to define an N-triples file that imports an ontology from an external URL:

```owl
@import <http://www.example.com/ontology.ntriples>;

# Triples from your current file
<subject> <predicate> <object> .
```

In this example, the ontology.ntriples file is imported from the URL http://www.example.com/ontology.ntriples. The triples from this file are then added to the current file.

You can import multiple ontologies into a single N-triples file. The imported ontologies can be referenced from within the current file using the @prefix directive.

Here is an example of how to define an N-triples file that imports two ontologies and then references them from within the current file:

```owl
@prefix ex1: <http://example.com/ontology1/> .
@prefix ex2: <http://example.com/ontology2/> .

@import "ontology1.ntriples";
@import "ontology2.ntriples";
```

ex1:subject ex1:predicate ex1:object .
ex2:subject ex2:predicate ex2:object .
In this example, the ontology1.ntriples and ontology2.ntriples files are imported into the current file. The ex1: and ex2: prefixes are then defined to reference the namespaces of the two ontologies. Finally, the triples from the current file are defined using the prefixes.


## Caching
Caching of the calls is done via MongoDB. The calls are serialized based on the request and the results are provisionally stored and can be filtered furthermore. 

To connect to the mongoDB server you can use mongosh `mongosh "mongodb://localhost" --apiVersion 1 --username <<username>> --password <<password>>`  as documented here: https://www.mongodb.com/docs/mongodb-shell/ 

Set remote MongoDB locally, through ssh tunnel.
`ssh -L 27017:localhost:27017 <server>`

To perform CRUD operation check: https://www.mongodb.com/docs/mongodb-shell/crud/#std-label-mdb-shell-crud

Select the appropriate database: `use <<db>>`:

- Insert: Use `db.<<collection>>.insertOne()`
- Query: Use `db.<<collection>>.find()`

Pagination
https://www.mongodb.com/docs/atlas/atlas-search/tutorial/pagination-tutorial/

- Aggredation: Use `db.<<collection>>.aggregation([{"$match":{}},{"$skip":0},{"$limit":1000}])` $skip

## Debuggin
The database in use is stored in the .config.json file, under the attribute monogo.database

``` json
{
    mongo:{
        database: "yourdatabase"
    }
}
```

To list the available collections `use <<yourdatabase>>; db.getCollectionNames()` 

# Dataset management

There are two graphs where the dataset are stored. Staging \<http://brapi.biodata.pt/staging\> and Production \<http://brapi.biodata.pt/ontobrapi\>. Globally the prefixes used are listed below:
``` sparql
PREFIX staging:    <http://brapi.biodata.pt/staging#>
PREFIX production: <http://brapi.biodata.pt/ontobrapi#>
PREFIX ontobrapi:  <http://brapi.biodata.pt/ontobrapi#>
PREFIX miappe:     <http://purl.org/ppeo/PPEO.owl#>
PREFIX rdf:        <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd:        <http://www.w3.org/2001/XMLSchema#>
PREFIX owl:        <http://www.w3.org/2002/07/owl#>
PREFIX void:       <http://rdfs.org/ns/void#>
PREFIX rdfs:       <http://www.w3.org/2000/01/rdf-schema#>
````
## Initialization 
Graphs stored in either graphs should have the apropriate URI in acordance with the respective graph. On start both graphs are initialized with: 

``` sparql
   staging: rdf:type void:Dataset .
   staging: owl:imports miappe .
```

and 

``` sparql
   production: rdf:type void:Dataset .
   production: owl:imports miappe .
```

## New dataset 
The new dataset is allways added to the staging graph with the staging URI. An UID is gererated to the dataset on upload and tha triples are added acordingly after the following triples where dataset: is \<${ontobrapi}/${graph}/${uid}#\>:
``` sparql
        dataset: void:inDataset ontobrapi: .
        dataset: miappe:hasInvestigation dataset:Investigation?? .
        dataset:Investigation?? rdf:type miappe:investigation .
        dataset:Investigation?? miappe:hasDatabaseId "${uid}"^^xsd:string .
        dataset:hasStatus rdf:type owl:ObjectProperty .
        dataset:hasStatus rdfs:domain dataset:Investigation?? .
        dataset:hasStatus rdfs:range rdfs:Literal .
        dataset:hasStatus rdfs:label "hasStatus" .
        dataset:hasStatus rdfs:subPropertyOf void:hasProperty .
        dataset:hasStatus rdf:type owl:ObjectProperty .
        dataset: miappe:hasStatus "Awaiting validation"^^xsd:string .
```

It is important that the datasets get initialized, which should run successfully on each `npm start` or alternatively using the `npm run init-dataset` command, otherwise, the ontobrapi explorer will not work. 

