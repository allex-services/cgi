function createRegisterUploadTask(execlib,CGIEventTask){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  function RegisterUploadTask(prophash){
    CGIEventTask.call(this,prophash);
    this.targetsinkname = prophash.targetsinkname;
    this.identityattargetsink = prophash.identityattargetsink;
    this.onUploadProgress = prophash.onUploadProgress;
    this.onUploadDone = prophash.onUploadDone;
  }
  lib.inherit(RegisterUploadTask,CGIEventTask);
  RegisterUploadTask.prototype.__cleanUp = function(){
    this.onUploadDone = null;
    this.onUploadProgress = null;
    this.identityattargetsink = null;
    this.targetsinkname = null;
    CGIEventTask.prototype.__cleanUp.call(this);
  };
  RegisterUploadTask.prototype.onCGI = function (cgiitem) {
    console.log('cgiitem', cgiitem, this.onUploadDone.toString());
    /*
    if(!(cgiitem.e && cgiitem.filename && this.ipaddress)){
      return;
    }
    */
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
  RegisterUploadTask.prototype.registrationParams = function () {
    return [this.targetsinkname,this.identityattargetsink,this.neededfields];
  };
  RegisterUploadTask.prototype.registrationMethodName = 'registerUpload';
  RegisterUploadTask.prototype.compulsoryConstructionProperties = ['sink','ipaddress','onEventId','targetsinkname','identityattargetsink'];

  return RegisterUploadTask;
}

module.exports = createRegisterUploadTask;
