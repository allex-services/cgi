function createCGIUploadUniqueEvent (execlib, CGIUploadEvent) {
  'use strict';

  var lib = execlib.lib;

  function CGIUploadUniqueEvent (session,id,boundfields,neededfields,targetsinkname,identityattargetsink) {
    CGIUploadEvent.call(this, session, id, boundfields, neededfields, targetsinkname, identityattargetsink);
  }
  lib.inherit(CGIUploadUniqueEvent, CGIUploadEvent);
  CGIUploadUniqueEvent.prototype.remoteFileName = function (filedesc) {
    return lib.uid();
  };

  return CGIUploadUniqueEvent;
}

module.exports = createCGIUploadUniqueEvent;
