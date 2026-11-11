# Neighbourhood boundaries

`boise-neighborhood-associations.geojson` holds the boundaries of the city's 35 neighbourhood
associations, as GeoJSON polygons in longitude and latitude. The map draws them (M6), and the read
model can use them to find which neighbourhood a point falls in. Every fixture site falls inside
one of them.

Each boundary carries `ASSOCIATIONNAME`, `ASSOCIATIONID`, `Active` and `Weblink` from the city's
data, plus the area and length the city's map service adds.

## Where it comes from

The City of Boise publishes it on its open data portal as the "Neighborhood Associations" layer,
without warranty. The sponsor downloaded this copy on 8 November 2026 from:

```
https://services1.arcgis.com/WHM6qC35aMtyAAlN/arcgis/rest/services/BoiseNeighborhoodAssociations/FeatureServer/0/query?where=1=1&outFields=*&f=geojson
```

Wherever you show the boundaries, credit them as "Neighbourhood boundaries: City of Boise".

## Refreshing it

Download the same link again and replace the file. Every team reads this copy, so a refresh goes
upstream in a pull request, like any other change to the fixtures.
