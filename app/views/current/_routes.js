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
	response.redirect(folder + 'location')
})


//Intention page - looking for water in a location or trying to find a location
/* router.get(folder + 'intention', function (request, response) {
	response.render(folder + 'intention')
}) */

//if they know the site go to grid ref page if not skip grid ref and go to volume
/* router.post('/intention', function (request, response) {
	var intention = request.session.data['intention']
	if (intention == "know-site") {
		response.redirect(folder + "location")
	} else if (intention == "need-site") {
		response.redirect(folder + "volume")
	}
}) */


//Location page
router.get(folder + 'location', function (request, response) {
	response.render(folder + 'location')
})

router.post('/location', function (request, response) {
	response.redirect(folder + 'detailed-results')
})


//Do you know volume page
/* router.get(folder + 'do-you-know-volume', function (request, response) {
	response.render(folder + 'do-you-know-volume')
})
//if they know the volume then enter it, if not go straight to results
router.post('/do-you-know-volume', function (request, response) {
	var do_you_know_volume = request.session.data['do-you-know-volume']
	if (do_you_know_volume == "yes") {
		response.redirect(folder + "volume")
	} else {
		response.redirect(folder + "results")
	}
}) */


//Volume page
/* router.get(folder + 'volume', function (request, response) {
	response.render(folder + 'volume')
})

router.post('/volume', function (request, response) {
	response.redirect(folder + 'results')
}) */


//Catchment picker page
/* router.get(folder + 'catchment-picker', function (request, response) {
	response.render(folder + 'catchment-picker')
})

router.post('/catchment-picker', function (request, response) {
	response.redirect(folder + 'results')
}) */


//Results page
/* router.get(folder + 'results', function (request, response) {
	response.render(folder + 'results')
}) */


//Detailed results page
router.get(folder + 'detailed-results', function (request, response) {
	response.render(folder + 'detailed-results')
})



module.exports = router