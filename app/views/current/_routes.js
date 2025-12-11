const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
// Add your routes here - above the module.exports line
// Lookup table for water uses

const axios = require('axios');
const proj4 = require('proj4');


const OSGB_PROJ = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs';

// Define the source (OSGB36) and target (WGS84) projections with proj4
const WGS84_PROJ = 'WGS84';
proj4.defs('EPSG:27700', OSGB_PROJ);



///////Functions/////////

//Convert NGR to easting and northing
function convertNGR(location) {

let gridRef = location

let gridLetters = "VWXYZQRSTULMNOPFGHJKABCDE";

let ref = gridRef.toString().replace(/\s/g, '').toUpperCase();

let majorEasting = gridLetters.indexOf(ref[0]) % 5  * 500000 - 1000000;
let majorNorthing = Math.floor(gridLetters.indexOf(ref[0]) / 5) * 500000 - 500000;

let minorEasting = gridLetters.indexOf(ref[1]) % 5  * 100000;
let minorNorthing = Math.floor(gridLetters.indexOf(ref[1]) / 5) * 100000;

let i = (ref.length-2) / 2;
let m = Math.pow(10, 5-i);

let easting = majorEasting + minorEasting + (ref.substr(2, i) * m);
let northing = majorNorthing + minorNorthing + (ref.substr(i+2, i) * m);

return {"easting": easting, "northing": northing,}

}

//Convert FieldNo to NGR
function convertFieldNo(location) {
let fieldNo = location
fieldNo = fieldNo.toString().replace(/\s/g, '').toUpperCase();
let NGR = fieldNo.substring(0, 4) + fieldNo.substring(6, 8) + fieldNo.substring(4, 6) + fieldNo.substring(8, 10)
return NGR
}


//Use proj4 to convert Easting and Northing to decimal latitude and longitude
function convertBNGToWGS84(easting, northing) {
    const bngCoordinates = [easting, northing];
    
    // Perform the transformation
    // proj4(source projection, target projection, coordinates)
    const wgs84Coordinates = proj4('EPSG:27700', WGS84_PROJ, bngCoordinates);
    
    // The result is [longitude, latitude]
    return wgs84Coordinates;
}

//Change postcode into easting and northing
async function convertPostcode(postcode, request, response) {
  const url = `https://api.postcodes.io/postcodes/${postcode.replace(/\s/g, "")}`;

  try {
    const response = await axios.get(url);
    const data = response.data.result;

    if (data && data.eastings && data.northings) {
    const   easting = data.eastings;
    const   northing = data.northings;

      console.log(`Postcode: ${postcode}`);
      console.log(`Easting: ${easting}`);
      console.log(`Northing: ${northing}`);

  
      return location = [ easting, northing ];
  
      
    } else {
      console.log(`Error: Could not find easting and northing for postcode ${postcode}`); 
      return request.session.data.error = `Error: Could not find easting and northing for postcode ${postcode}`;
      
    }

  } catch (error) {
    console.error(`API Request Failed: ${error.message}`);
    return request.session.data.error = `API Request Failed: ${error.response.data.error}`;
    
  }
}

//Get water body information
function getCatchment(request, response, geometry) {
  console.log("get catchment")
    //set params for the API call
 
  let session = request.session
  console.log(geometry);
  let config = {
    params: { "geometry": geometry,  } 
}

//API call
axios.get('https://services1.arcgis.com/JZM7qJpmv7vJ0Hzx/ArcGIS/rest/services/WFD_Cycle_2_River_catchment_classification/FeatureServer/5/query?where=1%3D1&objectIds=&time=&geometry&geometryType=esriGeometryPoint&inSR=&spatialRel=esriSpatialRelWithin&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=*&returnGeometry=true&returnCentroid=false&returnEnvelope=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson&token=', config)
.then(function(res) {
   session.return = res.data
 //console.log("Features "+ JSON.stringify(session.return, null, 2));
   if ( Object.keys(session.return.features).length) {
     request.session.data.riverCatchmentData = session.return.features[0]
     request.session.data.area = session.return.features[0].properties.AREA_NAME
     request.session.data.mnCatchment = session.return.features[0].properties.MNCAT_NAME
     request.session.data.opCatchment = session.return.features[0].properties.OPCAT_NAME
     request.session.data.riverBasin = session.return.features[0].properties.RBD_NAME
     request.session.data.waterBody = session.return.features[0].properties.WB_NAME
     request.session.data.catchmentGeometry = [session.return.features[0].properties.BB_MinX, session.return.features[0].properties.BB_MinY, session.return.features[0].properties.BB_MaxX, session.return.features[0].properties.BB_MaxY ];
 //  console.log("Catchment Geometry " +  request.session.data.catchmentGeometry );
  } else {
    console.log("Error - Water body not modelled for that location")
    request.session.data.error = "Water body not modelled for that location";
}})

  //API call
axios.get('https://services1.arcgis.com/JZM7qJpmv7vJ0Hzx/ArcGIS/rest/services/WFD_Cycle_3_Groundwater_body_classifications/FeatureServer/21/query?where=1%3D1&objectIds=&geometryType=esriGeometryPoint&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&outDistance=&relationParam=&returnGeodetic=false&outFields=*&returnGeometry=true&returnCentroid=false&returnEnvelope=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&collation=&orderByFields=&groupByFieldsForStatistics=&returnAggIds=false&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson&token=', config)
.then(function(res) {
   session.return = res.data
console.log("Features "+ JSON.stringify(session.return, null, 2));
   if ( Object.keys(session.return.features).length) {
     request.session.data.groundwaterCatchmentData = session.return.features[0]
 //  console.log("Catchment Geometry " +  request.session.data.catchmentGeometry );
  } else {
    console.log("Error - Groundwater body not modelled for that location")
    request.session.data.error = "Groundwater body not modelled for that location";
  }

  if ( Object.keys(session.return.features).length) {
response.redirect(folder + 'usage-autocomplete');}
 else { request.session.data.error = "Water body not modelled for that location" 
  response.redirect(folder + 'location');}


})}



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
		response.redirect(folder + "exemption")
	}
})

