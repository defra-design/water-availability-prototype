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

addFilter('PercentAvailAgg', function(x) {
    for(months of x) {
        month

    };
    return x;
});