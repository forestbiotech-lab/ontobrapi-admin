# Admin module of OntoBrAPI
This repo is a submodule of /forestbiotech-lab/ontobrapi it is the module that handles both curation of the triples that will be incorporated into the triple store along with the mapping of PPEO to the BrAPI call

serves on:
- /admin
- /admin/brapi

## Triple Store curation
This is yet to be implemented, but will contain the ability to validate submitted .nt files from users. The curator will have the job of determining weather it is appropriate to add this new file. 
- /admin/curation

## BrAPI 
Administration of the mapping of BrAPI call to the PPEO ontology
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