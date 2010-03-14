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
runner.findTests(fs.realpathSync('.'));
runner.run();


*/
exports.TestRunner = function(){

	this.testFiles = [];
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

	this.findTests =  function(filepath){
		var files = fs.readdirSync(filepath);
		for(var i = 0; i < files.length; i++){
			if (this._isTest(files[i])){
				this.addFile(path.join(filepath, files[i]));
			}
		}
		for(var i = 0; i < files.length; i++){
			var fullpath = path.join(filepath, files[i]);
			if (this._isDirectory(fullpath)){
				this.findTests(fullpath);
			}
		}		
	}

	this.addFile = function(filename){
		this.testFiles.push(filename);	
	}
	
	this._runTest = function(filepath){
		
		var testPath = filepath.substring(0, filepath.length - 3);
		try {
			require(testPath);
		} catch (e){
			if (e.name == "AssertionError"){
				this.failures.push(e);
			} else {
				this.errors.push(e);
			}
		}
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
		retVal += "Total Tests: " + testCount + "\n";	
		return retVal;
	}
	
	this.run = function(){
		var verbose = this.verbose;
		var errorCount = 0;
		var failureCount = 0;
		if (!verbose){ 
			for(var i = 0; i < this.testFiles.length; i++){
				sys.print("_");
			}	
		} else {
			sys.puts("Attempting to run " + this.testFiles.length + " tests.");
		}
		sys.puts("");
		for(var i = 0; i < this.testFiles.length; i++){
			if (verbose) {
				sys.print(i + ": " + this.testFiles[i]);
			}
			this._runTest(this.testFiles[i]);
			switch (true){
				case (this.errors.length != errorCount):
					errorCount = this.errors.length;
					if (verbose){
						sys.puts(" - ERROR");
					} else {
						sys.print("E");
					}
				break;

				case (this.failures.length != failureCount):
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

		
		sys.puts(this._getSummaryInfo());
		sys.puts("----------------------------------------");
		sys.puts(this._getErrorInfo());
		sys.puts("----------------------------------------");
		sys.puts(this._getFailureInfo());
		
	}

}
