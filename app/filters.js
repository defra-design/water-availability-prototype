//
// For guidance on how to create filters see:
// https://prototype-kit.service.gov.uk/docs/filters
//

const govukPrototypeKit = require('govuk-prototype-kit')
const addFilter = govukPrototypeKit.views.addFilter

// Add your filters here

addFilter('percentAvail', function(x,daysAvail, daysUnavail) {
    x= ((daysAvail/(daysAvail+daysUnavail))*100);
    return x;
});

addFilter('availColour', function(x) {
    if (x<=33) {
        x="govuk-tag--red"
    }
    else if (x>66) {
        x="govuk-tag--green"
    }
    else {
        x="govuk-tag--yellow"
    }
    return x;
});

addFilter('percentAvailAgg', function(x) {
    
    percentages = []
    for(months of x) {
        percentage = (months.daysAvail/(months.daysAvail+months.daysUnavail))*100
        percentages.push(percentage)
    };
    return percentages.reduce((a, b) => a + b, 0) / percentages.length;

});

addFilter('mToKmSquared', function(str) {
    // Convert string to number
    const metresSquared = parseFloat(str);

    // Handle cases where the input might not be a valid number
    if (isNaN(metresSquared)) {
        return '0.000';
    }

    // Convert to km2 (divide by 1,000,000)
    const kmSquared = metresSquared / 1000000;

    // Return as a string fixed to 3 decimal places
    return kmSquared.toFixed(3);
});

