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

module.exports = router