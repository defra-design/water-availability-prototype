alert('CATCHMENT-SEARCH.JS LOADED')

import { searchCatchments } from "./catchment-api.js";

let selectedWaterBody = null;

export function initialiseCatchmentSearch() {

const container = document.querySelector(
"#water-search-container"
);

if (!container) {
return;
}

const idField = document.querySelector(
"#selected-water-body-id"
);

const nameField = document.querySelector(
"#selected-water-body-name"
);

accessibleAutocomplete({
element: container,
id: "water-search",
minLength: 3,

source: async (query, populateResults) => {

try {

const results =
await searchCatchments(query);

populateResults(
 results.map(result => ({
 id: result.id,
 label: result.name,
 managementCatchment: result.managementCatchment,
 operationalCatchment: result.operationalCatchment
 }))
);

} catch (error) {

console.error(error);
populateResults([]);
}
},

templates: {
inputValue: result =>
result?.label || "",

suggestion: result =>
result.label
},

onConfirm: selected => {

if (!selected) {
return;
}

selectedWaterBody = {
id: selected.id,
name: selected.label,
managementCatchment: selected.managementCatchment,
operationalCatchment: selected.operationalCatchment
};

idField.value = selected.id;
nameField.value = selected.label;

window.location.href =
'/internal/current/manual-overrides-summary?' +
'waterBodyName=' + encodeURIComponent(selected.label) +
'&waterBodyId=' + encodeURIComponent(selected.id) +
'&managementCatchment=' + encodeURIComponent(selected.managementCatchment) +
'&operationalCatchment=' + encodeURIComponent(selected.operationalCatchment);
}
});
}