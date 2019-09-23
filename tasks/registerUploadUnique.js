function createRegisterUploadUniqueTask(execlib,UploaderTaskBase){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  function RegisterUploadUniqueTask(prophash){
    UploaderTaskBase.call(this,prophash);
    this.targetsinkname = prophash.targetsinkname;
    this.identityattargetsink = prophash.identityattargetsink;
  }
  lib.inherit(RegisterUploadUniqueTask,UploaderTaskBase);
  RegisterUploadUniqueTask.prototype.__cleanUp = function(){
    this.identityattargetsink = null;
    this.targetsinkname = null;
    UploaderTaskBase.prototype.__cleanUp.call(this);
  };
  RegisterUploadUniqueTask.prototype.registrationParams = function () {
    return [this.targetsinkname,this.identityattargetsink,this.boundfields,this.neededfields];
  };
  RegisterUploadUniqueTask.prototype.registrationMethodName = 'registerUploadUnique';
  RegisterUploadUniqueTask.prototype.compulsoryConstructionProperties = ['sink','ipaddress','onEventId','targetsinkname','identityattargetsink'];

  return RegisterUploadUniqueTask;
}

module.exports = createRegisterUploadUniqueTask;