//exemption page
router.get(folder + 'exemption', function (request, response) {
	response.render(folder + 'exemption')
})

router.post('/exemption', function (request, response) {
var eXemption = request.session.data['exemption']
	if (eXemption == "no") {
		response.redirect(folder + "exempt-results")
	} else {
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
		response.redirect(folder + "exemption")
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


console.log(request.session.data.location)

let eastingNorthing = {}
let latLon = []
let geometry = ""

//convert field No to NGR
if(request.session.data.location == "fieldParcel") {
 //convert field number to NGR 
let ngr =  convertFieldNo(request.session.data.fieldParcel)
console.log(ngr)
request.session.data.ngr = ngr
//Convert NGR to easting and northing
eastingNorthing = convertNGR(ngr)
//convert easting and northing into decimal lat lon
latLon = convertBNGToWGS84(eastingNorthing.easting, eastingNorthing.northing);
console.log(latLon)
//set geometry in order to get the water body and catchment info
geometry = latLon[0] +','+ latLon[1]
//get the catchment data
getCatchment(request, response, geometry)
} else if (request.session.data.location == "postCode") {
//convert Postcode into Easting and Northing  
  convertPostcode(request.session.data.postCode, request, response).then(data => {
if (request.session.data.error) {response.redirect('location')} else {
   eastingNorthing = location
//convert Easting and Northing into Decimal LatLon
latLon = convertBNGToWGS84(eastingNorthing[0], eastingNorthing[1]);
console.log(latLon)
//set geometry in order to get the water body and catchment info
geometry = latLon[0] +','+ latLon[1]
//get the catchment data
getCatchment(request, response, geometry) }
 });
} else {
//convert NGR into Easting and Northing 
eastingNorthing = convertNGR(request.session.data.gridRef)
//convert Easting and Northing into Decimal LatLon
latLon = convertBNGToWGS84(eastingNorthing.easting, eastingNorthing.northing);
console.log(latLon)
//set geometry in order to get the water body and catchment info
geometry = latLon[0] +','+ latLon[1]
//get the catchment data
getCatchment(request, response, geometry)
}


	
})



// Handle POST from the water use page
router.post('/usage-autocomplete', function (request, response) {
	var newExisting = request.session.data['new-existing']
	
  const key = request.session.data['water-use']; // from the select

  const info = waterUses[key];

  if (info) {
    request.session.data['water-use-label'] = info.label;
    request.session.data['water-use-type'] = info.type;
  } else {
    // Optional: handle missing/unknown key
    request.session.data['water-use-label'] = key;
    request.session.data['water-use-type'] = '';
  }

  // Redirect to whatever page you want next
  
		response.redirect(folder + "duration")
	

});


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
	response.redirect(folder + 'summary')
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
	response.redirect(folder + 'summary')
})


//summary page
router.get(folder + 'summary', function (request, response) {
	response.render(folder + 'summary')
})

router.post('/summary', function (request, response) {
	response.redirect(folder + 'detailed-results')
})



//Detailed results page
router.get(folder + 'detailed-results', function (request, response) {
	response.render(folder + 'detailed-results')
})

router.post('/detailed-results', function (request, response) {
	response.redirect(folder + 'next-steps')
})

//next steps page
router.get(folder + 'next-steps', function (request, response) {
	response.render(folder + 'next-steps')
})



module.exports = router