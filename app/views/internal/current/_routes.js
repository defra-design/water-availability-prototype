const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const folder = '/internal/current/'

router.get('/hello', (req, res) => {
 res.send('Hello world')
})

router.get('/api/catchments/search', async (req, res) => {

 try {

 const query = req.query.q || ''

 if (query.length < 3) {
 return res.json([])
 }

 const url =
 'https://services1.arcgis.com/JZM7qJpmv7vJ0Hzx/ArcGIS/rest/services/' +
 'WFD_Cycle_2_River_catchment_classification/' +
 'FeatureServer/5/query?' +
 'where=' +
 encodeURIComponent(
 `UPPER(WB_NAME) LIKE '%${query.toUpperCase()}%'`
 ) +
 '&outFields=WB_ID,WB_NAME,MNCAT_NAME,OPCAT_NAME' +
 '&returnGeometry=false' +
 '&f=pjson'

 const response = await fetch(url)

 const data = await response.json()

 const results =
 data.features.map(feature => ({

 id:
 feature.attributes.WB_ID,

 name:
 feature.attributes.WB_NAME,

 managementCatchment:
 feature.attributes.MNCAT_NAME,

 operationalCatchment:
 feature.attributes.OPCAT_NAME

 }))

 return res.json(results)

 } catch (error) {

 console.error(error)

 return res.json([])

 }

})

//OVERRIDES
//const currentRoutes = require('./views/internal/current/_routes')
//router.use('/', currentRoutes)

router.get(folder + 'manual-overrides-summary', function (request, response) {
	response.render(folder + 'manual-overrides-summary')
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
	}
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