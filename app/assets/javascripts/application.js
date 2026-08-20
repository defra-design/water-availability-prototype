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

 const catchments = [
 {
 id: '1',
 name: 'River Kennet'
 },
 {
 id: '2',
 name: 'River Thames'
 },
 {
 id: '3',
 name: 'River Loddon'
 }
 ]

 input.addEventListener('input', () => {

 const query = input.value.toLowerCase()

 results.innerHTML = ''

 const matches = catchments.filter(
 catchment =>
 catchment.name
 .toLowerCase()
 .includes(query)
 )

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
 encodeURIComponent(catchment.name)

 })

 results.appendChild(item)

 })

 })

})