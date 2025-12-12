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
response.redirect(folder + 'usage');}
 else { request.session.data.error = "Water body not modelled for that location" 
  response.redirect(folder + 'location');}


})}



const waterUses = {
  // CONSUMPTIVE
  'animal-watering-and-welfare': {
    label: 'Animal watering and welfare',
    type: 'Consumptive'
  },
  'boiler-feed': {
    label: 'Boiler feed',
    type: 'Consumptive'
  },
  'conveying-materials': {
    label: 'Conveying materials',
    type: 'Consumptive'
  },
  'domestic-purposes-commercial': {
    label: 'Domestic purposes (commercial)',
    type: 'Consumptive'
  },
  'domestic-purposes-non-commercial': {
    label: 'Domestic purposes (non‐commercial)',
    type: 'Consumptive'
  },
  'dust-suppression': {
    label: 'Dust suppression',
    type: 'Consumptive'
  },
  'evaporative-cooling': {
    label: 'Evaporative cooling',
    type: 'Consumptive'
  },
  'gas-suppression-or-scrubbing': {
    label: 'Gas suppression or scrubbing',
    type: 'Consumptive'
  },
  'general-farming-except-irrigation-and-domestic': {
    label: 'General farming (except irrigation) and domestic',
    type: 'Consumptive'
  },
  'general-or-process-washing': {
    label: 'General or process washing',
    type: 'Consumptive'
  },
  'general-washing-down': {
    label: 'General washing down',
    type: 'Consumptive'
  },
  'heat-transfer': {
    label: 'Heat transfer',
    type: 'Consumptive'
  },
  'horticulture': {
    label: 'Horticulture',
    type: 'Consumptive'
  },
  'irrigation': {
    label: 'Irrigation',
    type: 'Consumptive'
  },
  'land-drainage': {
    label: 'Land drainage',
    type: 'Consumptive'
  },
  'landfill-leachate-suppression': {
    label: 'Landfill leachate suppression',
    type: 'Consumptive'
  },
  'laundering': {
    label: 'Laundering',
    type: 'Consumptive'
  },
  'non-potable-public-water-supply': {
    label: 'Non potable public water supply',
    type: 'Consumptive'
  },
  'paper-making': {
    label: 'Paper making',
    type: 'Consumptive'
  },
  'potable-public-water-supply': {
    label: 'Portable public water supply',
    type: 'Consumptive'
  },
  'power-station': {
    label: 'Power station',
    type: 'Consumptive'
  },
  'process-water': {
    label: 'Process water',
    type: 'Consumptive'
  },
  'public-water-supply': {
    label: 'Public water supply',
    type: 'Consumptive'
  },
  'quenching': {
    label: 'Quenching',
    type: 'Consumptive'
  },
  'rainwater-harvesting': {
    label: 'Rainwater harvesting',
    type: 'Consumptive'
  },
  'refrigeration-and-air-conditioning': {
    label: 'Refrigeration and air conditioning',
    type: 'Consumptive'
  },
  'slurry-making': {
    label: 'Slurry making',
    type: 'Consumptive'
  },
  'steam-raising': {
    label: 'Steam raising',
    type: 'Consumptive'
  },

  // NON-CONSUMPTIVE
  'dewatering': {
    label: 'Dewatering',
    type: 'Non-consumptive'
  },
  'effluent-or-slurry-dilution': {
    label: 'Effluent or slurry dilution',
    type: 'Non-consumptive'
  },
  'fish-farm-throughflow': {
    label: 'Fish farm throughflow',
    type: 'Non-consumptive'
  },
  'fish-pass-canoe-pass': {
    label: 'Fish pass/canoe pass',
    type: 'Non-consumptive'
  },
  'heat-pump': {
    label: 'Heat pump',
    type: 'Non-consumptive'
  },
  'hydraulic-testing': {
    label: 'Hydraulic testing',
    type: 'Non-consumptive'
  },
  'hydrostatic-testing': {
    label: 'Hydrostatic testing',
    type: 'Non-consumptive'
  },
  'impounding': {
    label: 'Impounding',
    type: 'Non-consumptive'
  },
  'lake-or-pond-throughflow': {
    label: 'Lake or pond throughflow',
    type: 'Non-consumptive'
  },
  'mains-flushing': {
    label: 'Mains flushing',
    type: 'Non-consumptive'
  },
  'mine-dewatering': {
    label: 'Mine dewatering',
    type: 'Non-consumptive'
  },
  'mineral-washing': {
    label: 'Mineral washing',
    type: 'Non-consumptive'
  },
  'nature-conservation': {
    label: 'Nature conservation',
    type: 'Non-consumptive'
  },
  'other-consumptive': {
    label: 'Other (consumptive)',
    type: 'Non-consumptive'
  },
  'other-non-consumptive': {
    label: 'Other (non consumptive)',
    type: 'Non-consumptive'
  },
  'reservoir-augmentation': {
    label: 'Reservoir augmentation',
    type: 'Non-consumptive'
  },
  'sewer-flushing': {
    label: 'Sewer flushing',
    type: 'Non-consumptive'
  },
  'spray-irrigation': {
    label: 'Spray irrigation',
    type: 'Non-consumptive'
  },
  'suppression': {
    label: 'Suppression',
    type: 'Non-consumptive'
  },
  'sweeping': {
    label: 'Sweeping',
    type: 'Non-consumptive'
  },
  'tanker-loading': {
    label: 'Tanker loading',
    type: 'Non-consumptive'
  },
  'temperature-control': {
    label: 'Temperature control',
    type: 'Non-consumptive'
  },
  'transfer-between-sources-consumptive': {
    label: 'Transfer between sources (consumptive)',
    type: 'Non-consumptive'
  },
  'transfer-between-sources-hydropower': {
    label: 'Transfer between sources (hydropower)',
    type: 'Non-consumptive'
  },
  'vegetable-washing': {
    label: 'Vegetable washing',
    type: 'Non-consumptive'
  },
  'water-wheels-not-used-for-power': {
    label: 'Water wheels not used for power',
    type: 'Non-consumptive'
  },
  'wet-fencing': {
    label: 'Wet fencing',
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
	response.redirect(folder + 'usage')
})

//abstraction type page
router.get(folder + 'abstraction-type', function (request, response) {
	response.render(folder + 'abstraction-type')
})

router.post('/abstraction-type', function (request, response) {
	response.redirect(folder + 'usage')
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
router.post('/usage', function (request, response) {
	var newExisting = request.session.data['new-existing']
	
  const key = request.session.data['water_use']; // from the select


  const info = waterUses[key];

    console.log(info)

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