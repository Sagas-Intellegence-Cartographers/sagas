# Working with location data

Every layer touches this. The experience layer draws a map and asks what is
near here. The content layer reads coordinates out of photographs. The
intelligence layer asks whether two places are close enough to be related.

Most of it is unfamiliar, and two of the mistakes below fail silently: swapping
the coordinate order, and measuring distance in degrees.

---

## Coordinates are longitude first

Coordinates in this project are `[longitude, latitude]`.

That is the reverse of how everyone says it out loud. "Forty-three point six
north, one hundred sixteen point two west" is latitude first, and most GPS apps
show it that way.

GeoJSON, PostGIS, and Mapbox all want longitude first. So does the contract:

```ts
coordinates: [-116.20331, 43.61533]   // Boise
coordinates: [43.61533, -116.20331]   // swapped: -116 is not a real latitude
```

The Boise pair swapped is not a real place, because -116 is outside the range a
latitude can take. Something will reject it, possibly far from where the mistake
was made. A pair whose longitude is between -90 and 90 is worse: swapped, it is a
valid point somewhere else entirely, and nothing complains.

If a marker is missing, check the order first.

---

## Two kinds of coordinate in PostGIS

PostGIS gives you `geometry` and `geography` and they are not the same thing.

**`geometry`** treats coordinates as points on a flat plane. It is fast and fine
for a small area. Distances come out in degrees, which are not a unit of length:
one degree of longitude is about 111km at the equator and about 80km in Boise,
so "within 0.02 degrees" means something different depending on where you are.

**`geography`** treats them as points on the globe. It is slower, and distances
come out in meters everywhere.

This project expects `geography` with SRID 4326, so that "2000" in a query means
two kilometers. An SRID is the number that tells PostGIS which coordinate system
a value is in.

```sql
location geography(Point, 4326)
```

4326 is plain latitude and longitude, the system GPS uses. You will see
3857 elsewhere. That is the projection web maps use for drawing tiles, and it is
not for storing points.

---

## The query you will write first

"Everything within 2km of here" is not a subtraction problem.

```sql
-- Wrong. Degrees are not meters, and this is a different distance
-- depending on how far north you are.
WHERE abs(lng - $1) < 0.02 AND abs(lat - $2) < 0.02

-- Right, and it can use an index.
WHERE ST_DWithin(location, ST_MakePoint($1, $2)::geography, 2000)
```

Use `ST_DWithin`. Avoid `ST_Distance(...) < 2000`, which computes an exact
distance for every row in the table before comparing and cannot use an index to
skip anything.

For the map itself you usually want a bounding box instead, because what you
need is "what is on screen" rather than "what is near a point":

```sql
WHERE location && ST_MakeEnvelope($west, $south, $east, $north, 4326)::geography
```

`&&` is the bounding-box overlap operator. It is cheap and it is index-backed.

---

## Index it or every pan is a table scan

```sql
CREATE INDEX sites_location_idx ON sites USING GIST (location);
```

Without this, every map movement reads every row. With a hundred sites you will
not notice, so add the index when you create the table rather than waiting for
it to be slow.

Check your work with `EXPLAIN ANALYZE`. If you see `Seq Scan` on a spatial
query, the index is not being used, and one common reason is a type mismatch
between the column and what you passed in.

---

## Precision and accuracy are different things

A photograph's embedded GPS is precise to a few meters and can still be wrong,
because the phone was indoors or across the street. A pin somebody drops by hand
is imprecise and can still be right.

The contract keeps both the coordinates and how they were arrived at, in
`capturedLocation`: `placed`, `geocoded`, `embedded`, or `inherited`, plus an
optional accuracy in meters.

Do not average them. Do not silently prefer the more precise one. A record's
location and the place it is attached to can disagree, and that disagreement is
information. There is an acceptance case about exactly this, where a photo's
GPS lands in the middle of the street.

How location should be captured is open. See "How does a record get a
location?" in `docs/DESIGN-QUESTIONS.md`.

---

## Things you probably do not need

**Routing.** A heritage trail in this project is a curated ordered list of
places. Nothing computes a path between them. You do not need pgRouting and you
almost certainly do not need a directions API.

**Reprojection.** Everything is 4326. If you find yourself converting between
coordinate systems, stop and check why.

**Polygons.** Everything here is a point. Neighborhood boundaries would be
polygons and they are not in the contract, so if you want them that is a
conversation first.

---

## Where to look when it is wrong

- **Marker in the wrong hemisphere** — coordinate order.
- **Marker in the ocean off Africa** — coordinate order, or a null that became
  `0, 0`.
- **Distances are tiny decimals** — you are on `geometry` and getting degrees.
- **Query is slow** — `EXPLAIN ANALYZE`, look for `Seq Scan`, check the index
  and the types.
- **Map is empty but the query returns rows** — the data is fine, so the problem
  is the map. Check the token and the bounds you handed it.
