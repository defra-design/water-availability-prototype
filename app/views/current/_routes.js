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
var licenceHolder = request.session.data['licence-holder']
	if (licenceHolder == "yes") {
		response.redirect(folder + "new-or-existing-abstraction")
	} else if (licenceHolder == "no") {
		response.redirect(folder + "location")
	}
})


//new or existing abstraction point page
router.get(folder + 'new-or-existing-abstraction', function (request, response) {
	response.render(folder + 'new-or-existing-abstraction')
})

router.post('/new-or-existing-abstraction', function (request, response) {
var newExisting = request.session.data['new-existing']
	if (newExisting == "new") {
		response.redirect(folder + "location")
	} else if (newExisting == "existing") {
		response.redirect(folder + "licence-number")
	}

})

//licence number page
router.get(folder + 'licence-number', function (request, response) {
	response.render(folder + 'licence-number')
})

router.post('/licence-number', function (request, response) {
	response.redirect(folder + 'usage-autocomplete')
})

//abstraction type page
router.get(folder + 'abstraction-type', function (request, response) {
	response.render(folder + 'abstraction-type')
})

router.post('/abstraction-type', function (request, response) {
	response.redirect(folder + 'usage-autocomplete')
})


//Location use water page
router.get(folder + 'location', function (request, response) {
	response.render(folder + 'location')
})

router.post('/location', function (request, response) {
	response.redirect(folder + 'usage-autocomplete')
})



//Usage autocomplete page
router.get(folder + 'usage-autocomplete', function (request, response) {
	response.render(folder + 'usage-autocomplete')
})

router.post('/usage-autocomplete', function (request, response) {
	var newExisting = request.session.data['new-existing']
	if (newExisting == "existing") {
		response.redirect(folder + "duration")
	} else {
        response.redirect(folder + "exemption")
    }
})

//exemption page
router.get(folder + 'exemption', function (request, response) {
	response.render(folder + 'exemption')
})

router.post('/exemption', function (request, response) {
var eXemption = request.session.data['exemption']
	if (eXemption == "yes") {
		response.redirect(folder + "exempt-results")
	} else {
        response.redirect(folder + "duration")
    }
})

//exempt results page
router.get(folder + 'exempt-results', function (request, response) {
  
	response.render(folder + 'exempt-results')
})

router.post('/exempt-results', function (request, response) {
	response.redirect(folder + 'exempt-results')
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