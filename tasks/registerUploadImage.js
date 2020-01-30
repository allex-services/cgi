function createRegisterUploadImageTask(execlib,UploaderTaskBase){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  function RegisterUploadImageTask(prophash){
    UploaderTaskBase.call(this,prophash);
    this.targetsinkname = prophash.targetsinkname;
    this.identityattargetsink = prophash.identityattargetsink;
    this.imagesizes = prophash.imagesizes;
  }
  lib.inherit(RegisterUploadImageTask,UploaderTaskBase);
  RegisterUploadImageTask.prototype.__cleanUp = function(){
    this.imagesizes = null;
    this.identityattargetsink = null;
    this.targetsinkname = null;
    UploaderTaskBase.prototype.__cleanUp.call(this);
  };
  RegisterUploadImageTask.prototype.registrationParams = function () {
    return [this.targetsinkname,this.identityattargetsink,this.boundfields,this.neededfields,this.imagesizes];
  };
  RegisterUploadImageTask.prototype.registrationMethodName = 'registerUploadImage';
  RegisterUploadImageTask.prototype.compulsoryConstructionProperties = ['sink','ipaddress','onEventId','targetsinkname','identityattargetsink','imagesizes'];

  return RegisterUploadImageTask;
}

module.exports = createRegisterUploadImageTask;
