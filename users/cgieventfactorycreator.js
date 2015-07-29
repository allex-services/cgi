function createCGIEventFactory(execlib){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  function CGIEvent(session,id,neededfields){
    this.id = id;
    this.session = session;
    this.neededfields = neededfields || [];
  }
  CGIEvent.prototype.destroy = function(){
    this.neededfields = null;
    this.session = null;
    this.id = null;
  };
  CGIEvent.prototype.user = function(){
    if(!this.session){
      return null;
    }
    return this.session.user;
  }
  CGIEvent.prototype.service = function(){
    var user = this.user();
    if(!user){
      return null;
    }
    return user.__service;
  };
  CGIEvent.prototype.trigger = function (req,res,url) {
    if(!this.urlTargetsMe(url)){
      console.log('nok, no trigger');
      res.end();
      return;
    }
    console.log('ok, now will trigger');
    switch(req.method){
      case 'GET':
        this.triggerGET(req,res,url);
        break;
      case 'POST':
        this.triggerPOST(req,res,url);
        break;
      default:
        res.end();
        break;
    }
  };
  CGIEvent.prototype.urlTargetsMe = function (url) {
    if(url && url.query && this.hasNeededFields(url.query)){
      return true;
    }
    return false;
  };
  CGIEvent.prototype.emitCGI = function (url,body,obj) {
    if(!this.session){
      return;
    }
    obj.e = this.id;
    obj.query = url.query;
    obj.body = body;
    this.session.channels.get('cgi').onStream(obj);
  };
  CGIEvent.prototype.hasNeededFields = function(obj){
    console.log('hasNeededFields? mine',this.neededfields,'his',obj);
    if (!this.neededfields) {
      return true;
    }
    if (!this.neededfields.length) {
      return true;
    }
    return this.neededfields.every(function(field){
      return lib.defined(obj[field]);
    });
  };

  function CGIDownloadEvent(session,id,neededfields){
    CGIEvent.call(this,session,id,neededfields);
  }
  lib.inherit(CGIDownloadEvent,CGIEvent);
  CGIDownloadEvent.prototype.triggerGET = function (req, res, url) {
    this.triggerTransmission(res,url);
  };
  CGIDownloadEvent.prototype.triggerPOST = function (req, res, url) {
    res.end();
  };
  CGIEvent.prototype.triggerTransmission = function (res,url,body) {
    var user = this.user();
    if(!user){
      res.end();
      return;
    }
    var d = q.defer();
    user.requestTcpTransmission({session:this.session,response:res},d);
    d.promise.done(
      this.emitCGI.bind(this,url,body)
    );
  };

  function CGIUploadEvent(session,id,neededfields,targetsinkname,identityattargetsink){
    CGIEvent.call(this,session,id,neededfields);
    this.sink = null;
    this.ipaddress = null;
    taskRegistry.run('findAndRun',{
      program: {
        sinkname:targetsinkname,
        identity:identityattargetsink,
        task:{
          name: this.onUploadTargetSink.bind(this,neededfields),
          propertyhash:{
            'ipaddress': 'fill yourself'
          }
        }
      }
    });
  }
  lib.inherit(CGIUploadEvent,CGIEvent);
  CGIUploadEvent.prototype.destroy = function () {
    this.ipaddress = null;
    this.sink = null;
    CGIEvent.prototype.destroy.call(this);
  };
  CGIUploadEvent.prototype.triggerGET = function (req, res, url) {
    res.end();
  };

  CGIUploadEvent.prototype._onIncomingData = function (req, res, chunk) {
    console.log('===>', chunk.toString('utf8'));
  };

  CGIUploadEvent.prototype._onDataDone = function (req, res, data) {
    res.end('ok');
  };

  CGIUploadEvent.prototype.triggerPOST = function (req, res, url) {
    console.log('CGIUploadEvent POST', url, this);
    if(!this.sink) { //not ready, now what? //SERVICE NOT READY?
      res.statusCode = 500;
      res.end('SERVICE NOT READY, PLEASE TRY LATER');
      return;
    }
    req.on('data', this._onIncomingData.bind(this, req, res));
    req.on('end', this._onDataDone.bind(this, req, res));
  };
  CGIUploadEvent.prototype.onUploadTargetSink = function (needefields, sinkinfo){
    this.sink = sinkinfo.sink;
    this.ipaddress = sinkinfo.ipaddress;
  };

  return function(type){
    switch(type){
      case 'download':
        return CGIDownloadEvent;
      case 'upload':
        return CGIUploadEvent;
    }
  }
}

module.exports = createCGIEventFactory;
