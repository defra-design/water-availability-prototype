const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
// Add your routes here - above the module.exports line
const folder = "/current/"


//Resetting session data for UR
router.get(folder + 'ur', function (request, response) {
	request.session.data = {}
	response.render(folder + 'ur')
})



//Set variables page
router.get(folder + 'set-variables', function (request, response) {
	response.render(folder + 'set-variables')
})

router.post('/set-variables', function (request, response) {
	response.redirect(folder + 'start')
})



//Start page
router.get(folder + 'start', function (request, response) {
  
	response.render(folder + 'start')
})

router.post('/start', function (request, response) {
	response.redirect(folder + 'licence-holder')
})


//Existing licence holder
//Set variables page
router.get(folder + 'licence-holder', function (request, response) {
	response.render(folder + 'licence-holder')
})

router.post('/licence-holder', function (request, response) {
	response.redirect(folder + 'location')
})

//Location page
router.get(folder + 'location', function (request, response) {
	response.render(folder + 'location')
})

router.post('/location', function (request, response) {
	response.redirect(folder + 'location-abstract')
})

//Location abstract page
router.get(folder + 'location-abstract', function (request, response) {
	response.render(folder + 'location-abstract')
})

router.post('/location-abstract', function (request, response) {
	response.redirect(folder + 'usage-autocomplete')
})

//Usage autocomplete page
router.get(folder + 'usage-autocomplete', function (request, response) {
	response.render(folder + 'usage-autocomplete')
})

router.post('/usage-autocomplete', function (request, response) {
	response.redirect(folder + 'exemption')
})

//exemption page
router.get(folder + 'exemption', function (request, response) {
	response.render(folder + 'exemption')
})

router.post('/exemption', function (request, response) {
	response.redirect(folder + 'duration')
})

//duration page
router.get(folder + 'duration', function (request, response) {
	response.render(folder + 'duration')
})

router.post('/duration', function (request, response) {
	response.redirect(folder + 'detailed-results')
})


//Usage category page
router.get(folder + 'usage-category', function (request, response) {
	response.render(folder + 'usage-category')
})


router.post('/usage-category', function (request, response) {
	var usageCategory = request.session.data['usage-category']
	if (usageCategory == "farming") {
		response.redirect(folder + "usage-farming")
	} else if (usageCategory == "irrigation") {
		response.redirect(folder + "usage-irrigation")
	}
})

//Usage farming sub category page
router.get(folder + 'usage-farming', function (request, response) {
	response.render(folder + 'usage-farming')
})

router.post('/usage-farming', function (request, response) {
	response.redirect(folder + 'detailed-results')
})


//Detailed results page
router.get(folder + 'detailed-results', function (request, response) {
	response.render(folder + 'detailed-results')
})



module.exports = router