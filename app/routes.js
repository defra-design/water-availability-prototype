//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Add your routes here

//Resetting session data for UR
router.get('/ur', function(request, response) {
request.session.data = {}
response.render('ur')
})

router.post('/intention-answer', function(request, response) {
	var intention = request.session.data['intention']
	if (intention == "know-site"){
		response.redirect("/location")
	} else if (intention == "need-site"){
		response.redirect("/volume")
	}
})

/* router.post('/location-selection-answer', function(request, response) {

	var location_selection = request.session.data['location-selection']
	if (location_selection == "grid-ref"){
		response.redirect("/grid-ref")
	} else {
		response.redirect("/map")
	}
}) */

router.post('/do-you-know-volume-answer', function(request, response) {
	var do_you_know_volume = request.session.data['do-you-know-volume']
	if (do_you_know_volume == "yes"){
		response.redirect("/volume")
	} else {
		response.redirect("/results")
	}
})

router.post('/volume', function(request, response) {
	var intention = request.session.data['intention']
	if (intention == "know-site"){
		response.redirect("/results")
	} else {
		response.redirect("/catchment-picker")
	}
})

/* router.post('/outcome', function(request, response) {
	var availability = request.session.data['availability']
	if (availability == "no"){
		response.redirect("/no-results")
	} else {
		response.redirect("/results")
	}
}) */

/* router.post('/volume-method-answer', function(request, response) {

	var volume_method = request.session.data['volume-method']
	if (volume_method == "range"){
		response.redirect("/volume-range")
	} else {
		response.redirect("/volume-exact")
	}
}) */