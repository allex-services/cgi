function createCGIUserTester(execlib,Tester){
  'use strict';
  var lib = execlib.lib,
      q = lib.q;

  function CGIUserTester(prophash,client){
    Tester.call(this,prophash,client);
    console.log('runNext finish');
    lib.runNext(this.finish.bind(this,0));
  }
  lib.inherit(CGIUserTester,Tester);

  return CGIUserTester;
}

module.exports = createCGIUserTester;
