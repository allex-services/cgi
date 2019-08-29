function createCGIServiceTester(execlib,Tester){
  'use strict';
  var lib = execlib.lib,
      q = lib.q;

  function CGIServiceTester(prophash,client){
    Tester.call(this,prophash,client);
    console.log('runNext finish');
    lib.runNext(this.finish.bind(this,0));
  }
  lib.inherit(CGIServiceTester,Tester);

  return CGIServiceTester;
}

module.exports = createCGIServiceTester;
