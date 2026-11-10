# Groundwater removal record

Groundwater content and functionality have been removed from the
`app/views/external/current` prototype. Red is used only on the specific
replacement words or short phrases in the remaining content, not on whole
sentences or unchanged headings.

## Page removed completely

| Page | Removed |
| --- | --- |
| `water-type.html` | The page that asked users to choose between surface water and groundwater. Its GET and POST routes were removed; location results now go directly to the summary. |

## Pages with sections or wording removed

| Page | Removed or changed |
| --- | --- |
| `start.html` | Rewrote the water-abstraction description to list rivers and lakes only. Only “rivers and lakes” is red. |
| `location.html` | Limited both location hints to surface-water availability and removed the commented surface/groundwater explainer. Only “surface water” is red in each hint. |
| `summary.html` | Removed groundwater body results, groundwater availability states, and groundwater-specific no-data content. Only the added word “surface” in the heading is red. |
| `existing-abstractors.html` | Removed the groundwater abstractor count and licence list. The unchanged surface-water heading and introduction are not highlighted. |
| `detailed-results.html` | Removed groundwater titles, descriptions, conditional availability logic, and the groundwater guidance/contact section. The remaining surface-water content is unchanged and is not highlighted. |
| `detailed-results copy.html` | Removed the corresponding groundwater titles, descriptions, commented navigation, and guidance/contact section from the duplicate template. The remaining surface-water content is unchanged and is not highlighted. |
| `technical-info.html` | Removed groundwater-specific dynamic water-body names from the title, policy heading, and navigation. The remaining surface-water content is unchanged and is not highlighted. |
| `how-to-apply.html` | Removed the groundwater permits branch and the pump-test, consent-to-investigate, and hydrogeological-assessment step. Only “surface water” is red in the revised discharge-permit wording. |
| `next-steps.html` | Removed the groundwater licence-application pathway. The shortened river/reservoir phrase and the rainwater definition’s “inland waters” are highlighted as context for the removed aquifer/groundwater wording. |
| `exemption.html` | Removed the saline underground-strata and passive-dewatering exemptions. “Surface waters” is highlighted in the retained building-works exemption context. |
| `water-abstraction-licensing-strategies-cams-process.html` | Removed the underground-water-reserve reference from the licensing-threshold sentence. Only “watercourse” is highlighted. |
| `usage-industrial.html` | Groundwater-related guidance was removed, but the general “Dewatering” industrial-use option remains available and is mapped to the consumptive use type. |

## Functionality removed

| File | Removed or changed |
| --- | --- |
| `_routes.js` | Removed the groundwater API request, licence queries, bounding-box and nearest-feature processing, groundwater session data, and groundwater override selection. Results now use surface-water data only; the water-type routes were removed and detail routes select surface-water records. The `Dewatering` usage maps to `dewatering` and `consumptive` and continues through the existing industrial-use route. |
