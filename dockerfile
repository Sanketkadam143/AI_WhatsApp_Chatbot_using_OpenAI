# Use a Node.js base image
FROM node:18.7.0

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install only dependencies, excluding devDependencies
RUN npm ci --only=production

# Copy the .env file
COPY .env ./

# Copy the rest of the application code
COPY . .

# Set the command to run when the container starts
CMD ["npm", "start"]
