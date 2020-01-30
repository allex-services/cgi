var gm = require('gm').subClass({imageMagick: true});
function createCGIUploadImageEvent (execlib, CGIUploadEvent, nodehelperscreator) {
  'use strict';

  var lib = execlib.lib,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry,
    q = lib.q,
    qlib = lib.qlib,
    JobOnDestroyable = qlib.JobOnDestroyable,
    Node = nodehelperscreator(),
    Path = Node.Path,
    Fs = Node.Fs;

  function gmwriter (defer, targetfile, err, result_ignored) {
    if (err) {
      defer.reject(err);
    }
    defer.resolve(targetfile);
    defer = null;
  }
  function gmoperations (gmwhatever, targetfile) {
    var d = q.defer(), ret = d.promise;
    gmwhatever.write(targetfile, gmwriter.bind(null, d, targetfile));
    targetfile = null;
    d = null;
    return ret;
  }

  function rotate (fname, fields, targetname) {
    return gmoperations(
      gm(fname)
      .rotate('#0000', fields.rotate),
      targetname
    );
  }

  function crop (fname, fields, targetname) {
    return gmoperations(
      gm(fname)
      .crop(fields.width, fields.height, fields.x, fields.y),
      targetname
    );
  }

  function resize (fname, size, targetname) {
    return gmoperations(
      gm(fname)
      .resize(size[0], size[1]),
      targetname
    );
  }

  function GMJob (session, infilepath, fields, sizes, defer) {
    JobOnDestroyable.call(this, session, defer);
    this.infilepath = infilepath;
    this.tmpdir = Path.dirname(infilepath);
    this.uid = lib.uid();
    this.fields = fields;
    this.sizes = sizes;
    this.sizeindex = 0;
    this.resultFiles = [];
    this.masterpath = null;
  }
  lib.inherit(GMJob, JobOnDestroyable);
  GMJob.prototype.destroy = function () {
    this.masterpath = null;
    this.resultFiles = null;
    this.sizeindex = null;
    this.sizes = null;
    this.fields = null;
    this.uid = null;
    this.tmpdir = null;
    this.infilepath = null;
    JobOnDestroyable.prototype.destroy.call(this);
  };
  GMJob.prototype.go = function () {
    var ok = this.okToGo();
    if (!ok.ok) {
      return ok.val;
    }
    this.masterpath = Path.join(this.tmpdir, this.uid);
    if (this.fields.rotate) {
      rotate(this.infilepath, this.fields, this.masterpath).then(
        this.onRotated.bind(this),
        this.reject.bind(this)
      );
      return ok.val;
    }
    this.doCrop();
    return ok.val;
  };
  GMJob.prototype.onRotated = function () {
    if (!this.okToProceed()) {
      return;
    }
    this.infilepath = this.masterpath;
    this.doCrop();
  };
  GMJob.prototype.doCrop = function () {
    if (!this.okToProceed()) {
      return;
    }
    crop(this.infilepath, this.fields, this.masterpath).then(
      this.doResize.bind(this),
      this.reject.bind(this)
    );
  };
  GMJob.prototype.doResize = function (resultfile) {
    var sizeobj;
    if (!this.okToProceed()) {
      return;
    }
    this.resultFiles.push(resultfile);
    if (this.sizeindex>=this.sizes.length) {
      this.resolve(this.resultFiles);
      return;
    }
    sizeobj = this.sizeAndName(this.sizes[this.sizeindex], this.sizeindex);
    if (!sizeobj) {
      this.resolve(this.resultFiles);
      return;
    }
    this.sizeindex++;
    resize(this.masterpath, sizeobj.size, this.masterpath+'-'+sizeobj.name).then(
      this.doResize.bind(this),
      this.reject.bind(this)
    );
  };
  GMJob.prototype.sizeAndName = function (sizeobj, defaultname) {
    if (!sizeobj) {
      return null;
    }
    if (sizeobj.name && sizeobj.size) {
      return sizeobj;
    }
    if (lib.isArray(sizeobj) && sizeobj.length===2) {
      return {
        name: defaultname,
        size: sizeobj
      };
    }
    return null;
  };


  function CGIUploadImageEvent (prophash) {
    CGIUploadEvent.call(this, prophash);
    this.imageSizes = prophash.imagesizes;
  }
  lib.inherit(CGIUploadImageEvent, CGIUploadEvent);
  CGIUploadImageEvent.prototype.destroy = function () {
    this.imageSizes = null;
    CGIUploadEvent.prototype.destroy.call(this);
  };
  CGIUploadImageEvent.prototype.processFile = function (req, res, url, fields, files) {
    var sfi = this.sizesForImage(fields, files);
    if (!sfi) {
      this.onError(res, url, 'no appropriate size', 412); //this will destroy me
      return;
    }
    (new GMJob(this.session, files.file.path, fields, sfi)).go().then(
      this.onGM.bind(this, res, url, fields),
      this.onError.bind(this, res, url)
    );
    res = null;
    url = null;
    fields = null;
  };
  CGIUploadImageEvent.prototype.onGM = function (res, url, fields, files) {
    q.all(files.map(this.transmitOneFile.bind(this, fields))).then(
      this.onAllTransmitted.bind(this, res, url, fields),
      this.onError.bind(this, res, url)
    );
    res = null;
    url = null;
    fields = null;
  };
  CGIUploadImageEvent.prototype.onError = function (res, url, reason, statuscode) {
    console.log('CGIUploadImageEvent onError', reason);
    res.writeHead(statuscode||500, reason.toString());
    res.end();
    this.emitCGI(url, null, {error: reason});
    this.destroy();
  };
  CGIUploadImageEvent.prototype.transmitOneFile = function (metadata, filepath) {
    return this.transmitFile(filepath, Path.basename(filepath), metadata);
  };
  function transmitter (defer, success, remotefilepath) {
    defer.resolve({
      success: success,
      remotefilepath: remotefilepath
    });
    defer = null;
  }
  CGIUploadImageEvent.prototype.transmitFile = function (filename, remotefilename, metadata) {
    var d = q.defer(), ret = d.promise;
    CGIUploadEvent.prototype.transmitFile.call(this, filename, remotefilename, metadata, transmitter.bind(null, d));
    d = null;
    return ret;
  };
  CGIUploadImageEvent.prototype.onAllTransmitted = function (res, url, fields, results) {
    if (!(lib.isArray(results) && results.length>0 && results[0].success)) {
      res.statusCode = 500;
    }
    res.end(results[0].remotefilepath);
    this.emitCGI(url, null, {data: fields, remotefilepath: results[0].remotefilepath, success: results[0].success});
    this.destroy();
  };
  CGIUploadImageEvent.prototype.sizesForImage = function (fields, files) {
    return this.imageSizes;
  };

  return CGIUploadImageEvent;
}
module.exports = createCGIUploadImageEvent;
