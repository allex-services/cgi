function createServicePack(execlib){
  'use strict';
  var execSuite = execlib.execSuite,
  //ParentServicePack = execSuite.registry.get('.');
  ParentServicePack = execSuite.registry.register('allex_httpservice');

  return {
    Service: require('./servicecreator')(execlib,ParentServicePack),
    SinkMap: require('./sinkmapcreator')(execlib,ParentServicePack)
  };
}

module.exports = createServicePack;
