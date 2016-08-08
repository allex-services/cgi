var formidable = require('formidable');
function createCGIEventFactory(execlib){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  function CGIEvent(session,id,boundfields,neededfields){
    this.id = id;
    this.session = session;
    this.boundfields = boundfields || {};
    this.neededfields = neededfields || [];
  }
  CGIEvent.prototype.destroy = function(){
    this.boundfields = null;
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
    switch(req.method){
      case 'GET':
        if(!this.urlTargetsMyGet(url)){
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
  CGIDownloadEvent.prototype.triggerTransmission = function (res,url,body) {
    var user = this.user();
    if(!user){
      res.end();
      return;
    }
    var hd = q.defer(); //headers defer
    user.requestTcpTransmission({session:this.session,response:res,headers:true},hd);
    var cd = q.defer(); //contents defer
    user.requestTcpTransmission({session:this.session,response:res},cd);
    q.allSettled([hd.promise,cd.promise]).done(
      this.onRequestsDone.bind(this, res, url, body)
    );
  };
  CGIDownloadEvent.prototype.onRequestsDone = function (res, url, body, promises) {
    var hd = promises[0], cd = promises[1];
    if (!(hd.state==='fulfilled' && cd.state==='fulfilled')){
      //TODO: here there will be ugly, browser will open an empty page...
      return;
    }
    this.emitCGI(url, body, {
      headers: hd.value,
      contents: cd.value
    });
  };
  CGIDownloadEvent.prototype.onHeadersRequestObj = function (res, url, body, obj) {
    obj.headersneeded = true;
    this.emitCGI(url, body, obj);
  };

  function CGIUploadEvent(session,id,boundfields,neededfields,targetsinkname,identityattargetsink){
    CGIEvent.call(this,session,id,boundfields,neededfields);
    this.sink = null;
    this.ipaddress = null;
    this.q = new lib.Fifo();
    taskRegistry.run('findAndRun',{
      program: {
        sinkname:targetsinkname,
        identity:identityattargetsink,
        task:{
          name: this.onUploadTargetSink.bind(this,this.neededfields),
          propertyhash:{
            'ipaddress': 'fill yourself'
          }
        }
      }
    });
  }
  lib.inherit(CGIUploadEvent,CGIEvent);
  CGIUploadEvent.prototype.destroy = function () {
    if (this.q) {
      this.q.destroy();
    }
    this.q = null;
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
      this.q.push([req, res, url]);
      /*
      res.statusCode = 500;
      res.end('SERVICE NOT READY, PLEASE TRY LATER');
      */
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
  function drainer(cgiue, qe) {
    cgiue.triggerPOST.apply(cgiue, qe);
  }
  CGIUploadEvent.prototype.onUploadTargetSink = function (needefields, sinkinfo){
    if (!this.q) {
      return;
    }
    var qe;
    this.sink = sinkinfo.sink;
    this.ipaddress = sinkinfo.ipaddress;
    if (!this.sink) {
      return;
    }
    this.q.drain(drainer.bind(null, this));
    /*
    while (this.q.length) {
      qe = this.q.pop();
      this.triggerPOST.apply(this,qe);
    }
    */
  };
  CGIUploadEvent.prototype.onUploadParsed = function (req, res, url, err, fields, files) {
    if(!this.sink) {
      lib.runNext(this.onUploadParsed.bind(this, req, res, url, err, fields, files), 1000);
      return;
    }
    //console.log('fields', fields);
    if (!this.hasNeededFields(fields)) {
      console.error('needed fields not satisfied, mine', this.neededfields, 'got', fields);
      this.emitCGI(url, null, {error: 'needed fields not satisfied'});
      res.statusCode = 412; //precondition failed
      res.end();
      return;
    };
    //console.log('files', files);
    /*
    lib.traverseShallow(this.boundfields,function(bf,bfname){
      fields[bfname] = bf;
    });
    */
    lib.extend(fields, this.boundfields);
    if(files.file) {
      taskRegistry.run('transmitFile',{
        sink: this.sink,
        ipaddress: this.ipaddress,
        filename: files.file.path,
        root: '/',
        remotefilename: files.file.name,
        metadata: fields,
        deleteonsuccess: true,
        cb: this.onUploadSuccess.bind(this, fields, res, url)
      });
    } else {
      res.end();
    }
  };
  CGIUploadEvent.prototype.onUploadSuccess = function (fields, res, url, success, remotefilepath) {
    if (!success) {
      res.statusCode = 500;
    }
    res.end(remotefilepath);
    this.emitCGI(url, null, {data: fields, remotefilepath: remotefilepath, success: success});
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
