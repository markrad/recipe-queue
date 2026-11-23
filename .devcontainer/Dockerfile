FROM oven/bun:debian

# Config Bun
ENV PATH="~/.bun/bin:${PATH}"
RUN ln -s /usr/local/bin/bun /usr/local/bin/node

# Update packages
RUN if [ "debian" == "alpine" ] ; then apk update ; else apt-get update ; fi

# Install Git
RUN if [ "debian" == "alpine" ] ; then apk add git ; else apt-get install -y git ; fi

COPY ./radrealm.crt /usr/local/share/ca-certificates/radrealm.crt
RUN update-ca-certificates

RUN mkdir -p /home/bun/.docker && chown -R bun:bun /home/bun/.docker \
    && printf '{}' > /home/bun/.docker/config.json \
    && chown bun:bun /home/bun/.docker/config.json