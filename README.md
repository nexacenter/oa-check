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
phantomjs scrape.js
```

This scrapes ROARMAP website to download all data in JSON format. The
resulting file is named `roarmap-dump.json`.

## Create graphdb using ROARMAP dump

```
node index.js -u
```

This creates a [LevelGraph](https://github.com/mcollina/levelgraph)-based
database in the `cache/` directory containing triples derived from ROARMAP
data expressed in JSON format inside of `roarmap-dump.json`.

## Use graphdb rather than using ROARMAP API

```
node index -lc
```

This uses for all operations the local graphdb rather than the remote API
exported by ROARMAP. This is more suitable for offline demos as well as for
running bulk analyses over the whole dataset of ROARMAP.
