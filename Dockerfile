FROM node:20-slim
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (This creates the node_modules folder)
RUN npm install --production

# DEBUG: This will print the contents of node_modules in your terminal
# so we can prove express was installed
RUN ls node_modules/express

# Copy the rest of your files
COPY . .

EXPOSE 8080
CMD [ "node", "server.js" ]