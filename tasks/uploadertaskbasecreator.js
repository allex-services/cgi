function createUploaderTaskBase (execlib, CGIEventTask) {
  'use strict';

  var lib = execlib.lib;


  function UploaderTaskBase(prophash){
    CGIEventTask.call(this,prophash);
    this.onUploadProgress = prophash.onUploadProgress;
    this.onUploadDone = prophash.onUploadDone;
  }
  lib.inherit(UploaderTaskBase,CGIEventTask);
  UploaderTaskBase.prototype.__cleanUp = function(){
    this.onUploadDone = null;
    this.onUploadProgress = null;
    CGIEventTask.prototype.__cleanUp.call(this);
  };
  UploaderTaskBase.prototype.onCGI = function (cgiitem) {
    if(cgiitem.hasOwnProperty('progress')){
      if(this.onUploadProgress){
        this.onUploadProgress(cgiitem);
      }
    }
    if(cgiitem.hasOwnProperty('success')){
      if(this.onUploadDone){
        this.onUploadDone(cgiitem);
      }
    }
  };

  return UploaderTaskBase;

}

module.exports = createUploaderTaskBase;
