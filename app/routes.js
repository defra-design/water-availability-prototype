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
router.use('/external/sprint-10', require('./views/external/sprint-10/_routes'));
router.use('/external/sprint-9', require('./views/external/sprint-9/_routes'));
router.use('/external/sprint-8', require('./views/external/sprint-8/_routes'));
router.use('/external/sprint-6', require('./views/external/sprint-6/_routes'));
router.use('/external/sprint-5', require('./views/external/sprint-5/_routes'));
router.use('/external/sprint-4', require('./views/external/sprint-4/_routes'));
router.use('/external/sprint-3', require('./views/external/sprint-3/_routes'));
router.use('/external/sprint-2', require('./views/external/sprint-2/_routes'));
router.use('/external/sprint-1', require('./views/external/sprint-1/_routes'));
// current sprint, remember to add older sprint when adding a new folder!
router.use('/external/current', require('./views/external/current/_routes'));
router.use('/internal/current', require('./views/internal/current/_routes'));

module.exports = router