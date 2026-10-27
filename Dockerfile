# Image officielle Nginx, version légère (Alpine Linux)
FROM nginx:alpine

# Copie du site statique dans le dossier servi par Nginx
COPY index.html style.css script.js /usr/share/nginx/html/

# Nginx écoute sur le port 80 dans le conteneur
EXPOSE 80
