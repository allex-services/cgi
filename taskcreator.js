function createTasks(execlib){
  'use strict';
  var CGIEventTask = require('./tasks/cgieventtaskcreator')(execlib);

  return [{
    name: 'registerDownload',
    klass: require('./tasks/registerDownload')(execlib,CGIEventTask)
  },{
    name: 'registerUpload',
    klass: require('./tasks/registerUpload')(execlib,CGIEventTask)
  }];
}

module.exports = createTasks;
