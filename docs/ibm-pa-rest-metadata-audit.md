# IBM PA / TM1 REST Metadata Audit

Date: 2026-04-02

Purpose: keep a close reference of what semantic metadata is already available from IBM Planning Analytics / TM1 REST before implementing Step 6.

Scope:
- audit only
- no Step 6 implementation
- based on the current project integration plus a live probe on the open server `Seminaire`

Important context:
- `Seminaire` is open and was used for the live audit
- `CXMD` and `CityzMedia` are closed, so failed requests on those servers are expected and should not be used as the semantic reference

## Summary

IBM PA / TM1 already exposes useful semantic-friendly metadata through the REST API:
- `Attributes`
- `LocalizedAttributes`
- `UniqueName`
- hierarchy metadata
- member metadata such as `Type`, `Level`, `Ordinal`, `Weight`

In the audited environment, `Caption` is already present inside `Attributes` for:
- cubes
- dimensions
- hierarchies
- elements
- members

That means Step 6 should not start from a manual dictionary only.

Best strategy for this project:
1. use IBM metadata first
2. apply heuristic label fallback when metadata is missing
3. add a small manual business dictionary only where needed

## What The Current Backend Uses Today

Current server-side integration uses only a small subset of TM1 metadata.

### Active requests in the current code

- TM1 servers:
  - [src/server/ibm-pa/client.ts](/Users/smalho/Desktop/ibm-pa-ai-copilot/src/server/ibm-pa/client.ts:94)
  - path: `/tm1/Servers?$expand=*`

- Cubes:
  - [src/server/ibm-pa/client.ts](/Users/smalho/Desktop/ibm-pa-ai-copilot/src/server/ibm-pa/client.ts:124)
  - path: `/Cubes?$select=Name`

- Cube dimensions:
  - [src/server/ibm-pa/client.ts](/Users/smalho/Desktop/ibm-pa-ai-copilot/src/server/ibm-pa/client.ts:305)
  - path: `/Cubes('<cube>')/Dimensions?$select=Name`

- Primary hierarchy:
  - [src/server/ibm-pa/client.ts](/Users/smalho/Desktop/ibm-pa-ai-copilot/src/server/ibm-pa/client.ts:625)
  - path: `/Dimensions('<dimension>')/Hierarchies?$select=Name&$top=1`

- Sample elements:
  - [src/server/ibm-pa/client.ts](/Users/smalho/Desktop/ibm-pa-ai-copilot/src/server/ibm-pa/client.ts:603)
  - [src/server/ibm-pa/client.ts](/Users/smalho/Desktop/ibm-pa-ai-copilot/src/server/ibm-pa/client.ts:737)
  - path: `/Dimensions('<dimension>')/Hierarchies('<hierarchy>')/Elements?$select=Name&$top=<n>`

- Data preview via MDX:
  - [src/server/ibm-pa/client.ts](/Users/smalho/Desktop/ibm-pa-ai-copilot/src/server/ibm-pa/client.ts:463)
  - path: `/ExecuteMDX?$expand=Axes($expand=Tuples($expand=Members($select=Name,UniqueName;$expand=Element($select=Name)))),Cells($select=Value,FormattedValue)`

### What we currently keep in our types

- Cube summary:
  - [src/server/ibm-pa/types.ts](/Users/smalho/Desktop/ibm-pa-ai-copilot/src/server/ibm-pa/types.ts:30)

- Cube dimension:
  - [src/server/ibm-pa/types.ts](/Users/smalho/Desktop/ibm-pa-ai-copilot/src/server/ibm-pa/types.ts:35)

- Sample member set:
  - [src/server/ibm-pa/types.ts](/Users/smalho/Desktop/ibm-pa-ai-copilot/src/server/ibm-pa/types.ts:42)

- MDX axis member:
  - [src/server/ibm-pa/types.ts](/Users/smalho/Desktop/ibm-pa-ai-copilot/src/server/ibm-pa/types.ts:52)

- Dimension accessibility diagnostic:
  - [src/server/ibm-pa/types.ts](/Users/smalho/Desktop/ibm-pa-ai-copilot/src/server/ibm-pa/types.ts:134)

- Cube dimension structure diagnostic:
  - [src/server/ibm-pa/types.ts](/Users/smalho/Desktop/ibm-pa-ai-copilot/src/server/ibm-pa/types.ts:154)

### Important consequence

Today we mostly expose:
- `Name`
- `UniqueName` only in MDX preview
- `FormattedValue` and raw `Value` for cell preview

We currently ignore most semantic metadata already available in TM1.

## Server-Level Metadata

