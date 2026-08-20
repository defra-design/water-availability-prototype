window.GOVUKPrototypeKit.documentReady(() => {


 const container = document.querySelector('#water-search-container')

 if (!container) {
 return
 }

 container.innerHTML = `
 <input
 class="govuk-input"
 id="water-search"
 type="text"
 placeholder="Search for a catchment"
 >
 <ul id="water-search-results"></ul>
 `

 const input = document.querySelector('#water-search')
 const results = document.querySelector('#water-search-results')

let catchments = []

 input.addEventListener('input', async () => {

 const query = input.value.toLowerCase()

 if (query.length < 3) {
 results.innerHTML = ''
 return
}

const response = await fetch(
 '/api/catchments/search?q=' +
 encodeURIComponent(query)
)

catchments = await response.json()

 results.innerHTML = ''

 const matches = catchments

 matches.forEach(catchment => {

 const item = document.createElement('li')

 item.innerHTML = `
 <button type="button">
 ${catchment.name}
 </button>
 `

 item.addEventListener('click', () => {

 const nameField = document.querySelector(
 '#selected-water-body-name'
 )

 if (nameField) {
 nameField.value = catchment.name
 }

window.location.href =
 '/internal/current/manual-overrides-summary?waterBodyName=' +
 encodeURIComponent(catchment.name) +
 '&waterBodyId=' +
 encodeURIComponent(catchment.id) +
 '&managementCatchment=' +
 encodeURIComponent(catchment.managementCatchment) +
 '&operationalCatchment=' +
 encodeURIComponent(catchment.operationalCatchment)
 })
 results.appendChild(item)

 })

 })

})