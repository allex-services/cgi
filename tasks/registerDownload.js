function createRegisterDownloadTask(execlib,CGIEventTask){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  function RegisterDownloadTask(prophash){
    CGIEventTask.call(this,prophash);
    this.onDownloadStarted = prophash.onDownloadStarted;
  }
  lib.inherit(RegisterDownloadTask,CGIEventTask);
  RegisterDownloadTask.prototype.__cleanUp = function(){
    this.onDownloadStarted = null;
    CGIEventTask.prototype.__cleanUp.call(this);
  };
  RegisterDownloadTask.prototype.onCGI = function (cgiitem) {
    if(!(cgiitem.e && cgiitem.fingerprint && cgiitem.port && this.ipaddress && this.onDownloadStarted)){
      return;
    }
    var downloader = this.onDownloadStarted(cgiitem);
    if(!(downloader && downloader.getPayload)){
      this.destroy();
      return;
    }
    taskRegistry.run('realizeTcpTransmission',{
      ipaddress: this.ipaddress,
      port: cgiitem.port,
      fingerprint: cgiitem.fingerprint,
      onPayloadNeeded: downloader.getPayload
    });
  };
  RegisterDownloadTask.prototype.registrationParams = function () {
    return [this.targetsinkname];
  };
  RegisterDownloadTask.prototype.registrationMethodName = 'registerDownload';
  RegisterDownloadTask.prototype.compulsoryConstructionProperties = ['sink','ipaddress','onEventId','onDownloadStarted'];

  return RegisterDownloadTask;
}

module.exports = createRegisterDownloadTask;
