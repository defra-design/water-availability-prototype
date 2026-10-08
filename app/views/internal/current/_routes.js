const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const folder = '/internal/current/'

router.use((request, response, next) => {
 response.locals.internalCurrent = true
 response.locals.internalStartPage = request.originalUrl.split('?')[0] === folder + 'start'
 response.locals.internalSignedInEmail = request.session.data.email || ''
 next()
})

router.get('/sign-out', (request, response) => {
 request.session.data.email = ''
 response.redirect(folder + 'start')
})

const getCatchmentChildren = async (type, catchmentName, catchmentId) => {
 const id = String(catchmentId || '').trim()
 const name = String(catchmentName || '').trim()

 if (!id && !name) {
   return []
 }

 const isManagementCatchment = type === 'managementCatchment'
 const idField = isManagementCatchment ? 'MANCAT_ID' : 'OPCAT_ID'
 const nameField = isManagementCatchment ? 'MNCAT_NAME' : 'OPCAT_NAME'
 const childIdField = isManagementCatchment ? 'OPCAT_ID' : 'WB_ID'
 const childNameField = isManagementCatchment ? 'OPCAT_NAME' : 'WB_NAME'
 const whereClause = id
   ? `UPPER(${idField}) = '${id.toUpperCase()}'`
   : `UPPER(${nameField}) = '${name.toUpperCase()}'`

 const url =
 'https://services1.arcgis.com/JZM7qJpmv7vJ0Hzx/ArcGIS/rest/services/' +
 'WFD_Cycle_2_River_catchment_classification/' +
 'FeatureServer/5/query?' +
 'where=' +
 encodeURIComponent(whereClause) +
 '&outFields=WB_ID,WB_NAME,MANCAT_ID,MNCAT_NAME,OPCAT_ID,OPCAT_NAME' +
 '&returnGeometry=false' +
 '&f=pjson'

 const response = await fetch(url)
 const data = await response.json()
 const seen = new Set()

 return (data.features || [])
   .map(feature => feature.attributes || {})
   .filter(attrs => attrs[childIdField] && attrs[childNameField])
   .filter(attrs => {
     const key = attrs[childIdField]
     if (seen.has(key)) {
       return false
     }

     seen.add(key)
     return true
   })
   .map(attrs => ({
     id: attrs[childIdField],
     name: attrs[childNameField]
   }))
}

router.get('/hello', (req, res) => {
 res.send('Hello world')
})

const normalizeText = value =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

const levenshteinDistance = (a, b) => {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }

  return matrix[a.length][b.length]
}

const matchesQuery = (fieldValue, queryText) => {
  const value = String(fieldValue || '')
  const exact = value.toUpperCase().includes(queryText)

  if (exact) {
    return true
  }

  const normalizedValue = normalizeText(value)
  const normalizedQuery = normalizeText(queryText)

  if (!normalizedValue || !normalizedQuery || normalizedValue.length < 4) {
    return false
  }

  const maxLength = Math.max(normalizedValue.length, normalizedQuery.length)
  const distance = levenshteinDistance(normalizedValue, normalizedQuery)
  const similarity = 1 - (distance / maxLength)

  return similarity >= 0.75
}

router.get('/api/catchments/search', async (req, res) => {

 try {

 const query = req.query.q || ''

 if (query.length < 3) {
 return res.json([])
 }

 const queryText = query.trim().toUpperCase()
 const exactUrl =
 'https://services1.arcgis.com/JZM7qJpmv7vJ0Hzx/ArcGIS/rest/services/' +
 'WFD_Cycle_2_River_catchment_classification/' +
 'FeatureServer/5/query?' +
 'where=' +
 encodeURIComponent(
 `UPPER(WB_NAME) LIKE '%${queryText}%' OR UPPER(OPCAT_NAME) LIKE '%${queryText}%' OR UPPER(MNCAT_NAME) LIKE '%${queryText}%'`
 ) +
 '&outFields=WB_ID,WB_NAME,MANCAT_ID,MNCAT_NAME,OPCAT_ID,OPCAT_NAME' +
 '&returnGeometry=false' +
 '&f=pjson'

 const response = await fetch(exactUrl)
 const exactData = await response.json()
 const seen = new Set()
 const results = []

 ;(exactData.features || []).forEach(feature => {
   const attrs = feature.attributes || {}
   const fields = [
    { value: attrs.WB_NAME, type: 'waterbody', id: attrs.WB_ID },
    { value: attrs.OPCAT_NAME, type: 'operationalCatchment', id: attrs.OPCAT_ID },
    { value: attrs.MNCAT_NAME, type: 'managementCatchment', id: attrs.MANCAT_ID }
   ]

   fields.forEach(field => {
     const value = field.value

     if (!value || !matchesQuery(value, queryText)) {
       return
     }

     const key = `${field.type}:${value}`

     if (seen.has(key)) {
       return
     }

     seen.add(key)

     results.push({
       id: field.id || value,
       name: value,
      managementCatchment: attrs.MNCAT_NAME || '',
      managementCatchmentId: attrs.MANCAT_ID || '',
       operationalCatchment: attrs.OPCAT_NAME || value,
      operationalCatchmentId: attrs.OPCAT_ID || '',
       type: field.type
     })
   })
 })

 if (results.length > 0) {
   return res.json(results)
 }

 const fallbackUrl =
 'https://services1.arcgis.com/JZM7qJpmv7vJ0Hzx/ArcGIS/rest/services/' +
 'WFD_Cycle_2_River_catchment_classification/' +
 'FeatureServer/5/query?' +
 'where=1%3D1' +
 '&outFields=WB_ID,WB_NAME,MANCAT_ID,MNCAT_NAME,OPCAT_ID,OPCAT_NAME' +
 '&returnGeometry=false' +
 '&resultRecordCount=5000' +
 '&f=pjson'

 const fallbackResponse = await fetch(fallbackUrl)
 const fallbackData = await fallbackResponse.json()

 ;(fallbackData.features || []).forEach(feature => {
   const attrs = feature.attributes || {}
   const fields = [
    { value: attrs.WB_NAME, type: 'waterbody', id: attrs.WB_ID },
    { value: attrs.OPCAT_NAME, type: 'operationalCatchment', id: attrs.OPCAT_ID },
    { value: attrs.MNCAT_NAME, type: 'managementCatchment', id: attrs.MANCAT_ID }
   ]

   fields.forEach(field => {
     const value = field.value

     if (!value || !matchesQuery(value, queryText)) {
       return
     }

     const key = `${field.type}:${value}`

     if (seen.has(key)) {
       return
     }

     seen.add(key)

     results.push({
       id: field.id || value,
       name: value,
      managementCatchment: attrs.MNCAT_NAME || '',
      managementCatchmentId: attrs.MANCAT_ID || '',
       operationalCatchment: attrs.OPCAT_NAME || value,
      operationalCatchmentId: attrs.OPCAT_ID || '',
       type: field.type
     })
   })
 })

 return res.json(results)

 } catch (error) {

 console.error(error)

 return res.json([])

 }

})

