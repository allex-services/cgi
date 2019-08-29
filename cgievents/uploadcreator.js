function createCGIUploadEvent (execlib, CGIUploadEventBase) {
  'use strict';

  var lib = execlib.lib,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  function CGIUploadEvent (session,id,boundfields,neededfields,targetsinkname,identityattargetsink) {
    CGIUploadEventBase.call(this, session, id, boundfields, neededfields);
    this.sink = null;
    this.ipaddress = null;
    this.q = new lib.Fifo();
    this.finderTask = taskRegistry.run('findAndRun',{
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
  lib.inherit(CGIUploadEvent, CGIUploadEventBase);
  CGIUploadEvent.prototype.destroy = function () {
    if (this.q) {
      this.q.destroy();
    }
    this.q = null;
    if (this.finderTask) {
      this.finderTask.destroy();
    }
    this.finderTask = null;
    this.ipaddress = null;
    if (this.sink) {
      this.sink.destroy();
    }
    this.sink = null;
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
    CGIUploadEventBase.prototype.triggerPOST.call(this, req, res, url);
  }
  CGIUploadEvent.prototype.onUploadParsed = function (req, res, url, err, fields, files) {
    if(!this.sink) {
      lib.runNext(this.onUploadParsed.bind(this, req, res, url, err, fields, files), 1000);
      return;
    }
    CGIUploadEventBase.prototype.onUploadParsed.call(this, req, res, url, err, fields, files);
  };
  CGIUploadEvent.prototype.onUploadParsedCorrect = function (req, res, url, fields, files) {
    if(files.file) {
      taskRegistry.run('transmitFile',{
        sink: this.sink,
        ipaddress: this.ipaddress,
        filename: files.file.path,
        root: '/',
        remotefilename: this.remoteFileName(files.file), //files.file.name,
        metadata: fields,
        deleteonsuccess: true,
        cb: this.onUploadSuccess.bind(this, fields, res, url)
      });
    } else {
      res.writeHead (412, 'Files not provided');
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
  CGIUploadEvent.prototype.remoteFileName = function (filedesc) {
    return filedesc.name;
  };

  return CGIUploadEvent;
}

module.exports = createCGIUploadEvent;


