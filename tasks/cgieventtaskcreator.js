function createCGIEventTask(execlib){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    execSuite = execlib.execSuite,
    SinkTask = execSuite.SinkTask,
    taskRegistry = execSuite.taskRegistry;

  function CGIEventTask(prophash){
    SinkTask.call(this,prophash);
    this.sink = prophash.sink;
    this.ipaddress = prophash.ipaddress;
    this.onEventId = prophash.onEventId;
    this.neededfields = prophash.neededfields || [];
    this.boundfields = prophash.boundfields || {};
    this.publicport = null;
    this.eventid = null;
  }
  lib.inherit(CGIEventTask,SinkTask);
  CGIEventTask.prototype.__cleanUp = function () {
    this.eventid = null;
    this.publicport = null;
    this.boundfields = null;
    this.neededfields = null;
    this.onEventId = null;
    this.ipaddress = null;
    this.sink = null;
    SinkTask.prototype.__cleanUp.call(this);
  };
  CGIEventTask.prototype.go = function(){
    this.sink.consumeChannel('cgi',this.onCGI.bind(this));
    taskRegistry.run('readState',{
      state: taskRegistry.run('materializeState',{
        sink: this.sink
      }),
      name: 'port',
      cb: this.onPort.bind(this)
    });
  };
  CGIEventTask.prototype.onPort = function (port) {
    this.publicport = port;
    taskRegistry.run('invokeSessionMethod',{
      sink: this.sink,
      methodname: this.registrationMethodName,
      params: this.registrationParams(),
      onSuccess: this.onEventRegistered.bind(this),
      onError: this.destroy.bind(this)
    });
  };
  CGIEventTask.prototype.onEventRegistered = function (eventid){
    this.eventid = eventid;
    if(this.onEventId){
      try { 
      taskRegistry.run('natThis', {
        iaddress: this.ipaddress,
        iport: this.publicport,
        cb: this.onEventId.bind(null, eventid)
      });
      } catch (e) {
        console.error(e.stack);
        console.error(e);
      }
      //this.onEventId(eventid,this.ipaddress,this.publicport);
    }
  };
  CGIEventTask.prototype.compulsoryConstructionProperties = ['sink','ipaddress','onEventId'];
  return CGIEventTask;
}

module.exports = createCGIEventTask;
