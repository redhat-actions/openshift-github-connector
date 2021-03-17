FROM node:14-alpine

WORKDIR /app

ENV NODE_ENV prod
ENV PORT 3003
EXPOSE 3003

RUN curl -O https://mirror.openshift.com/pub/openshift-v4/x86_64/clients/ocp/4.7.2/openshift-client-linux.tar.gz \
&& untar openshift-client-linux.tar.gz \
&& mv oc kubectl /usr/local/bin


COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run build
    # npm prune --production

# ENTRYPOINT [ "npm", "start" ]
ENTRYPOINT [ "npm", "run", "nodemon" ]
