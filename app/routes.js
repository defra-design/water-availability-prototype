//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Add your routes here

// TABLE STUFF

// END TABLE STUFF

// Start folder specific routes
router.use('/sprint-5', require('./views/sprint-5/_routes'));
router.use('/sprint-4', require('./views/sprint-4/_routes'));
router.use('/sprint-3', require('./views/sprint-3/_routes'));
router.use('/sprint-2', require('./views/sprint-2/_routes'));
router.use('/sprint-1', require('./views/sprint-1/_routes'));
// current sprint, remember to add older sprint when adding a new folder!
router.use('/current', require('./views/current/_routes'));

module.exports = router