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
 placeholder="Search management catchments, operational catchments or waterbodies"
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
 <p class="govuk-body">
 <a class="govuk-link" href="#">
 ${catchment.name} (${catchment.type === 'managementCatchment' ? 'management catchment' : catchment.type === 'operationalCatchment' ? 'operational catchment' : 'waterbody'})
 </a>
 </p>
 `

 item.addEventListener('click', () => {

 const nameField = document.querySelector(
 '#selected-water-body-name'
 )

 if (nameField) {
 nameField.value = catchment.name
 }

const isWaterbody = catchment.type === 'waterbody'
const isOperationalCatchment = catchment.type === 'operationalCatchment'
const isManagementCatchment = catchment.type === 'managementCatchment'
const params = new URLSearchParams({
 selectedType: catchment.type,
 waterBodyName: isWaterbody ? catchment.name : '',
 waterBodyId: isWaterbody ? catchment.id : '',
 managementCatchment: isManagementCatchment ? catchment.name : (catchment.managementCatchment || ''),
 managementCatchmentId: isManagementCatchment ? catchment.id : (catchment.managementCatchmentId || ''),
 operationalCatchment: isOperationalCatchment ? catchment.name : (isWaterbody ? catchment.operationalCatchment || '' : ''),
 operationalCatchmentId: isOperationalCatchment ? catchment.id : (isWaterbody ? catchment.operationalCatchmentId || '' : '')
})

window.location.href = '/internal/current/manual-overrides-summary?' + params.toString()
 })
 results.appendChild(item)

 })

 })

})