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
label: result.name
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
name: selected.label
};

idField.value = selected.id;
nameField.value = selected.label;
}
});
}