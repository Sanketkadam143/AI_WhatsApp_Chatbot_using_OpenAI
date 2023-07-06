# Use a Node.js base image
FROM node:18.7.0

# Set the working directory
WORKDIR /app

# Install Python
RUN apt-get update && \
    apt-get install -y python3

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies, including devDependencies
RUN npm install

# Copy the .env file
COPY .env ./

# Copy the rest of the application code
COPY . .

# Set the command to run when the container starts
CMD ["npm", "start"]
