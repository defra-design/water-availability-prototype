# Groundwater removal record

Groundwater content and functionality have been removed from the
`app/views/external/current` prototype.

## Page removed completely

| Page | Removed |
| --- | --- |
| `water-type.html` | The page that asked users to choose between surface water and groundwater. Its GET and POST routes were removed; location results now go directly to the summary. |

## Pages with sections or wording removed

| Page | Removed or changed |
| --- | --- |
| `start.html` | Rewrote the water-abstraction description to list rivers and lakes only. |
| `location.html` | Limited both location hints to surface-water availability and removed the commented surface/groundwater explainer. |
| `summary.html` | Removed groundwater body results, groundwater availability states, and groundwater-specific no-data content. Updated the heading to refer to surface water. |
| `existing-abstractors.html` | Removed the groundwater abstractor count and licence list. |
| `detailed-results.html` | Removed groundwater titles, descriptions, conditional availability logic, and the groundwater guidance/contact section. |
| `detailed-results copy.html` | Removed the corresponding groundwater titles, descriptions, commented navigation, and guidance/contact section from the duplicate template. |
| `technical-info.html` | Removed groundwater-specific dynamic water-body names from the title, policy heading, and navigation. |
| `how-to-apply.html` | Removed the groundwater permits branch and the pump-test, consent-to-investigate, and hydrogeological-assessment step. Revised discharge-permit wording to cover surface water only. |
| `next-steps.html` | Removed the groundwater licence-application pathway and groundwater/aquifer references from water-recycling and rainwater content. |
| `exemption.html` | Removed the saline underground-strata and passive-dewatering exemptions. Retained the surface-water part of the building-works exemption. |
| `water-abstraction-licensing-strategies-cams-process.html` | Removed the underground-water-reserve reference from the licensing-threshold sentence. |
| `usage-industrial.html` | Groundwater-related guidance was removed, but the general “Dewatering” industrial-use option remains available and is mapped to the consumptive use type. |

## Functionality removed

| File | Removed or changed |
| --- | --- |
| `_routes.js` | Removed the groundwater API request, licence queries, bounding-box and nearest-feature processing, groundwater session data, and groundwater override selection. Results now use surface-water data only; the water-type routes were removed and detail routes select surface-water records. The `Dewatering` usage maps to `dewatering` and `consumptive` and continues through the existing industrial-use route. |
