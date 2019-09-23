function createServicePack(execlib){
  'use strict';

  return {
    service: {
      dependencies: ['allex_httpservice', 'allex_directorylib', 'allex_leveldblib', 'allex:jobondestroyable:lib', 'allex:httprequestparameterextraction:lib']
    },
    sinkmap: {
      dependencies: ['allex_httpservice']
    },
    tasks: {
      dependencies: ['allex_readsinkstatelib']
    }
  };
}

module.exports = createServicePack;
