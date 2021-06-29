FROM node:14-alpine as builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile --no-cache

# note: eslintrc must be copied
# https://github.com/facebook/create-react-app/issues/9791
COPY tsconfig.json webpack.config.*.ts .eslintrc.js console-extensions.json ./
COPY public/ ./public
COPY src/ ./src

RUN yarn build
RUN mv -v dist/plugin plugin/
RUN mv -v build/ client/
RUN mv -v dist/server server/

##################################################

FROM node:14-alpine

# ARG BUILD_DATE
ARG VCS_REF

LABEL org.label-schema.schema-version="1.0"
# LABEL org.label-schema.build-date=$BUILD_DATE
LABEL org.label-schema.name="redhat-actions/openshift-actions-connector"
LABEL org.label-schema.url="https://github.com/redhat-actions/openshift-actions-connector"
LABEL org.label-schema.vsc-ref=$VSC_REF

# ARG USER=node
ARG USER=1000
ENV USER $USER

RUN mkdir -v /app  \
    && chown $USER:0 /app \
    && chmod 774 /app
WORKDIR /app
ENV HOME /app

RUN apk add curl

USER $USER

ENV NODE_ENV production

ARG PORT=3443
ENV PORT $PORT

EXPOSE $PORT

# These paths must match those in server/index.ts so they can be served statically
COPY --chown=$USER --from=builder /app/client ./client
COPY --chown=$USER --from=builder /app/plugin ./plugin
COPY --chown=$USER --from=builder /app/server .
COPY --chown=$USER README.md .

ENTRYPOINT [ "node", "./server.js" ]
