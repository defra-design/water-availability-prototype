const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
// Add your routes here - above the module.exports line


const axios = require('axios');
const proj4 = require('proj4');


const OSGB_PROJ = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs';

// Define the source (OSGB36) and target (WGS84) projections with proj4
const WGS84_PROJ = 'WGS84';
proj4.defs('EPSG:27700', OSGB_PROJ);



// /////// Helper Functions /////////
/**
 * Calculates the distance between two points (Haversine formula)
 */
function getDistance(point1, point2) {
    if (!point1 || !point2) return Infinity;
    const [lon1, lat1] = point1;
    const [lon2, lat2] = point2;

    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * NEW: Calculates the bearing between two points in degrees (0-360)
 */
function getBearing(startPoint, endPoint) {
    const [lon1, lat1] = startPoint;
    const [lon2, lat2] = endPoint;

    const toRad = (deg) => deg * Math.PI / 180;
    const toDeg = (rad) => rad * 180 / Math.PI;

    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δλ = toRad(lon2 - lon1);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    let brng = toDeg(Math.atan2(y, x));
    return (brng + 360) % 360; // Normalize to 0-360
}

/**
 * NEW: Converts degrees to Cardinal direction
 */
function getCardinal(angle) {
    const directions = ['North', 'North East', 'East', 'South East', 'South', 'South West', 'West', 'North West'];
    const index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8;
    return directions[index];
}

/**
 * Ray Casting algorithm to check if point is inside a polygon ring
 */
function isPointInPolygon(point, vs) {
    if (!vs || !Array.isArray(vs) || vs.length === 0) return false;
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];
        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * UPDATED: Calculates shortest distance AND the specific closest point coordinate
 */
function distToSegment(p, a, b) {
    const x = p[0], y = p[1];
    const x1 = a[0], y1 = a[1];
    const x2 = b[0], y2 = b[1];

    const dx = x2 - x1;
    const dy = y2 - y1;

    // If segment is a point
    if (dx === 0 && dy === 0) {
        return { distance: getDistance(p, a), point: a };
    }

    // Calculate projection of p onto line segment ab
    let t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t)); // Clamp t to the range [0, 1]

    const closestPoint = [x1 + t * dx, y1 + t * dy];
    
    return { 
        distance: getDistance(p, closestPoint), 
        point: closestPoint 
    };
}

/**
 * Normalizes geometry to a MultiPolygon-style array
 */
function normalizeToPolygons(data) {
    if (!Array.isArray(data) || data.length === 0) return [];
    
    const getDepth = (arr) => Array.isArray(arr) ? 1 + getDepth(arr[0]) : 0;
    const depth = getDepth(data);

    if (depth === 3) return [data]; 
    if (depth === 4) return data;    
    return [];
}

/**
 * UPDATED: Main Function
 */
function findClosestWithHoles(targetPoint, data) {
    const polygons = normalizeToPolygons(data);
    let minDistance = Infinity;
    let nearestPointCoords = null; // Track where the nearest point is

    for (let pIdx = 0; pIdx < polygons.length; pIdx++) {
        const rings = polygons[pIdx];
        if (!rings || rings.length === 0) continue;

        // 1. Check if inside outer ring
        const isInsideOuter = isPointInPolygon(targetPoint, rings[0]);
        
        let isInsideHole = false;
        if (isInsideOuter) {
            // Check if it's inside any holes
            for (let h = 1; h < rings.length; h++) {
                if (isPointInPolygon(targetPoint, rings[h])) {
                    isInsideHole = true;
                    break;
                }
            }
        }

        // If inside the polygon and NOT in a hole
        if (isInsideOuter && !isInsideHole) {
            return { inside: true, distanceKm: 0, polygonIndex: pIdx, direction: null };
        }

        // 2. If not inside, calculate distance to nearest edge
        rings.forEach(ring => {
            for (let i = 0; i < ring.length - 1; i++) {
                // Now returns object { distance, point }
                const result = distToSegment(targetPoint, ring[i], ring[i+1]);
                
                if (result.distance < minDistance) {
                    minDistance = result.distance;
                    nearestPointCoords = result.point;
                }
            }
        });
    }

    // Calculate Direction
    let directionStr = null;
    let bearingDeg = null;
    
    if (nearestPointCoords && minDistance !== Infinity) {
        bearingDeg = getBearing(targetPoint, nearestPointCoords);
        directionStr = getCardinal(bearingDeg);
    }

    return {
        inside: false,
        distanceKm: minDistance === Infinity ? null : Number(minDistance.toFixed(4)),
        direction: directionStr, // e.g., "North East"
        bearing: bearingDeg !== null ? Math.round(bearingDeg) : null // e.g., 45
    };
  }

