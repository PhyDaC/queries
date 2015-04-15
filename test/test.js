/**
* Testing tool for Query development 
*
* @author: Simon Diemert
* @date: 2015-04-15
*
* This tool is used to run tests for the queries that are meant to run 
* on the PDC's network. It takes as input: 
* 	- A query map function (and any helper functions).
*	- A json file of the patients (conformant to patient api) to run the query on
*	- A file containing a single function that should be run to check the results. 
*		- This function should be called verify(results) and take a single parameter
*			which is the array of results from the map/reduce on the patient data. 
*/


//node_modules required for the test framework. 
//the are found in the test/node_modules dir. 

try{
	var mockReduce = require('mock-reduce'); 
	var mongoose = require('mongoose'); 
	var fs = require('fs'); 
	var parseArgs = require('minimist'); 
}catch(e){
	//empty catch. 	
	//mock-reduce and mongoose both require BSON
	// however BSON binary is not avaliable, errors
	// and shows that it is using PureJs version.
	// we can ignore this error for now. 
}
/*
* This is a stupid fix for executing queries.....ugh
* We need to combine the patient.js and map.js files together
* as they have dependencies. 
* This problem is due to poor architecture on the endpoint and hub
* and is required to test the queries correctly. 
* 
* @param {string} map_path - the path the query map function to use
* @param {string} api_path - the path to the patient api
*
* @returns {string} the file path to the new test
*
* Steps: 
*	1. create a new file in the test directory
*	2. copy over the patientapi
*	3. copy over the map function
*	4. required module exports so that we can load it. 
*	5. return the path to the new js file that can be used be
*	 	by the map reduce. 
*/
function createMapFunction(map_path, api_path){

	//make a new directory to work in. 
	if (!fs.existsSync("./tmp")){
		fs.mkdirSync("./tmp"); 
	}

	//get the text in the map_path file. 
	var map = fs.readFileSync(map_path);


	//get the text in the api_path file.
	var api = fs.readFileSync(api_path);

	var new_string = "";

	//need this for making the hQuery api visible globally. 
	new_string += "this.hQuery || (this.hQuery = {});\n"
	new_string += "var hQuery = this.hQuery\n"

	//now add the code the patient api. 
	new_string += api; 
	new_string += "//===============END OF PATIENT API \n\n\n"; 

	//now add the code for the query map function
	new_string += map; 
	new_string += "//===============END OF QUERY \n\n\n"; 

	//now make a new patient that is globally accessible so that
	//query has access. 
	new_string += "var patient = new hQuery.Patient(this);\n"; 

	//add module exports 
	new_string += " module.exports = { map : map, hQuery : this.hQuery, patient : patient};\n";

	//remove the output file if it exists. 
	if(fs.existsSync("./tmp/megafile.js")){
		fs.unlinkSync("./tmp/megafile.js"); 
	}
	fs.writeFileSync("./tmp/megafile.js", new_string); 

	return "./tmp/megafile.js"; 
}


/**
* Runs the query with test data and verifier specified by 
* the parameters. 
*
* @param queryMapPath - the path to the query file
* @param dataPath - the path to the data file for the query.
* @param verifierpath - path to the verifier function for the query. 
*/
function runQueryTest(queryMapPath, dataPath, verifierPath){
	
	//combine the patient api and query in a single file. 
	var megaModulePath = createMapFunction(queryMapPath, "./resources/patient.js"); 

	//open the single file with all of code for the query. 
	var megaModule = require(megaModulePath); 

	//load the specified test data. 
	var testData = JSON.parse(fs.readFileSync(dataPath, "utf8")); 

	//get the verifier module. 
	var verifier = require(verifierPath); 

	var patients = []; 

	var patient = null; 

	//loop through patients and create a patient object from the patient API
	for(var p in testData){
		patient = new megaModule.hQuery.Patient(testData[p]); 
		patients.push(patient); 
	}

	//create a blank Mongoose Schema for the MockReduce to operate on.
	var schema = mongoose.Schema({
		id: Number,
		patient: String
	});


	//set the methods for the Map/Reduce
	schema.statics.callsMapReduce = function() {
		var mapReduce = {
			map: function(){
				megaModule.map(this); 
			}, 
			reduce: function(key, values) {
				var s = 0; 
				values.forEach(function(d){
					s += d; 
				})
				return s; 
			}
		};
		return model.mapReduce(mapReduce);
	};

	//use MockReduce to spoof mongoDB and call the map/reduce
	mockReduce.install(mongoose); 
	mockReduce.setNextTestData(patients); 
	var model = mongoose.model('model', schema); 

	//call the map reduce using mock-reduce. 
	var result = model.callsMapReduce(); 

	//verify results using the user's defined 
	//verify function. 
	var accepted =  verifier.verify(result);	

	if(accepted == true){
		console.log("Test \""+queryMapPath+"\": PASSED"); 
	}else{
		console.log("Test \""+queryMapPath+"\": FAILED"); 
	}	

	return accepted;  
}

/*
* 
* Test environment cleanup. 
*
*/ 
function cleanup(){

	//any cleanup for the test environment can go here....
}


/*
* Reads the cmd line arguments and returns an object 
* with paths to the  query, data, and verifier for the test. 
*
* @return an object containing paths to the query, data, and verifier. 
*/
function processArguments(){
	
	var actions = {}; 

	var argv = parseArgs(process.argv); 

	if(argv.help != null || argv.h != null){
		//print the help log. 
		console.log("==========================="); 
		console.log("Help Message: "); 
		console.log("---------------------------"); 
		console.log("Correct Usage:  "); 
		console.log("	js test.js --query <path to query> --data <path to data> --verify <path to verify>\n"); 
		console.log("Arguments: "); 
		console.log("	-q (--query)	Specify the path to the query you want to execute."); 
		console.log("	-d (--data)		Specify the path to the test data"); 
		console.log("	-v (--verify)	Specify the path to the verifier function for this query."); 
		console.log("\nNotes: "); 
		console.log("	- If you are receving error messages about JavaScript not being "); 
		console.log("		able to open files try changing paths to:  './<path>'"); 
		console.log("==========================="); 
	}

	if(argv.query != null){
		actions.queryMap = argv.query; 
	}else if(argv.q != null){
		actions.queryMap = argv.q; 
	}else{
		console.log("No query was specified, use --query <path to query> or -q <path to query> "); 
		console.log("Run: 'js test.js -h' for help message."); 
	}

	if(argv.data != null){
		actions.data = argv.data; 
	}else if (argv.d != null){
		actions.d = argv.d; 
	}else{
		console.log("No input data was specified, use --data <path to data> or -q <path to data> "); 
		console.log("Run: 'js test.js -h' for help message."); 
	}

	if(argv.verify != null){
		actions.verify = argv.verify; 
	}else if (argv.d != null){
		actions.verify = argv.v; 
	}else{
		console.log("No verifier function was specified, use --verify <path to verifier> or -v <path to verifier> "); 
		console.log("Run: 'js test.js -h' for help message."); 
	}

	return actions; 
}

//main function, everything starts here.
function main(){

	console.log("----------------------------"); 
	console.log("Starting....");
	console.log("----------------------------"); 

	var actions = processArguments(); 

	//--------IF WE GET HERE WE HAVE FINISHED PARSING CMD LINE -------

	//Run the test for the given inputs. 
	runQueryTest(actions.queryMap, actions.data, actions.verify); 

	//clean up the environment. 
	cleanup(); 

	//print finished message
	console.log("----------------------------"); 
	console.log("Finished.");
	console.log("----------------------------"); 
}

//first action in the script, call main. 
main(); 
