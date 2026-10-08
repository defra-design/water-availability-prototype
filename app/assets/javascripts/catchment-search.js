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
 type: result.type,
 managementCatchment: result.managementCatchment,
 managementCatchmentId: result.managementCatchmentId,
 operationalCatchment: result.operationalCatchment,
 operationalCatchmentId: result.operationalCatchmentId
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
 `${result.label} (${result.type === 'managementCatchment' ? 'management catchment' : result.type === 'operationalCatchment' ? 'operational catchment' : 'waterbody'})`
},

onConfirm: selected => {

if (!selected) {
return;
}

selectedWaterBody = {
id: selected.id,
name: selected.label,
managementCatchment: selected.managementCatchment,
managementCatchmentId: selected.managementCatchmentId,
operationalCatchment: selected.operationalCatchment,
operationalCatchmentId: selected.operationalCatchmentId,
type: selected.type
};

idField.value = selected.id;
nameField.value = selected.label;

const isWaterbody = selectedWaterBody.type === 'waterbody'
const isOperationalCatchment = selectedWaterBody.type === 'operationalCatchment'
const isManagementCatchment = selectedWaterBody.type === 'managementCatchment'
const params = new URLSearchParams({
selectedType: selectedWaterBody.type,
waterBodyName: isWaterbody ? selected.label : '',
waterBodyId: isWaterbody ? selected.id : '',
managementCatchment: isManagementCatchment ? selected.label : (selected.managementCatchment || ''),
managementCatchmentId: isManagementCatchment ? selected.id : (selected.managementCatchmentId || ''),
operationalCatchment: isOperationalCatchment ? selected.label : (isWaterbody ? selected.operationalCatchment || '' : ''),
operationalCatchmentId: isOperationalCatchment ? selected.id : (isWaterbody ? selected.operationalCatchmentId || '' : '')
});

window.location.href = '/internal/current/manual-overrides-summary?' + params.toString();
}
});
}