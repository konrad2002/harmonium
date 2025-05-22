FROM nginx
COPY dist /usr/share/nginx/html
COPY /nginx.conf  /etc/nginx/conf.d/default.conf

COPY public/favicon /usr/share/nginx/html/

ARG VERSION="HEAD"
ARG BRANCH="LOCAL"

RUN rm -f /usr/share/nginx/html/release.txt
RUN touch /usr/share/nginx/html/release.txt
RUN echo $(date) > /usr/share/nginx/html/release.txt

RUN rm -f /usr/share/nginx/html/version.txt
RUN touch /usr/share/nginx/html/version.txt
RUN echo $VERSION > /usr/share/nginx/html/version.txt

EXPOSE 80
