function createServicePack(execlib){
  'use strict';

  return {
    service: {
      dependencies: ['allex:http']
    },
    sinkmap: {
      dependencies: ['allex:http']
    }
  };
}

module.exports = createServicePack;
