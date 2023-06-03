# Use a Node.js base image
FROM node:18.7.0

# Set the working directory
WORKDIR /app

# Install ffmpeg
RUN apt-get update -y
RUN apt-get upgrade -y
RUN apt-get install ffmpeg -y
RUN apt-get @ffmpeg-installer/ffmpeg
RUN apt-get fluent-ffmpeg

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the .env file
COPY .env ./

# Copy the rest of the application code
COPY . .

# Set the command to run when the container starts
CMD ["npm", "start"]
