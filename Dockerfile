FROM node:25-alpine

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY package.json .
COPY pnpm-lock.yaml .
RUN corepack enable && pnpm install --frozen-lockfile

# Bundle app source
COPY . .

RUN pnpm build

EXPOSE 4300

CMD [ "pnpm", "start" ]
