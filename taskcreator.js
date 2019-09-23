function createTasks(execlib, waitForSinkState){
  'use strict';
  var CGIEventTask = require('./tasks/cgieventtaskcreator')(execlib, waitForSinkState),
    UploaderTaskBase = require('./tasks/uploadertaskbasecreator')(execlib, CGIEventTask);

  return [{
    name: 'registerDownload',
    klass: require('./tasks/registerDownload')(execlib,CGIEventTask)
  },{
    name: 'registerUpload',
    klass: require('./tasks/registerUpload')(execlib,UploaderTaskBase)
  },{
    name: 'registerUploadUnique',
    klass: require('./tasks/registerUploadUnique')(execlib,UploaderTaskBase)
  },{
    name: 'registerUploadContents',
    klass: require('./tasks/registerUploadContents')(execlib,UploaderTaskBase)
  }];
}

module.exports = createTasks;
