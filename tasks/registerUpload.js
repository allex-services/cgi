function createRegisterUploadTask(execlib,UploaderTaskBase){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  function RegisterUploadTask(prophash){
    UploaderTaskBase.call(this,prophash);
    this.targetsinkname = prophash.targetsinkname;
    this.identityattargetsink = prophash.identityattargetsink;
  }
  lib.inherit(RegisterUploadTask,UploaderTaskBase);
  RegisterUploadTask.prototype.__cleanUp = function(){
    this.identityattargetsink = null;
    this.targetsinkname = null;
    UploaderTaskBase.prototype.__cleanUp.call(this);
  };
  RegisterUploadTask.prototype.registrationParams = function () {
    return [this.targetsinkname,this.identityattargetsink,this.boundfields,this.neededfields];
  };
  RegisterUploadTask.prototype.registrationMethodName = 'registerUpload';
  RegisterUploadTask.prototype.compulsoryConstructionProperties = ['sink','ipaddress','onEventId','targetsinkname','identityattargetsink'];

  return RegisterUploadTask;
}

module.exports = createRegisterUploadTask;
