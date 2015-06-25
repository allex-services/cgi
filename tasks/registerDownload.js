function createRegisterDownloadTask(execlib){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    execSuite = execlib.execSuite,
    SinkTask = execSuite.SinkTask,
    taskRegistry = execSuite.taskRegistry;

  function RegisterDownloadTask(prophash){
    SinkTask.call(this,prophash);
    this.sink = prophash.sink;
    this.ipaddress = prophash.ipaddress;
    this.publicport = null;
    this.onDownloadStarted = prophash.onDownloadStarted;
    this.onEventId = prophash.onEventId;
    this.neededfields = prophash.neededfields;
    this.eventid = null;
  }
  lib.inherit(RegisterDownloadTask,SinkTask);
  RegisterDownloadTask.prototype.__cleanUp = function(){
    this.eventid = null;
    this.neededfields = null;
    this.onDownloadStarted = null;
    this.publicport = null;
    this.ipaddress = null;
    this.sink = null;
    SinkTask.prototype.__cleanUp.call(this);
  };
  RegisterDownloadTask.prototype.go = function () {
    this.sink.consumeChannel('cgi',this.onCGI.bind(this));
    taskRegistry.run('readState',{
      state: taskRegistry.run('materializeState',{
        sink: this.sink
      }),
      name: 'port',
      cb: this.onPort.bind(this)
    });
  };
  RegisterDownloadTask.prototype.onPort = function (port) {
    this.publicport = port;
    taskRegistry.run('invokeSessionMethod',{
      sink: this.sink,
      methodname: 'registerDownload',
      params: [this.neededfields],
      onSuccess: this.onEventRegistered.bind(this),
      onError: this.destroy.bind(this)
    });
  };
  RegisterDownloadTask.prototype.onEventRegistered = function (eventid){
    this.eventid = eventid;
    if(this.onEventId){
      this.onEventId(eventid,this.ipaddress,this.publicport);
    }
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
  RegisterDownloadTask.prototype.compulsoryConstructionProperties = ['sink','ipaddress','onDownloadStarted','onEventId'];

  return RegisterDownloadTask;
}

module.exports = createRegisterDownloadTask;
