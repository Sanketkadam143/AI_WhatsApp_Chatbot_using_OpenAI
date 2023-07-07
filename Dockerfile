# Use a Node.js base image
FROM node:18.7.0

# Set the working directory
WORKDIR /app

RUN npm cache clean --force

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies, including devDependencies
RUN npm install --legacy-peer-deps

# Install Chromium dependencies
RUN apt-get update && apt-get install -y wget libgbm1 libfontconfig1 libxrender1 libjpeg62-turbo libxtst6 libasound2 libdbus-glib-1-2

# Download and install Chromium
RUN wget -qO- https://download-chromium.appspot.com/dl/Linux_x64?type=snapshots | tar zxvf - -C /usr/local

# Set the Chromium executable path
ENV CHROME_BIN=/usr/local/chrome-linux/chrome

# Copy the rest of the application code
COPY . .

# Set the command to run when the container starts
CMD ["npm", "start"]
