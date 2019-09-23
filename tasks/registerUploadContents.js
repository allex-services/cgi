function createRegisterUploadContentsTask(execlib,UploaderTaskBase){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  function RegisterUploadContentsTask(prophash){
    UploaderTaskBase.call(this,prophash);
    this.parsermodulename = prophash.parsermodulename;
  }
  lib.inherit(RegisterUploadContentsTask,UploaderTaskBase);
  RegisterUploadContentsTask.prototype.__cleanUp = function(){
    this.parsermodulename = null;
    UploaderTaskBase.prototype.__cleanUp.call(this);
  };
  RegisterUploadContentsTask.prototype.registrationParams = function () {
    return [this.parsermodulename,this.boundfields,this.neededfields];
  };
  RegisterUploadContentsTask.prototype.registrationMethodName = 'registerUploadContents';
  RegisterUploadContentsTask.prototype.compulsoryConstructionProperties = ['sink','ipaddress','onEventId'];

  return RegisterUploadContentsTask;
}

module.exports = createRegisterUploadContentsTask;
