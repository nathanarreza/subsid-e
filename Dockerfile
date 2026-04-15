# Use Node 20
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the code (api, public, server.js)
COPY . .

# Start the server
CMD [ "node", "server.js" ]