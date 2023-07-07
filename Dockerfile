# Use a Node.js base image
FROM node:18.7.0

# Set the working directory
WORKDIR /app

RUN npm cache clean --force

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies, including devDependencies
RUN npm install --legacy-peer-deps

RUN npm install puppeteer

# Install Chromium dependencies
RUN apt-get update && apt-get install -y wget libgbm1 libfontconfig1 libxrender1 libjpeg62-turbo libxtst6 libasound2 libdbus-glib-1-2



# Copy the rest of the application code
COPY . .

# Set the command to run when the container starts
CMD ["npm", "start"]