// Convert NGR to easting and northing
function convertNGR(location) {
    let gridRef = location;
    let gridLetters = "VWXYZQRSTULMNOPFGHJKABCDE";
    let ref = gridRef.toString().replace(/\s/g, '').toUpperCase();

    let majorEasting = gridLetters.indexOf(ref[0]) % 5 * 500000 - 1000000;
    let majorNorthing = Math.floor(gridLetters.indexOf(ref[0]) / 5) * 500000 - 500000;

    let minorEasting = gridLetters.indexOf(ref[1]) % 5 * 100000;
    let minorNorthing = Math.floor(gridLetters.indexOf(ref[1]) / 5) * 100000;

    let i = (ref.length - 2) / 2;
    let m = Math.pow(10, 5 - i);

    let easting = majorEasting + minorEasting + (ref.substr(2, i) * m);
    let northing = majorNorthing + minorNorthing + (ref.substr(i + 2, i) * m);

    return { easting: easting, northing: northing };
}

// Convert FieldNo to NGR
function convertFieldNo(location) {
    let fieldNo = location;
    fieldNo = fieldNo.toString().replace(/\s/g, '').toUpperCase();
    let NGR = fieldNo.substring(0, 4) + fieldNo.substring(6, 8) + fieldNo.substring(4, 6) + fieldNo.substring(8, 10);
    return NGR;
}

// Use proj4 to convert Easting and Northing to decimal latitude and longitude
function convertBNGToWGS84(easting, northing) {
    const bngCoordinates = [easting, northing];
    const wgs84Coordinates = proj4('EPSG:27700', WGS84_PROJ, bngCoordinates);
    return wgs84Coordinates; // Returns [longitude, latitude]
}

// Change postcode into easting and northing
// Returns a Promise that resolves to an object or throws an error
async function convertPostcode(postcode) {
    const url = `https://api.postcodes.io/postcodes/${postcode.replace(/\s/g, "")}`;

    try {
        const response = await axios.get(url);
        const data = response.data.result;

        if (data && data.eastings && data.northings) {
            return { easting: data.eastings, northing: data.northings };
        } else {
            throw new Error(`Could not find easting and northing for postcode ${postcode}`);
        }
    } catch (error) {
        console.error(`Postcode API Request Failed: ${error.message}`);
        throw new Error(`Invalid Postcode or API Error`);
    }
}

// Get water body information
// Returns a Promise with an object containing both surface and ground water data
// Get water body information with a Search Radius (Buffer)
async function getCatchmentData(geometry, searchRadius = 18) {
    console.log(`Fetching catchment data for ${geometry} with radius ${searchRadius}m`);

    const config = {
        params: { "geometry": geometry }
    };

    // We inject the 'searchRadius' into the 'distance' parameter of the API URL.
    // We also changed 'spatialRel' to 'esriSpatialRelIntersects' to ensure we catch anything touching our area.
    
    const surfaceWaterUrl = `https://services1.arcgis.com/JZM7qJpmv7vJ0Hzx/ArcGIS/rest/services/WFD_Cycle_2_River_catchment_classification/FeatureServer/5/query?where=1%3D1&objectIds=&time=&geometry&geometryType=esriGeometryPoint&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=${searchRadius}&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=*&returnGeometry=true&returnCentroid=false&returnEnvelope=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson&token=`;
    
    const groundWaterUrl = `https://services1.arcgis.com/JZM7qJpmv7vJ0Hzx/ArcGIS/rest/services/WFD_Cycle_3_Groundwater_body_classifications/FeatureServer/21/query?where=1%3D1&objectIds=&geometryType=esriGeometryPoint&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=${searchRadius}&units=esriSRUnit_Meter&outDistance=&relationParam=&returnGeodetic=false&outFields=*&returnGeometry=true&returnCentroid=false&returnEnvelope=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&collation=&orderByFields=&groupByFieldsForStatistics=&returnAggIds=false&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson&token=`;

    try {
        const [surfaceResponse, groundResponse] = await Promise.all([
            axios.get(surfaceWaterUrl, config),
            axios.get(groundWaterUrl, config)
        ]);

        return {
            surfaceWater: surfaceResponse.data,
            groundWater: groundResponse.data
        };

    } catch (error) {
        console.error("Catchment API Error:", error.message);
        throw new Error("Failed to retrieve catchment data");
    }
}


