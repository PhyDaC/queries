/**
* A generic verifier function for PDC queries
* @author: Simon Diemert
* @date: 2015-05-07
*/

/*
* @param results - the results from running map reduce.
*
* @return an object, {result : boolean, message: String}
*	the result field is true if the results are as expected, false otherwise.
*	the message field contains a message which is displayed if the test fails
*/
function verify(results){

	try{

		if(results.length !== 2){

			return {result : false, message: "length of result was "+results.length+" not 2 as expected"};

		}

		if( results[0]["_id"] !== 'denominator_PROVIDER1' )
		{
			return {result : false, message: "id was " + results[0]["_id"] + " not denominator_PROVIDER1 as expected"};
		}
		else if( results[0].value !== 2 ){

			return {result : false, message: "denominator was " + results[0].value + " not 2 as expected"};
		}
		else if( results[1]["_id"] !== 'numerator_PROVIDER1' )
		{
			return {result : false, message: "id was " + results[1]["_id"] + " not numerator_PROVIDER1 as expected"};
		}
		else if( results[1].value !== 2 )
		{
			return {result : false, message: "numerator was " + results[1].value + " not 2 as expected"};
		}
		else
		{
			return {result : true, message: "test passed"};
		}

	}catch(e){

		return {result : false, message: "failed to read result"};

	}

	return {result : false, message: "test failed"};
}

module.exports = {
	verify: verify
};
