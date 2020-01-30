function createCGIUploadEvent (execlib, CGIUploadEventBase) {
  'use strict';

  var lib = execlib.lib,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  function CGIUploadEvent (prophash) {
    CGIUploadEventBase.call(this, prophash);
    this.sink = null;
    this.ipaddress = null;
    this.q = new lib.Fifo();
    this.finderTask = taskRegistry.run('findAndRun',{
      program: {
        sinkname: prophash.targetsinkname,
        identity: prophash.identityattargetsink,
        task:{
          name: this.onUploadTargetSink.bind(this,this.neededfields),
          propertyhash:{
            'ipaddress': 'fill yourself'
          }
        }
      }
    });
    this.uploaderTask = null;
  }
  lib.inherit(CGIUploadEvent, CGIUploadEventBase);
  CGIUploadEvent.prototype.destroy = function () {
    if (this.uploaderTask) {
      this.uploaderTask.destroy();
    }
    this.uploaderTask = null;
    if (this.finderTask) {
      this.finderTask.destroy();
    }
    this.finderTask = null;
    if (this.q) {
      this.q.destroy();
    }
    this.q = null;
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
    //console.log('onUploadTargetSink!', sinkinfo);
    if (!this.q) {
      return;
    }
    var qe;
    if (this.sink) {
      this.sink.destroy();
    }
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
      this.processFile(req, res, url, fields, files);
      return;
    }
    res.writeHead (412, 'Files not provided');
    res.end();
    this.destroy();
  };
  CGIUploadEvent.prototype.processFile = function (req, res, url, fields, files) {
    this.transmitFile(files.file.path, this.remoteFileName(files.file), fields, this.onUploadSuccess.bind(this, fields, res, url));
  };
  CGIUploadEvent.prototype.transmitFile = function (filename, remotefilename, metadata, cb) {
    this.uploaderTask = taskRegistry.run('transmitFile',{
      sink: this.sink,
      ipaddress: this.ipaddress,
      filename: filename,
      root: '/',
      remotefilename: remotefilename,
      metadata: metadata,
      deleteonsuccess: true,
      cb: cb
    });
  };
  CGIUploadEvent.prototype.onUploadSuccess = function (fields, res, url, success, remotefilepath) {
    if (!success) {
      res.statusCode = 500;
    }
    res.end(remotefilepath);
    this.emitCGI(url, null, {data: fields, remotefilepath: remotefilepath, success: success});
    this.destroy();
  };
  CGIUploadEvent.prototype.remoteFileName = function (filedesc) {
    return filedesc.name;
  };

  return CGIUploadEvent;
}

module.exports = createCGIUploadEvent;


