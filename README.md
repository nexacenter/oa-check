# ROARMAP H2020 View

View H2020 compliancy of [ROARMAP](http://roarmap.eprints.org/)
policies through a local webserver that fetches data directly from
the ROARMAP web site and web API.

You need to have [node](https://nodejs.org) installed. To install
dependencies and start the local webserver run:

## Install dependencies

```
npm install
```

## Frontend ROARMAP API

```
npm start
```

Then browse to [http://127.0.0.1:8080/](http://127.0.0.1:8080/) to
view ROARMAP H2020 compliancy. Type `^C` to stop the webserver.

## Download all ROARMAP data in JSON format

```
node server.js -d
```

This scrapes ROARMAP website to download all data in JSON format and
prints the resulting JSON document on the standard output.
