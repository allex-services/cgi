function createCGIEvents (execlib, dirlib, nodehelperscreator, httprequestparamextlib, jobondestroyablelib) {
  var CGIEventBase = require('./basecreator')(execlib),
    CGIDownloadEvent = require('./downloadcreator')(execlib, CGIEventBase, httprequestparamextlib, jobondestroyablelib),
    CGIUploadEventBase = require('./uploadbasecreator')(execlib, CGIEventBase),
    CGIUploadEvent = require('./uploadcreator')(execlib, CGIUploadEventBase),
    CGIUploadUniqueEvent = require('./uploaduniquecreator')(execlib, CGIUploadEvent),
    CGIUploadContentsEvent = require('./uploadcontentscreator')(execlib, CGIUploadEventBase, dirlib, nodehelperscreator),
    CGIUploadImageEvent = require('./uploadimagecreator')(execlib, CGIUploadEvent, nodehelperscreator),
    CGIUploadImageArrayElementEvent = require('./uploadimagearrayelementcreator')(execlib, CGIUploadImageEvent);

  return function(type, prophash){
    switch(type){
      case 'download':
        return new CGIDownloadEvent(prophash);
      case 'upload':
        return new CGIUploadEvent(prophash);
      case 'uploadunique':
        return new CGIUploadUniqueEvent(prophash);
      case 'uploadcontents':
        return new CGIUploadContentsEvent(prophash);
      case 'uploadimage':
        return new CGIUploadImageEvent(prophash);
      case 'uploadimagearrayelement':
        return new CGIUploadImageArrayElementEvent(prophash);
    }
  }
}

module.exports = createCGIEvents;
