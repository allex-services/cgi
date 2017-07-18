function createRegisterDownloadTask(execlib,CGIEventTask){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  function RegisterDownloadTask(prophash){
    CGIEventTask.call(this,prophash);
    this.onDownloadStarted = prophash.onDownloadStarted;
    this.contentRequestCgiItem = null;
  }
  lib.inherit(RegisterDownloadTask,CGIEventTask);
  RegisterDownloadTask.prototype.__cleanUp = function(){
    this.onDownloadStarted = null;
    CGIEventTask.prototype.__cleanUp.call(this);
  };
  RegisterDownloadTask.prototype.onCGI = function (cgiitem) {
    if(!(cgiitem.e && cgiitem.headers && cgiitem.contents && this.ipaddress && this.onDownloadStarted)){
      return;
    }
    var downloader = this.onDownloadStarted(cgiitem);
    if (q.isThenable(downloader)) {
      downloader.then(this.onCGIResolved.bind(this, cgiitem));
    } else {
      this.onCGIResolved(cgiitem, downloader);
    }
  };
  RegisterDownloadTask.prototype.onCGIResolved = function (cgiitem, downloader) {
    taskRegistry.run('realizeTcpTransmission',{
      ipaddress: this.ipaddress,
      port: cgiitem.headers.port,
      fingerprint: cgiitem.headers.fingerprint,
      onPayloadNeeded: this.payloadHandler(downloader, 'getHeaders'),
      onOver: this.onHeadersSent.bind(this, downloader, cgiitem.contents)
    });
  };
  RegisterDownloadTask.prototype.onHeadersSent = function (downloader, cgiitem) {
    taskRegistry.run('realizeTcpTransmission',{
      ipaddress: this.ipaddress,
      port: cgiitem.port,
      fingerprint: cgiitem.fingerprint,
      onPayloadNeeded: this.payloadHandler(downloader, 'getPayload')
    });
  };
  RegisterDownloadTask.prototype.payloadHandler = function (downloader, handlername) {
    var h;
    if (!downloader) {
     return null;
    }
    h  = downloader[handlername];
    if ('function' === typeof h) {
      return h.bind(downloader);
    }
    return h || null;
  };
  RegisterDownloadTask.prototype.registrationParams = function () {
    return [];
  };
  RegisterDownloadTask.prototype.registrationMethodName = 'registerDownload';
  RegisterDownloadTask.prototype.compulsoryConstructionProperties = ['sink','ipaddress','onEventId','onDownloadStarted'];

  return RegisterDownloadTask;
}

module.exports = createRegisterDownloadTask;