//OVERRIDES
//const currentRoutes = require('./views/internal/current/_routes')
//router.use('/', currentRoutes)

router.get(folder + 'manual-overrides-summary', async function (request, response) {
	const querySelectedType = request.query.selectedType
	const queryWaterBodyName = request.query.waterBodyName || ''
  const queryManagementCatchment = request.query.managementCatchment || ''
  const queryManagementCatchmentId = request.query.managementCatchmentId || ''
  const queryOperationalCatchment = request.query.operationalCatchment || ''
  const queryOperationalCatchmentId = request.query.operationalCatchmentId || ''
	const queryWaterBodyId = request.query.waterBodyId || ''

	const selectedType = querySelectedType ||
    (queryWaterBodyId ? 'waterbody' : (queryOperationalCatchmentId || queryOperationalCatchment ? 'operationalCatchment' : (queryManagementCatchmentId || queryManagementCatchment ? 'managementCatchment' : (request.session.data.selectedType || ''))))

	const waterBodyName = selectedType === 'waterbody' ? (queryWaterBodyName || request.session.data.waterBodyName || '') : ''
  const hasExplicitSelection = Boolean(querySelectedType)
  const managementCatchment = queryManagementCatchment || (hasExplicitSelection ? '' : request.session.data.managementCatchment || '')
  const managementCatchmentId = queryManagementCatchmentId || (hasExplicitSelection ? '' : request.session.data.managementCatchmentId || '')
  const operationalCatchment = queryOperationalCatchment || (hasExplicitSelection ? '' : request.session.data.operationalCatchment || '')
  const operationalCatchmentId = queryOperationalCatchmentId || (hasExplicitSelection ? '' : request.session.data.operationalCatchmentId || '')
	const waterBodyId = selectedType === 'waterbody' ? (queryWaterBodyId || request.session.data.waterBodyId || '') : ''
  const children = selectedType === 'managementCatchment' && (managementCatchment || managementCatchmentId)
    ? await getCatchmentChildren('managementCatchment', managementCatchment, managementCatchmentId)
    : selectedType === 'operationalCatchment' && (operationalCatchment || operationalCatchmentId)
      ? await getCatchmentChildren('operationalCatchment', operationalCatchment, operationalCatchmentId)
      : []

	request.session.data.selectedType = selectedType
	request.session.data.waterBodyName = selectedType === 'waterbody' ? waterBodyName : ''
  request.session.data.managementCatchment = managementCatchment
  request.session.data.managementCatchmentId = managementCatchmentId
  request.session.data.operationalCatchment = operationalCatchment
  request.session.data.operationalCatchmentId = operationalCatchmentId
	request.session.data.waterBodyId = selectedType === 'waterbody' ? waterBodyId : ''
	request.session.data.hierarchyChildren = children

	response.render(folder + 'manual-overrides-summary', {
		selectedType,
		waterBodyName,
    managementCatchment,
    managementCatchmentId,
    operationalCatchment,
    operationalCatchmentId,
		waterBodyId,
		hierarchyChildren: children,
		data: request.session.data
	})
})

router.post('/manual-overrides-summary', function (request, response) {
	const upDate = request.session.data['manual-overrides-summary']
	if (upDate == "updateAp") {
		response.redirect(folder + "update-ap")
	} else if (upDate == "updateHof") {
		response.redirect(folder + "update-hof")
	} else if (upDate == "updateLp") {
		response.redirect(folder + "update-lp")
	} else if (upDate == "updateCol") {
		response.redirect(folder + "update-col")
	} else if (upDate == "updateHmwb") {
		response.redirect(folder + "update-hmwb")
	}
})

router.post(folder + 'start', function (request, response) {
	request.session.data.email = request.body.email
	response.redirect(folder + 'catchment-search')
})

router.post(folder + 'update-ap', function (request, response) {
	request.session.data.updateAp = request.body.updateAp
	response.redirect(folder + 'manual-overrides-summary')
})

router.post(folder + 'update-col', function (request, response) {
	request.session.data.updateCol = request.body.updateCol
	response.redirect(folder + 'manual-overrides-summary')
})

router.post(folder + 'update-hof', function (request, response) {
	if (request.body.updateHof === 'custom') {
		request.session.data.updateHof = request.body.updateHofValue
	} else {
		request.session.data.updateHof = request.body.updateHof
	}
	response.redirect(folder + 'manual-overrides-summary')
})

module.exports = router