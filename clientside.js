function createClientSide(execlib){
  'use strict';
  var execSuite = execlib.execSuite,
    ParentServicePack = execSuite.registry.get('allex_httpservice'),
    CGIEventTask = require('./tasks/cgieventtaskcreator')(execlib);

  return {
    SinkMap: require('./sinkmapcreator')(execlib,ParentServicePack),
    Tasks: [{
      name: 'registerDownload',
      klass: require('./tasks/registerDownload')(execlib,CGIEventTask)
    },{
      name: 'registerUpload',
      klass: require('./tasks/registerUpload')(execlib,CGIEventTask)
    }]
  };
}

module.exports = createClientSide;
