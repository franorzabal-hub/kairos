# Dockerfile for Kairos Web App (Expo Web)
# Serves static files with nginx

FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built web files
COPY dist/ /usr/share/nginx/html/

# Expose port 8080 (Cloud Run requirement)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
