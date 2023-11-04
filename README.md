# Basic skeleton for admin container
Configure brapi calls and curate graphs that are includes in the triple store

All urls must be in the /admin url since this is served by nginx in the docker-compose file of the main repo. 
Static file are served at /admin/public otherwise nginx will refere to another module.

