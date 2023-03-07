FROM ruby:3

ARG HTTP_PROXY=${HTTP_PROXY}
ARG USERNAME=jekyll
ARG USER_UID=1000
ARG USER_GID=$USER_UID

ENV HTTP_PROXY=${HTTP_PROXY} \
    HTTPS_PROXY=${HTTP_PROXY} \
    http_proxy=${HTTP_PROXY} \
    https_proxy=${HTTP_PROXY} \
    NO_PROXY=localhost,127.0.0.1 \
    no_proxy=localhost,127.0.0.1

RUN echo $HTTP_PROXY
RUN apt-get update
RUN apt-get install -y ca-certificates fonts-ipafont plantuml lsof \
 && update-ca-certificates

# RUN mkdir -p /root/.pip/ && \
#     echo -e "[global]\nproxy = ${HTTP_PROXY}" > /root/.pip/pip.conf

RUN curl -kL https://github.com/jgm/pandoc/releases/download/2.19.2/pandoc-2.19.2-1-amd64.deb \
     -o /tmp/pandoc.deb && \
    dpkg -i /tmp/pandoc.deb

RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -s /bin/bash -m $USERNAME \
    #
    # [Optional] Add sudo support. Omit if you don't need to install software after connecting.
    && apt-get update \
    && apt-get install -y sudo \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

RUN set -eux && \
    mkdir -p /workspace && \
    chown ${USER_UID}:${USER_GID} /workspace

USER ${USERNAME}

ADD files/talisman_hook_script /home/ubuntu/.talisman/bin/talisman_hook_script

ADD files/talisman_linux_amd64 /home/ubuntu/.talisman/bin/talisman_linux_amd64

RUN mkdir -p /home/jekyll/.git-template/hooks \
    && ln -s /home/jekyll/.talisman/bin/talisman_hook_script /home/jekyll/.git-template/hooks/pre-commit

WORKDIR /workspace

# RUN set -eux && \
#     gem install bundler jekyll && \
#     bundle install

RUN set -eux && \
    gem install bundler jekyll