For TM1 server discovery, our code already parses:
- `Name`
- `ServerName`
- `Description`
- `IsDefault`
- `Default`

Relevant code:
- schema: [src/server/ibm-pa/schemas.ts](/Users/smalho/Desktop/ibm-pa-ai-copilot/src/server/ibm-pa/schemas.ts:14)
- normalization: [src/server/ibm-pa/client.ts](/Users/smalho/Desktop/ibm-pa-ai-copilot/src/server/ibm-pa/client.ts:824)
- description extraction: [src/server/ibm-pa/client.ts](/Users/smalho/Desktop/ibm-pa-ai-copilot/src/server/ibm-pa/client.ts:854)

Server description already exists in our integration.

## Cube-Level Metadata

Live audit on `Seminaire` found the following `Cube` properties:

- `Name`
- `Attributes`
- `LastSchemaUpdate`
- `LastDataUpdate`
- `Rules`
- `DrillthroughRules`
- `Locked`
- `AllowPersistentHolds`
- `CalculationThresholdForStorage`
- `CellSecurityDefaultValue`
- `CellSecurityMostRestrictive`
- `ViewStorageMaxMemory`
- `ViewStorageMinTime`

Cube navigation properties found:
- `Annotations`
- `Dimensions`
- `LocalizedAttributes`
- `MeasuresDimension`
- `PrivateViews`
- `TimeDimension`
- `ViewAttributes`
- `Views`

### Cube semantic findings

Observed in live data:
- `Attributes` includes `Caption`

Useful automatically available fields for Step 6:
- `Name`
- `Attributes.Caption`
- `LocalizedAttributes`
- `LastSchemaUpdate`
- `LastDataUpdate`

Not observed as top-level properties:
- `Caption_Default`
- `Description`
- `CUBE_TYPE`

### Practical note

There are also system cubes that strongly suggest built-in metadata support:
- `}CubeAttributes`
- `}CubeCaptions`
- `}LocalizedCubeAttributes`

## Dimension-Level Metadata

Live audit on `Seminaire` found the following `Dimension` properties:

- `Name`
- `UniqueName`
- `AllLeavesHierarchyName`
- `Attributes`
- `Locked`

Dimension navigation properties found:
- `DefaultHierarchy`
- `Hierarchies`
- `HierarchyAttributes`
- `LocalizedAttributes`

### Dimension semantic findings

Observed in live data:
- `Attributes` includes `Caption`

Useful automatically available fields for Step 6:
- `Name`
- `UniqueName`
- `AllLeavesHierarchyName`
- `Attributes.Caption`
- `LocalizedAttributes`

Not observed as top-level properties:
- `Description`
- dedicated alias field as a first-class property

### Practical note

Server-level system structures also show:
- `}DimensionAttributes`
- `}DimensionCaptions`
- `}LocalizedDimensionAttributes`

This confirms the platform supports richer dimension labeling than what we currently return.

## Hierarchy-Level Metadata

Live audit on `Seminaire` found the following `Hierarchy` properties:

- `Name`
- `UniqueName`
- `Cardinality`
- `Structure`
- `Visible`
- `LevelNames`
- `DefaultMemberName`
- `Attributes`
- `ComponentsSortSense`
- `ComponentsSortType`
- `ElementsSortSense`
- `ElementsSortType`

Hierarchy navigation properties found:
- `AllMember`
- `DefaultMember`
- `Dimension`
- `Edges`
- `ElementAttributes`
- `Elements`
- `Levels`
- `LocalizedAttributes`
- `Members`
- `PrivateSubsets`
- `SessionSubsets`
- `SubsetAttributes`
- `Subsets`

### Hierarchy semantic findings

Observed in live data:
- `Attributes` includes `Caption`

Useful automatically available fields for Step 6:
- `Name`
- `UniqueName`
- `Cardinality`
- `Structure`
- `Visible`
- `LevelNames`
- `DefaultMemberName`
- `Attributes.Caption`

## Element-Level Metadata

Live audit on `Seminaire` found the following `Element` properties:

- `Name`
- `UniqueName`
- `Type`
- `Level`
- `Index`
- `Attributes`
- `Locked`

Element navigation properties found:
- `Components`
- `Edges`
- `Hierarchy`
- `LocalizedAttributes`
- `Parents`

### Element semantic findings

Observed in live data:
- `Attributes` includes `Caption`

Useful automatically available fields for Step 6:
- `Name`
- `UniqueName`
- `Type`
- `Level`
- `Index`
- `Attributes.Caption`
- `LocalizedAttributes`

### Practical note

