/**
* @author: Simon Diemert
* @date: 2015-04-22 
*/

/*
* @param results - the results from running map reduce. 
* 
* @return an object, {result : boolean, message: String}  
*	the result field is true if the results are as expected, false otherwise.
*	the message field contains a message which is displayed if the test fails
*/
function verify(results){

    if( results !== undefined && results !== null && results.length === 0 ){

        return { result : true, message : ""};

    }   

    return { result : false, message : "Unexpected number of results: "+ results.length+" should be 0 "};

}

module.exports = {
	verify: verify
}