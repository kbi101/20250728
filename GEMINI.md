1) create frontend folder to host front end app.
2) create backend folder to host micro service that support the front end.
  1. read neo4j_rest_api_prompt.md and create the app in backend.



** 

** The code should be in checked in status before any change makes. Once change is done and owner confirmed "it is working and please commit", the code should be commited and pushed

build
ocker-compose -f deployment/docker-compose.yml build 

local start
uvicorn app.main:app --host 0.0.0.0 --port 8002
export REACT_APP_BACKEND_URL=http://localhost:8000
export FRONTEND_ORIGIN=http://localhost:3000
Nom start
