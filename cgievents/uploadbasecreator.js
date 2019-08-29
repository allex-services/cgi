var formidable = require('formidable');
function createCGIUploadEventBase (execlib, CGIEventBase) {
  'use strict';

  var lib = execlib.lib;
   
  function CGIUploadEventBase(session,id,boundfields,neededfields){
    CGIEventBase.call(this,session,id,boundfields,neededfields);
  }
  lib.inherit(CGIUploadEventBase,CGIEventBase);
  CGIUploadEventBase.prototype.destroy = function () {
    CGIEventBase.prototype.destroy.call(this);
  };
  CGIUploadEventBase.prototype.triggerGET = function (req, res, url) {
    res.end();
  };

  /*
  CGIUploadEventBase.prototype._onIncomingData = function (req, res, chunk) {
    console.log('===>', chunk.toString('utf8'));
  };

  CGIUploadEventBase.prototype._onDataDone = function (req, res, data) {
    res.end('ok');
  };
  */

  CGIUploadEventBase.prototype.triggerPOST = function (req, res, url) {
    /*
    console.log('req headers',req);//.headers['content-type']);
    req.on('data', this._onIncomingData.bind(this, req, res));
    req.on('end', this._onDataDone.bind(this, req, res));
    */
    var form = new formidable.IncomingForm();
    form.parse(req, this.onUploadParsed.bind(this, req, res, url));
  };
  CGIUploadEventBase.prototype.onUploadParsed = function (req, res, url, err, fields, files) {
    //console.log('fields', fields);
    if (!this.checkNeededFieldsOnUploadParsed(fields, url, res)) {
      return;
    }
    lib.extend(fields, this.boundfields);
    this.onUploadParsedCorrect(req, res, url, fields, files);
  };
  CGIUploadEventBase.prototype.checkNeededFieldsOnUploadParsed = function (fields, url, res) {
    if (!this.hasNeededFields(fields)) {
      console.error('needed fields not satisfied, mine', this.neededfields, 'got', fields);
      this.emitCGI(url, null, {error: 'needed fields not satisfied'});
      res.statusCode = 412; //precondition failed
      res.end();
      return false;
    };
    return true;
  };

  return CGIUploadEventBase;
}

module.exports = createCGIUploadEventBase;
