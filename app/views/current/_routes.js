const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
// Add your routes here - above the module.exports line
// Lookup table for water uses

const waterUses = {
  // CONSUMPTIVE
  'hydraulic-fracturing-fracking': {
    label: 'Hydraulic Fracturing (Fracking)',
    type: 'Consumptive'
  },
  'dust-suppression': {
    label: 'Dust Suppression',
    type: 'Consumptive'
  },
  'evaporative-cooling': {
    label: 'Evaporative Cooling',
    type: 'Consumptive'
  },
  'general-cooling-existing-licences-only-high-loss': {
    label: 'General Cooling (Existing Licences Only) (High Loss)',
    type: 'Consumptive'
  },
  'general-use-secondary-category-high-loss': {
    label: 'General Use Relating To Secondary Category (High Loss)',
    type: 'Consumptive'
  },
  'make-up-top-up-water': {
    label: 'Make-Up Or Top Up Water',
    type: 'Consumptive'
  },
  'spray-irrigation-direct': {
    label: 'Spray Irrigation - Direct',
    type: 'Consumptive'
  },
  'spray-irrigation-definition-order': {
    label: 'Spray Irrigation - Spray Irrigation Definition Order',
    type: 'Consumptive'
  },
  'spray-irrigation-storage': {
    label: 'Spray Irrigation - Storage',
    type: 'Consumptive'
  },
  'trickle-irrigation-direct': {
    label: 'Trickle Irrigation - Direct',
    type: 'Consumptive'
  },
  'trickle-irrigation-under-cover-containers': {
    label: 'Trickle Irrigation - Under Cover/Containers',
    type: 'Consumptive'
  },
  'trickle-irrigation-storage': {
    label: 'Trickle Irrigation - Storage',
    type: 'Consumptive'
  },
  'animal-watering-non-farming': {
    label: 'Animal Watering & General Use In Non Farming Situations',
    type: 'Consumptive'
  },
  'boiler-feed': {
    label: 'Boiler Feed',
    type: 'Consumptive'
  },
  'conveying-materials': {
    label: 'Conveying Materials',
    type: 'Consumptive'
  },
  'drinking-etc-commercial': {
    label: 'Drinking, Cooking, Sanitary, Washing, (Small Garden) - Commercial/Industrial/Public Services',
    type: 'Consumptive'
  },
  'general-process-washing': {
    label: 'General Washing/Process Washing',
    type: 'Consumptive'
  },
  'drinking-etc-household': {
    label: 'Drinking, Cooking, Sanitary, Washing, (Small Garden) - Household',
    type: 'Consumptive'
  },
  'gas-suppression-scrubbing': {
    label: 'Gas Suppression/Scrubbing',
    type: 'Consumptive'
  },
  'general-farming-domestic': {
    label: 'General Farming & Domestic',
    type: 'Consumptive'
  },
  'general-use-secondary-category-medium-loss': {
    label: 'General Use Relating To Secondary Category (Medium Loss)',
    type: 'Consumptive'
  },
  'horticultural-watering': {
    label: 'Horticultural Watering',
    type: 'Consumptive'
  },
  'large-garden-watering': {
    label: 'Large Garden Watering',
    type: 'Consumptive'
  },
  'laundry-use': {
    label: 'Laundry Use',
    type: 'Consumptive'
  },
  'potable-supply-direct': {
    label: 'Potable Water Supply - Direct',
    type: 'Consumptive'
  },
  'potable-supply-storage': {
    label: 'Potable Water Supply - Storage',
    type: 'Consumptive'
  },
  'process-water': {
    label: 'Process Water',
    type: 'Consumptive'
  },
  'raw-water-supply': {
    label: 'Raw Water Supply',
    type: 'Consumptive'
  },
  'spray-irrigation-anti-frost': {
    label: 'Spray Irrigation - Anti Frost',
    type: 'Consumptive'
  },
  'spray-irrigation-anti-frost-storage': {
    label: 'Spray Irrigation - Anti Frost Storage',
    type: 'Consumptive'
  },
  'water-bottling': {
    label: 'Water Bottling',
    type: 'Consumptive'
  },

  // NON-CONSUMPTIVE
  'general-cooling-existing-licences-only-low-loss': {
    label: 'General Cooling (Existing Licences Only) (Low Loss)',
    type: 'Non-consumptive'
  },
  'general-use-secondary-category-low-loss': {
    label: 'General Use Relating To Secondary Category (Low Loss)',
    type: 'Non-consumptive'
  },
  'mineral-washing': {
    label: 'Mineral Washing',
    type: 'Non-consumptive'
  },
  'non-evaporative-cooling': {
    label: 'Non-Evaporative Cooling',
    type: 'Non-consumptive'
  },
  'vegetable-washing': {
    label: 'Vegetable Washing',
    type: 'Non-consumptive'
  },
  'dewatering': {
    label: 'Dewatering',
    type: 'Non-consumptive'
  },
  'wet-fencing-agriculture': {
    label: 'Wet Fencing and Agriculture',
    type: 'Non-consumptive'
  },
  'effluent-slurry-dilution': {
    label: 'Effluent/Slurry Dilution',
    type: 'Non-consumptive'
  },
  'fish-farm-cress-pond-throughflow': {
    label: 'Fish Farm/Cress Pond Throughflow',
    type: 'Non-consumptive'
  },
  'fish-pass-canoe-pass': {
    label: 'Fish Pass/Canoe Pass',
    type: 'Non-consumptive'
  },
  'general-use-secondary-category-very-low-loss': {
    label: 'General Use Relating To Secondary Category (Very Low Loss)',
    type: 'Non-consumptive'
  },
  'heat-pump': {
    label: 'Heat Pump',
    type: 'Non-consumptive'
  },
  'hydraulic-rams': {
    label: 'Hydraulic Rams',
    type: 'Non-consumptive'
  },
  'hydraulic-testing': {
    label: 'Hydraulic Testing',
    type: 'Non-consumptive'
  },
  'hydroelectric-power-generation': {
    label: 'Hydroelectric Power Generation',
    type: 'Non-consumptive'
  },
  'lake-pond-throughflow': {
    label: 'Lake & Pond Throughflow',
    type: 'Non-consumptive'
  },
  'milling-water-power-non-electric': {
    label: 'Milling & Water Power Other Than Electricity Generation',
    type: 'Non-consumptive'
  },
  'pollution-remediation': {
    label: 'Pollution Remediation',
    type: 'Non-consumptive'
  },
  'river-recirculation': {
    label: 'River Recirculation',
    type: 'Non-consumptive'
  },
  'supply-to-canal-throughflow': {
    label: 'Supply To A Canal For Throughflow',
    type: 'Non-consumptive'
  },
  'supply-to-leat-throughflow': {
    label: 'Supply To A Leat For Throughflow',
    type: 'Non-consumptive'
  },
  'transfer-between-sources-pre-2003': {
    label: 'Transfer Between Sources (Pre Water Act 2003)',
    type: 'Non-consumptive'
  },
  'water-wheels-not-used-for-power': {
    label: 'Water Wheels Not Used For Power',
    type: 'Non-consumptive'
  },
  'flood-irrigation-water-meadows-warping': {
    label: 'Flood Irrigation, Including Water Meadows, Warping And Pest Control',
    type: 'Non-consumptive'
  },
  'wet-fencing-nature-conservation': {
    label: 'Wet Fencing And Nature Conservation',
    type: 'Non-consumptive'
  },
  'transfer-between-sources-post-2003': {
    label: 'Transfer Between Sources (Post Water Act 2003)',
    type: 'Non-consumptive'
  },
  'impounding-excluding-hep': {
    label: 'Impounding (for any purpose excluding impounding for HEP)',
    type: 'Non-consumptive'
  }
};



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
	response.redirect(folder + 'exemption')
})



//Usage autocomplete page



// Handle POST from the water use page
router.post('/usage-autocomplete', function (req, res) {
	var newExisting = req.session.data['new-existing']
	
  const key = req.session.data['water-use']; // from the select

  const info = waterUses[key];

  if (info) {
    req.session.data['water-use-label'] = info.label;
    req.session.data['water-use-type'] = info.type;
  } else {
    // Optional: handle missing/unknown key
    req.session.data['water-use-label'] = key;
    req.session.data['water-use-type'] = '';
  }

  // Redirect to whatever page you want next
  
		res.redirect(folder + "duration")
	

});

//exemption page
router.get(folder + 'exemption', function (request, response) {
	response.render(folder + 'exemption')
})

router.post('/exemption', function (request, response) {
var eXemption = request.session.data['exemption']
	if (eXemption == "yes") {
		response.redirect(folder + "exempt-results")
	} else {
        response.redirect(folder + "usage-autocomplete")
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