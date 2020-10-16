# ontoBrAPI
BrAPI endpoint running virtuoso to serve SparQL queries


Default user and password are: **dba** 

From docker image
The dba password can be set at container start up via the DBA_PASSWORD environment variable. If not set, the default dba password will be used.

SPARQL update permission
The SPARQL_UPDATE permission on the SPARQL endpoint can be granted by setting the SPARQL_UPDATE environment variable to true.

.ini configuration
All properties defined in virtuoso.ini can be configured via the environment variables. The environment variable should be prefixed with VIRT_ and have a format like VIRT_$SECTION_$KEY. $SECTION and $KEY are case sensitive. They should be CamelCased as in virtuoso.ini. E.g. property ErrorLogFile in the Database section should be configured as VIRT_Database_ErrorLogFile=error.log.