// Lookup table for water uses
const waterUses = {
  // CONSUMPTIVE
  'Animal watering and welfare': {
    label: 'Animal watering and welfare',
    type: 'Consumptive'
  },
  'Boiler feed': {
    label: 'Boiler feed',
    type: 'Consumptive'
  },
  'Conveying materials': {
    label: 'Conveying materials',
    type: 'Consumptive'
  },
  'Domestic purposes (commercial and non-commercial)': {
    label: 'Domestic purposes (commercial and non-commercial)',
    type: 'Consumptive'
  },
  'Drinking water (portable water) - direct and storage': {
    label: 'Drinking water (portable water) - direct and storage',
    type: 'Consumptive'
  },
  'Dust suppression': {
    label: 'Dust suppression',
    type: 'Consumptive'
  },
  'Evaporative cooling': {
    label: 'Evaporative cooling',
    type: 'Consumptive'
  },
  'Farming (except irrigation)': {
    label: 'Farming (except irrigation)',
    type: 'Consumptive'
  },
  'Fruit, vegetable and plant watering (horticultural watering)': {
    label: 'Fruit, vegetable and plant watering (horticultural watering)',
    type: 'Consumptive'
  },
  'Gas suppression or scrubbing': {
    label: 'Gas suppression or scrubbing',
    type: 'Consumptive'
  },
  'General or process washing': {
    label: 'General or process washing',
    type: 'Consumptive'
  },
  'Hydraulic fracturing (Fracking)': {
    label: 'Hydraulic fracturing (Fracking)',
    type: 'Consumptive'
  },
  'Ornamental garden watering (not irrigation)': {
    label: 'Ornamental garden watering (not irrigation)',
    type: 'Consumptive'
  },
  'Laundry use': {
    label: 'Laundry use',
    type: 'Consumptive'
  },
  'Make-up or top-up water': {
    label: 'Make-up or top-up water',
    type: 'Consumptive'
  },
  'Process water': {
    label: 'Process water',
    type: 'Consumptive'
  },
  'Raw water supply to third party': {
    label: 'Raw water supply to third party',
    type: 'Consumptive'
  },
  'Spray irrigration (application and/or storage)': {
    label: 'Spray irrigration (application and/or storage)',
    type: 'Consumptive'
  },
  'Trickle irrigation (including storage)': {
    label: 'Trickle irrigation (including storage)',
    type: 'Consumptive'
  },
  'Water bottling': {
    label: 'Water bottling',
    type: 'Consumptive'
  },

  // NON-CONSUMPTIVE
  'Creating and maintaining water meadows': {
    label: 'Creating and maintaining water meadows',
    type: 'Non-consumptive'
  },
  'Dewatering': {
    label: 'Dewatering',
    type: 'Non-consumptive'
  },
  'Effluent or slurry dilution': {
    label: 'Effluent or slurry dilution',
    type: 'Non-consumptive'
  },
  'Flood irrigation': {
    label: 'Flood irrigation',
    type: 'Non-consumptive'
  },
  'Heat pump': {
    label: 'Heat pump',
    type: 'Non-consumptive'
  },
  'Hydraulic rams and testing': {
    label: 'Hydraulic rams and testing',
    type: 'Non-consumptive'
  },
  'Hydroelectric power generation': {
    label: 'Hydroelectric power generation',
    type: 'Non-consumptive'
  },
  'Impounding (non-hydropower)': {
    label: 'Impounding (non-hydropower)',
    type: 'Non-consumptive'
  },
  'Milling and water power other than generating electricity': {
    label: 'Milling and water power other than generating electricity',
    type: 'Non-consumptive'
  },
  'Mineral washing': {
    label: 'Mineral washing',
    type: 'Non-consumptive'
  },
  'Non-evaporative cooling': {
    label: 'Non-evaporative cooling',
    type: 'Non-consumptive'
  },
  'Pollution remediation': {
    label: 'Pollution remediation',
    type: 'Non-consumptive'
  },
  'River recirculation': {
    label: 'River recirculation',
    type: 'Non-consumptive'
  },
  'Throughflows and passes (pond, lake, canal, leat, fish, canoe)': {
    label: 'Throughflows and passes (pond, lake, canal, leat, fish, canoe)',
    type: 'Non-consumptive'
  },
  'Transfer between sources (hydropower and Post Water Act 2003)': {
    label: 'Transfer between sources (hydropower and Post Water Act 2003)',
    type: 'Non-consumptive'
  },
  'Vegetable washing': {
    label: 'Vegetable washing',
    type: 'Non-consumptive'
  },
  'Water wheels not used for power': {
    label: 'Water wheels not used for power',
    type: 'Non-consumptive'
  },
  'Wet fencing': {
    label: 'Wet fencing',
    type: 'Non-consumptive'
  },
  'Nature conservation': {
    label: 'Nature conservation',
    type: 'Non-consumptive'
  }
};



