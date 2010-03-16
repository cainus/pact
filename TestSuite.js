var TestRunner = require('./TestRunner').TestRunner;
var sys = require('sys');
var fs = require("fs");

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
	
	this.run = function(shouldRun) {

		if (module.parent == require.main){
			// the module calling this (the parent) is the main module.. 
			// so create a testrunner to run its tests
			var runner = new TestRunner();
			runner.verbose = true;
			
			for (var x in this.tests){
				runner.addSuiteTest(require.main.filename, x, this.tests[x]);				
			}
			runner.run();
		}
	}
	
}