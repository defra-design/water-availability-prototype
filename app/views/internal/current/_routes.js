const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
// Add your routes here - above the module.exports line
const folder = "/internal/current/"



//Start page
router.get(folder + 'start', function (request, response) {
    response.render(folder + 'start')
})

router.post('/start', function (request, response) {
    response.redirect(folder + 'intention')
})



module.exports = router