The server contains many system cubes of the form:
- `}ElementAttributes_<dimension>`
- `}ElementCaptions`
- `}ElementCaptionsByDimension`
- `}LocalizedElementAttributes_<dimension>`

This strongly suggests that many business labels and aliases will come from element attributes.

## Member-Level Metadata

Live audit on `Seminaire` found the following `Member` properties:

- `Name`
- `UniqueName`
- `Type`
- `Ordinal`
- `IsPlaceholder`
- `Weight`
- `Attributes`

Member navigation properties found:
- `Children`
- `Element`
- `Hierarchy`
- `Level`
- `LocalizedAttributes`
- `Parent`

### Member semantic findings

Observed in live data:
- `Attributes` includes `Caption`

Useful automatically available fields for Step 6:
- `Name`
- `UniqueName`
- `Type`
- `Ordinal`
- `IsPlaceholder`
- `Weight`
- `Attributes.Caption`
- `LocalizedAttributes`

## What Seems Absent

Not observed as reliable top-level fields for business labeling:
- `Caption_Default`
- `Description` on cubes
- `Description` on dimensions
- `Description` on elements or members
- `CUBE_TYPE`

These may exist through custom attributes or system cubes, but they were not observed as simple first-class REST properties in the live audit.

## What Can Be Derived Heuristically

If semantic metadata is missing, the app can still derive a helpful fallback from:
- technical names split on `_`
- camel case splitting
- removal or special treatment of `}` system object prefixes
- hierarchy-aware formatting
- known naming conventions such as measure dimensions and time dimensions

Examples:
- `Budget Masse Salariale` is already business-friendly
- `}CubeAttributes` is clearly technical and should be marked as system metadata
- `DATA_CATALOG` can be humanized to `Data Catalog`

## What Likely Needs A Manual Business Dictionary

Even with TM1 captions, some business meaning will still need manual curation:
- business definition of a cube
- explanation of what a measure really means
- preferred business naming when captions are inconsistent
- grouping dimensions into roles such as time, entity, scenario, measure, product
- business help text for end users

Recommendation:
- keep the manual dictionary small and targeted
- use it as an override layer, not as the primary source

## Recommended Step 6 Strategy

Best approach for this project:

1. Automatic IBM metadata first
   - prefer `Attributes.Caption`
   - use `LocalizedAttributes` when available
   - expose `UniqueName`, `Type`, `Level`, `Ordinal`, `Cardinality`, `Structure`

2. Heuristic fallback second
   - humanize technical names when caption is missing
   - mark system objects clearly

3. Manual business dictionary third
   - add curated business descriptions and preferred labels only where useful

In short:
- not `manual only`
- not `TM1 metadata only`
- use `TM1 metadata + heuristic fallback + manual override`

## Minimal Backend Enrichments That Would Help Step 6

These are the smallest useful enrichments to the current backend:

### Cubes

Move from:
- `/Cubes?$select=Name`

Toward:
- `/Cubes?$select=Name,Attributes,LastSchemaUpdate,LastDataUpdate`

Primary fields to expose:
- `name`
- `caption`
- `lastSchemaUpdate`
- `lastDataUpdate`

### Dimensions

Add a targeted read such as:
- `/Dimensions('<dimension>')?$select=Name,UniqueName,AllLeavesHierarchyName,Attributes`

Primary fields to expose:
- `name`
- `caption`
- `uniqueName`
- `allLeavesHierarchyName`

### Hierarchies

Add:
- `/Hierarchies('<hierarchy>')?$select=Name,UniqueName,Cardinality,Structure,Visible,Attributes`

Primary fields to expose:
- `name`
- `caption`
- `uniqueName`
- `cardinality`
- `structure`
- `visible`

### Elements or members

Enrich current member sample fetches with:
- `Name`
- `UniqueName`
- `Type`
- `Level`
- `Index`
- `Attributes`

If using members:
- `Ordinal`
- `IsPlaceholder`
- `Weight`

## Notes From The Live Audit

- The server `Seminaire` returned real semantic metadata successfully.
- Closed servers should not be used as evidence that metadata is absent.
- Some current API responses show mojibake on accented labels, for example `SociÃ©tÃ©`.
  This looks like an encoding/display issue and should be handled separately from Step 6.

## References

- IBM Planning Analytics REST API metadata docs:
  - https://www.ibm.com/docs/en/planning-analytics/2.0.0?topic=api-metadata

- IBM TM1 Admin Server metadata entry points mentioned by IBM:
  - `http://<adminserver>:5895/api/v1/$metadata`
  - `https://<adminserver>:5898/api/v1/$metadata`

Note:
- In this project, the live integration goes through the IBM tenant path and TM1 server path, not a direct Admin Server URL.
