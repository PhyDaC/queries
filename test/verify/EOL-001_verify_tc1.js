/**
* A verifier function for the query: PDC-955_CHF
* 
* @author: Simon Diemert
* @date: 2015-05-07
*/

/*
* @param results - the results from running map reduce. 
* 
* @return an object, {result : boolean, message: String}  
*   the result field is true if the results are as expected, false otherwise.
*   the message field contains a message which is displayed if the test fails
*/
function verify(results){
    console.log(results); //***remove me before merge***
    if ( 
        results[0]._id === "PROVIDER1"  &&
        results[0].value === 2
    ){
       return {result: true}; 
    }else{

        return {result: false, message: "numerator and denominator was not as expected!"}

    }

}

module.exports = {
    verify: verify
}