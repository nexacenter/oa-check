# ROARMAP H2020 View

[![Build Status](https://travis-ci.org/nexacenter/roarmap-h2020-view.svg?branch=master)](https://travis-ci.org/nexacenter/roarmap-h2020-view) [![bitHound Overall Score](https://www.bithound.io/github/nexacenter/roarmap-h2020-view/badges/score.svg)](https://www.bithound.io/github/nexacenter/roarmap-h2020-view) [![Coverage Status](https://coveralls.io/repos/github/nexacenter/roarmap-h2020-view/badge.svg?branch=master)](https://coveralls.io/github/nexacenter/roarmap-h2020-view?branch=master)

View H2020 compliancy of [ROARMAP](http://roarmap.eprints.org/)
policies through a local webserver that fetches data directly from
the ROARMAP web site and web API.

You need to have [node](https://nodejs.org) >= 5.x installed. To install
dependencies and start the local webserver run:

```
npm install
```

Then, to start the server, run:

```
npm start
```

Then browse to [http://127.0.0.1:8080/](http://127.0.0.1:8080/) to
view ROARMAP H2020 compliancy. Type `^C` to stop the server.

To dump roarmap database in JSON format, run:

```
node server.js -d
```
