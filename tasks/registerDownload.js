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
    if(!(cgiitem.e && this.onDownloadStarted)){
      return;
    }
    var downloader = this.onDownloadStarted(cgiitem);
    if (q.isThenable(downloader)) {
      downloader.then(this.sendHeaders.bind(this, cgiitem));
    } else {
      this.sendHeaders(cgiitem, downloader);
    }
  };
  RegisterDownloadTask.prototype.sendHeaders = function (cgiitem, downloader) {
    var item = downloader.getHeaders(), p;
    if (item) {
      p = this.sink.call('takeDownloadHeaders', cgiitem.jobid, item).then(this.sendHeaders.bind(this, cgiitem, downloader), this.destroy.bind(this));
      return;
    }
    this.sendContents(cgiitem, downloader);
  };
  RegisterDownloadTask.prototype.sendContents = function (cgiitem, downloader) {
    var item = downloader.getPayload(), p;
    p = this.sink.call('takeDownloadContents', cgiitem.jobid, item||'');
    if (!lib.isVal(item)) {
      this.destroy();
      return;
    }
    p.then(this.sendContents.bind(this, cgiitem, downloader), this.destroy.bind(this));
  };
  /*
  RegisterDownloadTask.prototype.sendHeaders = function (cgiitem, downloader) {
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
  */
  RegisterDownloadTask.prototype.registrationParams = function () {
    return [];
  };
  RegisterDownloadTask.prototype.registrationMethodName = 'registerDownload';
  RegisterDownloadTask.prototype.compulsoryConstructionProperties = ['sink','ipaddress','onEventId','onDownloadStarted'];

  return RegisterDownloadTask;
}

module.exports = createRegisterDownloadTask;
