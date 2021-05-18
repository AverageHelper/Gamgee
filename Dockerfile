FROM node:14
USER node

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install  

# Install PM2
RUN npm install pm2 -g

# Bundle app source
COPY . .

# Build app source
RUN npm run build

# Later we might want a web interface for managing Gamgee on port 9229
# EXPOSE 8080

# Start
CMD [ "pm2-runtime", "dist/main.js" ]
