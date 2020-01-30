function createCGIUploadUniqueEvent (execlib, CGIUploadEvent) {
  'use strict';

  var lib = execlib.lib;

  function CGIUploadUniqueEvent (prophash /*session,id,boundfields,neededfields,targetsinkname,identityattargetsink*/) {
    CGIUploadEvent.call(this, prophash /*session, id, boundfields, neededfields, targetsinkname, identityattargetsink*/);
  }
  lib.inherit(CGIUploadUniqueEvent, CGIUploadEvent);
  CGIUploadUniqueEvent.prototype.remoteFileName = function (filedesc) {
    //maybe transfer the extension from filedesc.name ?
    return lib.uid();
  };

  return CGIUploadUniqueEvent;
}

module.exports = createCGIUploadUniqueEvent;
