function createCGIEvents (execlib, dirlib, nodehelperscreator) {
  var CGIEventBase = require('./basecreator')(execlib),
    CGIDownloadEvent = require('./downloadcreator')(execlib, CGIEventBase),
    CGIUploadEventBase = require('./uploadbasecreator')(execlib, CGIEventBase),
    CGIUploadEvent = require('./uploadcreator')(execlib, CGIUploadEventBase),
    CGIUploadUniqueEvent = require('./uploaduniquecreator')(execlib, CGIUploadEvent),
    CGIUploadContentsEvent = require('./uploadcontentscreator')(execlib, CGIUploadEventBase, dirlib, nodehelperscreator);

  return function(type){
    switch(type){
      case 'download':
        return CGIDownloadEvent;
      case 'upload':
        return CGIUploadEvent;
      case 'uploadunique':
        return CGIUploadUniqueEvent;
      case 'uploadcontents':
        return CGIUploadContentsEvent;
    }
  }
}

module.exports = createCGIEvents;
