var fs = require("fs");
var sys = require("sys");
var path = require("path");


// This test runner finds all x.test.js files or test-x.js files in a given path and runs them.
/* usage:

var TestRunner = require('../pact/TestRunner').TestRunner;
var path = require("path");
var sys = require("sys");
var fs = require("fs");

var runner = new TestRunner();
//runner.verbose = true;
runner.findTestModules(fs.realpathSync('.'));
runner.run();


*/

exports.TestRunner = function(){

	this.testFiles = [];
	this.suiteTests = [];
	this.failures = [];
	this.errors = [];
	this.verbose = false;

	this._isTest = function(filename){
		var retVal = false;
		if (this._stringEndsWith(filename, '.js')){
			if (this._stringEndsWith(filename, '.test.js')){
				return true;
			}
			if (this._stringStartsWith(filename, 'test-')){
				return true;
			}
		}
		return retVal;
	}
	
	this._stringEndsWith = function(str, sub){
		return (str.indexOf(sub) == str.length - sub.length);
	}

	this._stringStartsWith = function(str, sub){
		return (str.indexOf(sub) === 0);
	}
	
	this._isDirectory = function(filepath){
		var stat = fs.statSync(filepath);
		return stat.isDirectory();
	}

	this.findTestModules =  function(filepath){

		var files = fs.readdirSync(filepath);
		for(var i = 0; i < files.length; i++){
			if (this._isTest(files[i])){
				this.addFile(path.join(filepath, files[i]));
			}
		}
		for(var i = 0; i < files.length; i++){
			var fullpath = path.join(filepath, files[i]);
			if (this._isDirectory(fullpath)){
				this.findTestModules(fullpath);
			}
		}		
	}

	this.addFile = function(filename){
		if (this.testFiles.indexOf(filename) == -1){
			this.testFiles.push(filename);	
		}
	}
	
	this.addSuiteTest = function(filename, testname, testCallBack){
		this.addFile(filename);
		sys.puts("added test: " + filename + " : " + testname);
		this.suiteTests.push({filename:filename, testname:testname, testCallBack:testCallBack});
	}


	this._getTestsForSuite = function(filename){
		var suites = [];
		for (var i = 0; i < this.suiteTests.length; i++){
			var testObject = this.suiteTests[i];
			if (testObject.filename == filename){
				suites.push(testObject);
			}
			
		}
		return suites;
	}
	
	
	this._testModule = function(filepath){
		var testPath = filepath.substring(0, filepath.length - 3);
		var results = [];
		var ex = null;
		var result = 'pass';
		try {
			var testscope = require(testPath);
		} catch (ex){
			if (ex.name == "AssertionError"){
				result = 'fail';
				this.failures.push(ex);
			} else {
				result = 'error';
				this.errors.push(ex);
			}
		}
		
		results.push({name : '__main__', type : result, exception : ex});

		// if it is a test suite...
		if ((!!testscope) && (testscope.suite != null)){
			var tests = testscope.suite.tests;
			for(var x in tests){
				var ex = null;
				try {
					testscope.suite.setup();
					tests[x]();
					result = 'pass';
				} catch (ex) {
					if (ex.name == "AssertionError"){
						result = 'fail';
						this.failures.push(ex);
					} else {
						result = 'error';
						this.errors.push(ex);
					}
				}
				testscope.suite.teardown();

				results.push({name : x, type : result, exception : ex});
			}					
		}
		
		return results;
			
	}
	

	
	
	this.run = function(){
		var verbose = this.verbose;
		var errorCount = 0;
		var failureCount = 0;
		if (!verbose){ 
			for(var i = 0; i < this.testFiles.length; i++){
				sys.print("_");
			}	
		}
		sys.puts("");
		for(var i = 0; i < this.testFiles.length; i++){
			var results = this._testModule(this.testFiles[i]);

			for(var j = 0; j < results.length; j++){
				var result = results[j];
				if (verbose){
					if (result['name'] == '__main__') {
						sys.print((i + 1) + ": " + this.testFiles[i]);
					} else {
						sys.print(" - " + result['name']);
					}
				}
				switch (result['type']){
					case ('error'):
						errorCount = this.errors.length;
						if (verbose){
							sys.puts(" - ERROR");
						} else {
							sys.print("E");
						}
					break;
	
					case ('fail'):
						failureCount = this.failures.length;
						if (verbose){
							sys.puts(" - FAILURE");
						} else {
							sys.print("F");
						}
					break;
	
					default:
						if (verbose){
							sys.puts(" - PASS");
						} else {
							sys.print(".");
						}
				}
			}
		}

		this.printDetailReport();
		
	}

	this.printDetailReport = function(){
		sys.puts(this._getSummaryInfo());
		sys.puts("----------------------------------------");
		sys.puts(this._getErrorInfo());
		sys.puts("----------------------------------------");
		sys.puts(this._getFailureInfo());
		
	}
	
	
	this._getFailureInfo = function(){
		var retVal = "";
		var failureCount = this.failures.length;
		if (failureCount > 0){
			retVal += "Failures: " + failureCount + "\n";
			for(var i = 0; i < this.failures.length; i++){
				var failure = this.failures[i];
				retVal += failure.stack + "\n";
				retVal += "actual: " + failure['actual'] + ", expected: " + failure['expected'] + "\n";
				retVal += "----\n";
			}
		}	
		return retVal;
	}
	
	this._getErrorInfo = function(){
		var retVal = "";
		var errorCount = this.errors.length;;
		if (errorCount > 0){
			retVal += "Errors: " + errorCount + "\n";
			for(var i = 0; i < this.errors.length; i++){
				var error = this.errors[i];
				retVal += error.stack + "\n";
				retVal += "type: " + error['type'] + ", arguments: " + error['arguments'] + "\n";
				retVal += "----" + "\n";				
				
			}
		}	
		return retVal;
	}

	
	this._getSummaryInfo = function(){
		var retVal = "";
		var testCount = this.testFiles.length;
		var passCount = (testCount - this.failures.length - this.errors.length);
		retVal += "\n";
		retVal += "\n";
		if (passCount == testCount){
			retVal += " :)\n";
		} else {
			retVal += " :(\n";
		}
		retVal += "\n";
		retVal += (passCount / testCount * 100) + "% success \n";
		retVal += "Test Module Count : " + testCount + "\n";
		retVal += "Error Count : " + this.errors.length + "\n";
		retVal += "Failure Count : " + this.failures.length + "\n";
		return retVal;
	}	
	
	
	
}
