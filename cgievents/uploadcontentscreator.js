function createCGIUploadContentsEvent (execlib, CGIUploadEventBase, dirlib, nodehelperscreator) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    Node = nodehelperscreator(),
    Path = Node.Path,
    Fs = Node.Fs;

  function CGIUploadContentsEvent (prophash) {
    CGIUploadEventBase.call(this, prophash);
    this.parsermodulename = prophash.parsermodulename;
    this.dirDB = null;
  }
  lib.inherit(CGIUploadContentsEvent, CGIUploadEventBase);
  CGIUploadContentsEvent.prototype.destroy = function () {
    if (this.dirDB) {
      this.dirDB.destroy();
    }
    this.dirDB = null;
    this.parsermodulename = null;
    CGIUploadEventBase.prototype.destroy.call(this);
  };

  CGIUploadContentsEvent.prototype.onUploadParsedCorrect = function (req, res, url, fields, files) {
    if (!files.file) {
      res.writeHead (412, 'Files not provided');
      res.end();
      this.destroy();
      return;
    }
    this.readFile(files.file.path).then(
      this.onFileRead.bind(this, url, files.file.path, fields, res),
      this.onFileNotRead.bind(this, url, files.file.path, res)
    );
  };

  function pusher (records, record) {
    records.push(record);
  }

  CGIUploadContentsEvent.prototype.readFile = function (filepath) {
    var filedir, filename, records, _recs, ret;
    filename = Path.basename(filepath);
    if (!this.dirDB) {
      filedir = Path.dirname(filepath);
      this.dirDB = new dirlib.DataBase(filedir);
    }
    if (this.parsermodulename) {
      records = [];
      _recs = records;
      ret =  this.dirDB.read(filename, {
        parsermodulename: this.parsermodulename
      }).then(
        this.dropFileOnParsedReadSuccess.bind(this, _recs, filename),
        this.dropFileOnReadError.bind(this, filename),
        pusher.bind(null, _recs)
      );
      _recs = null;
      return ret;
    }
    return plainreader(this.dirDB, filename).then(
      this.dropFileOnPlainReadSuccess.bind(this, filename),
      this.dropFileOnReadError.bind(this, filename)
    );
  };
  function plainreader (db, filename) {
    var d = q.defer(),
      ret = d.promise,
      r = db.read(filename, {}),
      contentsobj = {contents: null};
    db = null;
    r.then(
      function (result) {
        var res = contentsobj.contents;
        contentsobj = null;
        d.resolve(res ? res : Buffer.alloc(0))
        d = null;
      },
      function (reason) {
        contentsobj = null;
        d.reject(reason);
        d = null;
      },
      function (buff) {
        contentsobj.contents = contentsobj.contents ? Buffer.concat([contentsobj.contents, buff]) : buff;
      }
    )
    return ret;
  };
    
  CGIUploadContentsEvent.prototype.onFileRead = function (url, infilename, fields, res, contents) {
    res.end(lib.isString(contents) ? contents : JSON.stringify(contents));
    fields.__file__ = contents;
    this.emitCGI(url, null, {data: fields, success:true});
    this.destroy();
  };
  CGIUploadContentsEvent.prototype.onFileNotRead = function (url, infilename, res, reason) {
    res.statusCode = 500;
    res.end('{}');
    this.emitCGI(url, null, {error: reason});
    this.destroy();
  };
  CGIUploadContentsEvent.prototype.dropFileOnParsedReadSuccess = function (records, infilename, result) {
    var finalres, ret;
    finalres = (records.length>0) ? records : result;
    records = null;
    result = null;
    ret = this.dropFile(infilename).then(
      qlib.returner(finalres)
    );
    return ret;
  };
  function buffer2array (buff) {
    var ret = new Array(buff.length),
      i;
    for (i=0; i<buff.length; i++) {
      ret[i] = buff[i];
    }
    return ret;
  }
  CGIUploadContentsEvent.prototype.dropFileOnPlainReadSuccess = function (infilename, result) {
    return this.dropFile(infilename).then(
      qlib.returner(buffer2array(result))
    );
  };
  CGIUploadContentsEvent.prototype.dropFileOnReadError = function (infilename, reason) {
    var ret = this.dropFile(infilename).then(
      thrower.bind(null, reason)
    );
    reason = null;
    return ret;
  };
  function thrower (reason) {
    var _r = reason;
    reason = null;
    throw _r;
  }
  CGIUploadContentsEvent.prototype.dropFile = function (infilename) {
    if (this.dirDB) {
      return this.dirDB.drop(infilename);
    }
    return q(true);
  };

  return CGIUploadContentsEvent;
}

module.exports = createCGIUploadContentsEvent;