const folder = "/current/"


//Resetting session data for UR
router.get(folder + 'ur', function (request, response) {
	request.session.data = {}
	response.render(folder + 'ur')
})



//water type page
//Set variables page
router.get(folder + 'water-type', function (request, response) {
	response.render(folder + 'water-type')
})

router.post('/water-type', function (request, response) {
  var waterType = request.session.data['watertype']
	response.redirect(folder + 'summary')
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
        response.redirect(folder + "usage-category")
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
	response.redirect(folder + 'usage-category')
})

//abstraction type page
router.get(folder + 'abstraction-type', function (request, response) {
	response.render(folder + 'abstraction-type')
})

router.post('/abstraction-type', function (request, response) {
	response.redirect(folder + 'usage-category')
})


//Location use water page
router.get(folder + 'location', function (request, response) {
    response.render(folder + 'location');
});

router.post('/location', async function (request, response) {
    request.session.data.error = "";
    console.log("Input Location:", request.session.data.location);
    
    //Clear any previous data
    request.session.data.riverCatchmentData = []
    request.session.data.groundwaterCatchmentData = []

    let eastingNorthing = {}; // Object {easting: x, northing: y}
    let latLon = [];
    let geometry = "";

    try {
        // 1. Determine Coordinates based on input type
        if (request.session.data.location == "fieldParcel") {
            // Convert field number to NGR
            let ngr = convertFieldNo(request.session.data.fieldParcel);
            console.log("NGR:", ngr);
            request.session.data.ngr = ngr;
            
            // Convert NGR to easting and northing
            eastingNorthing = convertNGR(ngr);

        } else if (request.session.data.location == "postCode") {
            // Await the postcode conversion
            eastingNorthing = await convertPostcode(request.session.data.postCode);
            
        } else {
            // Default: Grid Ref
            // Convert NGR into Easting and Northing
            eastingNorthing = convertNGR(request.session.data.gridRef);
        }

        // 2. Convert to WGS84 and format geometry
        // Ensure we actually have numbers
        if (!eastingNorthing.easting || !eastingNorthing.northing) {
            throw new Error("Invalid coordinates generated");
        }

        latLon = convertBNGToWGS84(eastingNorthing.easting, eastingNorthing.northing);
        console.log("LatLon:", latLon);
        geometry = latLon[0] + ',' + latLon[1];

        // 3. Get Catchment Data (Async)
        // 18m radius approx equals 1000m² area. 
        // You can increase this (e.g., 1800 = 10,000m2) if you want a wider net.
        const searchRadius = 1800;

        const catchmentResults = await getCatchmentData(geometry, searchRadius);
        
        // Process Surface Water
        let surfaceFeatures = catchmentResults.surfaceWater.features;
        if (surfaceFeatures && surfaceFeatures.length > 0) {
             
            for (const surfaceFeature of surfaceFeatures) {
             let target = [latLon[0], latLon[1]]
             let  pointsList = surfaceFeature.geometry.coordinates
             const result = findClosestWithHoles(target, pointsList);
            surfaceFeature.nearestPoint = result;
            console.log(result)
            }
            surfaceFeatures = surfaceFeatures.sort((a, b) => {
  return a.nearestPoint.distanceKm - b.nearestPoint.distanceKm;
});
            request.session.data.riverCatchmentData = surfaceFeatures;
        } else {
            console.log("Error - Surface water body not modelled for that location");
        }

        // Process Groundwater
        let groundFeatures = catchmentResults.groundWater.features;
        if (groundFeatures && groundFeatures.length > 0) {
            request.session.data.groundwaterCatchmentData = groundFeatures;
            for (const groundFeature of groundFeatures) {
             let target = [latLon[0], latLon[1]]
             let  pointsListGW = groundFeature.geometry.coordinates
             const resultGW = findClosestWithHoles(target, pointsListGW); 
            groundFeature.nearestPoint = resultGW;
                 console.log(resultGW)
            }
                        groundFeatures = groundFeatures.sort((a, b) => {
  return a.nearestPoint.distanceKm - b.nearestPoint.distanceKm;
});
            request.session.data.groundwaterCatchmentData = groundFeatures;
        } else {
            console.log("Error - Groundwater body not modelled for that location");
        }

        // 4. Final Redirect Logic
        // Check if we found valid data to decide where to redirect
        if ((surfaceFeatures && surfaceFeatures.length > 0) || (groundFeatures && groundFeatures.length > 0)) {
            response.redirect(folder + 'water-type');
        } else {
            request.session.data.error = "Water body not modelled for that location";
            response.redirect(folder + 'summary');
        }

    } catch (error) {
        console.error("Route Error:", error.message);
        request.session.data.error = error.message;
        response.redirect(folder + 'location');
    }
});

