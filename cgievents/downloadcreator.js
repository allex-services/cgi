function createCGIDownloadEvent (execlib, CGIEventBase, httprequestparamextlib, jobondestroyablelib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    JobOnDestroyable = jobondestroyablelib.JobOnDestroyable;

  function DownloadJob (session, res, defer) {
    JobOnDestroyable.call(this, session, defer);
    this.res = res;
    this.id = lib.uid();
  }
  lib.inherit(DownloadJob, JobOnDestroyable);
  DownloadJob.prototype.destroy = function () {
    var user = this.user();
    if (this.id && user && user.downloads) {
      user.downloads.remove(this.id);
    }
    if (this.res) {
      this.res.end();
    }
    this.res = null;
    this.id = null;
    JobOnDestroyable.prototype.destroy.call(this);
  };
  DownloadJob.prototype.go = function () {
    var ok = this.okToGo(), user;
    if (!ok.ok) {
      return ok.val;
    }
    user = this.user();
    if (!user) {
      return ok.val;
    }
    user.downloads.add(this.id, this);
    return ok.val;
  };
  DownloadJob.prototype.takeHeaders = function (headers) {
    if (!this.okToProceed()) {
      return;
    }
    if (!this.res) {
      this.reject(new lib.Error('NO_RESPONSE_TO_WRITE_TO', 'This DownloadJob has no http response'));
      return;
    }
    lib.traverseShallow(headers, this.setHeader.bind(this));
  };
  DownloadJob.prototype.setHeader = function (value, name) {
    this.res.setHeader(name, value);
  };
  DownloadJob.prototype.takeContents = function (contents) {
    if (!contents) {
      this.resolve(true);
      return;
    }
    this.res.write(contents);
  };
  DownloadJob.prototype.user = function () {
    if (!this.okToProceed()) {
      return null;
    }
    if (!this.destroyable.user) {
      this.reject(new lib.Error('NO_SESSION_USER', 'The session has no user'));
      return null;
    }
    return this.destroyable.user;
  };

  function CGIDownloadEvent(prophash /*session,id,neededfields*/){
    CGIEventBase.call(this, prophash);
  }
  lib.inherit(CGIDownloadEvent,CGIEventBase);
  CGIDownloadEvent.prototype.triggerGET = function (req, res, url) {
    this.triggerTransmission(res,url, httprequestparamextlib.readRequestQuery(req));
  };
  CGIDownloadEvent.prototype.triggerPOST = function (req, res, url) {
    httprequestparamextlib.readRequestBody(req).then(
      this.triggerTransmission.bind(this, res,url)
    );
    //res.end();
  };
  CGIDownloadEvent.prototype.triggerTransmission = function (res,url,fields) {
    var user = this.user(), job;
    if(!user){
      res.end();
      return;
    }
    /*
    var hd = q.defer(); //headers defer
    user.requestTcpTransmission({session:this.session,response:res,headers:true},hd);
    var cd = q.defer(); //contents defer
    user.requestTcpTransmission({session:this.session,response:res},cd);
    q.allSettled([hd.promise,cd.promise]).done(
      this.onRequestsDone.bind(this, res, url, fields)
    );
    */
    job = new DownloadJob(this.session, res);
    job.go();
    this.emitCGI(url, null, {data:fields, jobid: job.id});
    this.destroy();
  };
  CGIDownloadEvent.prototype.onRequestsDone = function (res, url, fields, promises) {
    var hd = promises[0], cd = promises[1];
    if (!(hd.state==='fulfilled' && cd.state==='fulfilled')){
      //TODO: here there will be ugly, browser will open an empty page...
      return;
    }
    this.emitCGI(url, null, {
      data: fields,
      headers: hd.value,
      contents: cd.value
    });
    this.destroy();
  };
  /*
  CGIDownloadEvent.prototype.onHeadersRequestObj = function (res, url, body, obj) {
    obj.headersneeded = true;
    this.emitCGI(url, body, obj);
  };
  */

  return CGIDownloadEvent;
}

module.exports = createCGIDownloadEvent;
