const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const folder = '/internal/current/'

// Search stuff

router.get('/api/catchments/search', async (req, res) => {

 const query =
 (req.query.q || '').toLowerCase();

 const catchments = [
 {
 id: 'GB108039017280',
 name: 'River Kennet'
 },
 {
 id: 'GB106039023460',
 name: 'River Thames'
 },
 {
 id: 'GB106039030233',
 name: 'River Loddon'
 }
 ];

 const matches = catchments.filter(
 catchment =>
 catchment.name
 .toLowerCase()
 .includes(query)
 );

 res.json(matches);

});

module.exports = router