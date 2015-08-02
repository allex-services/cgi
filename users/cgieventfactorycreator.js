var formidable = require('formidable');
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
    console.log('ok, now will trigger');
    switch(req.method){
      case 'GET':
        if(!this.urlTargetsMyGet(url)){
          console.log('nok, no trigger');
          res.statusCode = 412; //precondition failed
          res.end();
          return;
        }
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
  CGIEvent.prototype.urlTargetsMyGet = function (url) {
    if (!url) {
      this.emitCGI(url, null, {error: 'no url'});
      return false;
    }
    if (!url.query) {
      this.emitCGI(url, null, {error: 'no url query'});
      return false;
    }
    if (!this.hasNeededFields(url.query)) {
      this.emitCGI(url, null, {error: 'needed fields not satisfied'});
      return false;
    }
    return true;
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
    if(!this.sink) { //not ready, now what? //SERVICE NOT READY?
      res.statusCode = 500;
      res.end('SERVICE NOT READY, PLEASE TRY LATER');
      return;
    }
    
    /*
    console.log('req headers',req);//.headers['content-type']);
    req.on('data', this._onIncomingData.bind(this, req, res));
    req.on('end', this._onDataDone.bind(this, req, res));
    */
    var form = new formidable.IncomingForm();
    form.parse(req, this.onUploadParsed.bind(this, req, res, url));
  };
  CGIUploadEvent.prototype.onUploadTargetSink = function (needefields, sinkinfo){
    this.sink = sinkinfo.sink;
    this.ipaddress = sinkinfo.ipaddress;
  };
  CGIUploadEvent.prototype.onUploadParsed = function (req, res, url, err, fields, files) {
    if(!this.sink) {
      lib.runNext(this.onUploadParsed.bind(this, req, res, url, err, fields, files), 1000);
      return;
    }
    //console.log('fields', fields);
    if (!this.hasNeededFields(fields)) {
      this.emitCGI(url, null, {error: 'needed fields not satisfied'});
      res.statusCode = 412; //precondition failed
      res.end();
      return;
    };
    //console.log('files', files);
    if(files.file) {
      taskRegistry.run('transmitFile',{
        debug: true,
        sink: this.sink,
        ipaddress: this.ipaddress,
        filename: files.file.path,
        root: '/',
        remotefilename: files.file.name,
        metadata: fields,
        deleteonsuccess: true,
        cb: this.onUploadSuccess.bind(this, res, url)
      });
    } else {
      res.end();
    }
  };
  CGIUploadEvent.prototype.onUploadSuccess = function (res, url, success, remotefilepath) {
    console.log('upload emitting success', success);
    if (!success) {
      res.statusCode = 500;
    }
    res.end(remotefilepath);
    this.emitCGI(url, null, {remotefilepath: remotefilepath, success: success});
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
