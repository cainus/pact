var TestRunner = require('./TestRunner').TestRunner;

exports.TestSuite = function(){
	
	this.tests = {};
	
	this.addTest = function(testname, callBack){
		this.tests[testname] = callBack;
	}
	
	this.addTests = function(dict){
		for(var x in dict){
			this.tests[x] = dict[x];
		}
	}	
	
	this.setup = function(){}
	this.teardown = function(){}
	
}