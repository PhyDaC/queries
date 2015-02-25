// Reference Number: PDC-009
// Query Title: BMI or WC documented in last 2 yrs, age 19+

function map( patient ){
  // Store physician ID, via JSON key
  var pid = "_" + patient.json.primary_care_provider_id;

  // Target age range
  var ageMin = 19;

  // Store a list of recorded vital signs (CodedEntryList, API), patient object fn()
  var targetList = patient.targetListigns();

  // LOINC codes are used to reference our desired measurements
  // (Logical Observation Identifiers Names and Codes, http://search.loinc.org/)
  var targetWC ={ "LOINC": ["56115-9"] },        // Waist circumference
      targetBM ={ "LOINC": ["39156-5"] },        // BMI
      targetHt ={ "LOINC": ["8302-2"]  },        // Height
      targetWt ={ "LOINC": ["3141-9"]  };        // Weight

  // Target dates: ends now, started two years ago, empty date defaults to now
  var end   = new Date(),
      start = new Date( end.getFullYear() - 2, end.getMonth(), end.getDate() );

  // 1 or 0: patient in our age range?
  function checkDenominator(){
    return ageMin <= patient.age( end );
  }

  // 1 or 0: recorded waist circumference, BMI or (height && weight)?
  function checkTarget(){
    // API .match() returns matches (LOINCs) in CodedEntryList objects (targetList)
    var hasWCOrBMI = targetList.match( targetWC, start, end ).length || targetList.match( targetBM, start, end ).length;
    var hasHtAndWt = targetList.match( targetHt, start, end ).length && targetList.match( targetWt, start, end ).length;
    return hasWCOrBMI || hasHtAndWt;
  }

  // Numerator must be a member of denominator and target groups
  var inDen = checkDenominator();
  var inNum = inDen && checkTarget();
  emit( "denominator" + pid, inDen );
  emit( "numerator" + pid,   inNum );
}
