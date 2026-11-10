window.GOVUKPrototypeKit.documentReady(() => {

 document.querySelectorAll('[data-repeating-inputs]').forEach((container) => {
 const list = container.querySelector('[data-repeating-inputs-list]')
 const addButton = container.querySelector('[data-add-another]')
 const maxItems = Number(container.dataset.maxItems) || 10
 const firstInput = list.querySelector('input')
 const idPrefix = firstInput.id.replace(/-\d+$/, '')
 let itemCount = list.children.length
 let nextItemNumber = itemCount

 const updateAddButton = () => {
 addButton.disabled = itemCount >= maxItems
 }

 addButton.addEventListener('click', () => {
 if (itemCount >= maxItems) {
 return
 }

 itemCount += 1
 nextItemNumber += 1
 const item = document.createElement('div')
 item.className = 'govuk-form-group'
 item.dataset.repeatingInput = ''

 const label = document.createElement('label')
 label.className = 'govuk-label'
 label.htmlFor = `${idPrefix}-${nextItemNumber}`
 label.textContent = 'Implication'

 const input = document.createElement('input')
 input.className = 'govuk-input'
 input.id = `${idPrefix}-${nextItemNumber}`
 input.name = firstInput.name
 input.type = 'text'

 const removeButton = document.createElement('button')
 removeButton.className = 'govuk-button govuk-button--secondary'
 removeButton.type = 'button'
 removeButton.dataset.removeItem = ''
 removeButton.setAttribute('aria-label', `Remove implication ${nextItemNumber}`)
 removeButton.textContent = 'Remove'

 item.append(label, input, removeButton)
 list.append(item)
 updateAddButton()
 })

 list.addEventListener('click', (event) => {
 const removeButton = event.target.closest('[data-remove-item]')
 if (!removeButton) {
 return
 }

 removeButton.closest('[data-repeating-input]').remove()
 itemCount -= 1
 updateAddButton()
 })

 updateAddButton()
 })

 const container = document.querySelector('#water-search-container')

 if (!container) {
 return
 }

 container.innerHTML = `
 <input
 class="govuk-input"
 id="water-search"
 type="text"
 placeholder="Search management catchments, operational catchments or water bodies"
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
 ${catchment.name} (${catchment.type === 'managementCatchment' ? 'management catchment' : catchment.type === 'operationalCatchment' ? 'operational catchment' : 'water body'})
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

const internalPrefix = window.location.pathname.startsWith('/internal/sprint-12/')
  ? '/internal/sprint-12'
  : '/internal/current'
window.location.href = internalPrefix + '/manual-overrides-summary?' + params.toString()
 })
 results.appendChild(item)

 })

 })

})