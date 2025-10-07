const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
// Add your routes here - above the module.exports line
const folder = "/sprint-1/"

//Resetting session data for UR
router.get('/ur', function(request, response) {
request.session.data = {}
response.render('ur')
})

//Doing versioning for set variables page
router.get('/set-variables', function(request, response) {
response.render(folder+'set-variables')
})

//Doing versioning for start page
router.get('/start', function(request, response) {
response.render(folder+'start')
})

//Doing versioning for intention page
router.get('/intention', function(request, response) {
response.render(folder+'intention')
})

//Doing versioning for location page
router.get('/location', function(request, response) {
response.render(folder+'location')
})

//Doing versioning for do you know volume page
router.get('/do-you-know-volume', function(request, response) {
response.render(folder+'do-you-know-volume')
})

//Doing versioning for volume page
router.get('/volume', function(request, response) {
response.render(folder+'volume')
})

//Doing versioning for catchment picker page
router.get('/catchment-picker', function(request, response) {
response.render(folder+'catchment-picker')
})

//Doing versioning for results page
router.get('/results', function(request, response) {
response.render(folder+'results')
})

//Doing versioning for detailed results page
router.get('/detailed-results', function(request, response) {
response.render(folder+'detailed-results')
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


    
module.exports = router