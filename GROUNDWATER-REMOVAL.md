# Groundwater removal record

Groundwater content and functionality have been removed from the
`app/views/external/current` prototype. The remaining surface-water wording
that was rewritten in context is marked red in the affected templates.

## Page removed completely

| Page | Removed |
| --- | --- |
| `water-type.html` | The page that asked users to choose between surface water and groundwater. Its GET and POST routes were removed; location results now go directly to the summary. |

## Pages with sections or wording removed

| Page | Removed or changed |
| --- | --- |
| `start.html` | Rewrote the water-abstraction description to list rivers and lakes only. The revised sentence is red. |
| `location.html` | Limited both location hints to surface-water availability and removed the commented surface/groundwater explainer. The revised hints are red. |
| `summary.html` | Removed groundwater body results, groundwater availability states, and groundwater-specific no-data content. Kept the surface-water results and updated the heading and related context in red. |
| `existing-abstractors.html` | Removed the groundwater abstractor count and licence list. Kept the surface-water abstractor section, with its contextual heading and introduction in red. |
| `detailed-results.html` | Removed groundwater titles, descriptions, conditional availability logic, and the groundwater guidance/contact section. Kept surface-water details and marked revised surrounding headings and descriptions red. |
| `detailed-results copy.html` | Removed the corresponding groundwater titles, descriptions, commented navigation, and guidance/contact section from the duplicate template. Kept and marked the remaining surface-water context red. |
| `technical-info.html` | Removed groundwater-specific dynamic water-body names from the title, policy heading, and navigation; these now refer to surface water and are red. |
| `how-to-apply.html` | Removed the groundwater permits branch and the pump-test, consent-to-investigate, and hydrogeological-assessment step. Revised discharge-permit wording to cover surface water only; revised nearby content is red. |
| `next-steps.html` | Removed the groundwater licence-application pathway. Removed the aquifer reference from water-recycling content and the groundwater qualification from the rainwater definition; revised surrounding wording is red. |
| `exemption.html` | Removed the saline underground-strata and passive-dewatering exemptions. Retained the surface-water part of the building-works exemption and marked that revised bullet red. |
| `water-abstraction-licensing-strategies-cams-process.html` | Limited the licensing-threshold sentence to watercourses; the revised sentence is red. |
| `usage-industrial.html` | Groundwater-related guidance was removed, but the general “Dewatering” industrial-use option remains available and is mapped to the consumptive use type. |

## Functionality removed

| File | Removed or changed |
| --- | --- |
| `_routes.js` | Removed the groundwater API request, licence queries, bounding-box and nearest-feature processing, groundwater session data, and groundwater override selection. Results now use surface-water data only; the water-type routes were removed and detail routes select surface-water records. The `Dewatering` usage maps to `dewatering` and `consumptive` and continues through the existing industrial-use route. |