//Usage category page
router.get(folder + 'usage-category', function (request, response) {
	response.render(folder + 'usage-category')
})


router.post('/usage-category', function (request, response) {
	var usageCategory = request.session.data['usage-category']
	if (usageCategory == "farming") {
		response.redirect(folder + "usage-farming")
	} else if (usageCategory == "industrial") {
		response.redirect(folder + "usage-industrial")
	} else if (usageCategory == "conservation") {
		response.redirect(folder + "usage-conservation")
	} else if (usageCategory == "domestic") {
		response.redirect(folder + "usage-domestic")
	} else if (usageCategory == "energy") {
		response.redirect(folder + "usage-energy")
	} else if (usageCategory == "storage") {
		response.redirect(folder + "usage-storage")
	}
})



/// USAGE ROUTING ///

// Handle POST from the usage farming page
router.post('/usage-farming', function (request, response) {
	var newExisting = request.session.data['new-existing']
	var licenceHolder = request.session.data['licence-holder']

  const key = request.session.data['usage-farming']; // from the select
    console.log(key)

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
  
  if (newExisting == "new" || licenceHolder == "no") {
	response.redirect(folder + "location")
	} else if (newExisting == "existing") {
		response.redirect(folder + "summary")
	}
		
	
});

// Handle POST from the usage industrial page
router.post('/usage-industrial', function (request, response) {
	var newExisting = request.session.data['new-existing']
	var licenceHolder = request.session.data['licence-holder']

  const key = request.session.data['usage-industrial']; // from the select
    console.log(key)

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
  
	if (newExisting == "new" || licenceHolder == "no") {
	response.redirect(folder + "location")
	} else if (newExisting == "existing") {
		response.redirect(folder + "summary")
	}
	
});

// Handle POST from the usage conservation page
router.post('/usage-conservation', function (request, response) {
	var newExisting = request.session.data['new-existing']
	var licenceHolder = request.session.data['licence-holder']

  const key = request.session.data['usage-conservation']; // from the select
    console.log(key)

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
  
	if (newExisting == "new" || licenceHolder == "no") {
	response.redirect(folder + "location")
	} else if (newExisting == "existing") {
		response.redirect(folder + "summary")
	}
	
});

// Handle POST from the usage domestic page
router.post('/usage-domestic', function (request, response) {
	var newExisting = request.session.data['new-existing']
	var licenceHolder = request.session.data['licence-holder']

  const key = request.session.data['usage-domestic']; // from the select
    console.log(key)

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
  
	if (newExisting == "new" || licenceHolder == "no") {
	response.redirect(folder + "location")
	} else if (newExisting == "existing") {
		response.redirect(folder + "summary")
	}
	
});

// Handle POST from the usage energy page
router.post('/usage-energy', function (request, response) {
	var newExisting = request.session.data['new-existing']
	var licenceHolder = request.session.data['licence-holder']

  const key = request.session.data['usage-energy']; // from the select
    console.log(key)

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
  
	if (newExisting == "new" || licenceHolder == "no") {
	response.redirect(folder + "location")
	} else if (newExisting == "existing") {
		response.redirect(folder + "summary")
	}
	
});

// Handle POST from the usage storage page
router.post('/usage-storage', function (request, response) {
	var newExisting = request.session.data['new-existing']
	var licenceHolder = request.session.data['licence-holder']

  const key = request.session.data['usage-storage']; // from the select
    console.log(key)

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
  
	if (newExisting == "new" || licenceHolder == "no") {
	response.redirect(folder + "location")
	} else if (newExisting == "existing") {
		response.redirect(folder + "summary")
	}
	
});

//exempt results page
router.get(folder + 'exempt-results', function (request, response) {
  
	response.render(folder + 'exempt-results')
})

router.post('/exempt-results', function (request, response) {
	response.redirect(folder + 'exempt-results')
})

//duration page
// router.get(folder + 'duration', function (request, response) {
// 	response.render(folder + 'duration')
// })

// router.post('/duration', function (request, response) {
// 	response.redirect(folder + 'summary')
// })



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