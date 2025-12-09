FROM node:22-alpine

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY package.json .
COPY yarn.lock .
RUN yarn

# Bundle app source
COPY . .

RUN yarn build

EXPOSE 4300

CMD [ "yarn", "start" ]
