function createCGIDownloadEvent (execlib, CGIEventBase) {
  'use strict';

  var lib = execlib.lib;

  function CGIDownloadEvent(session,id,neededfields){
    CGIEventBase.call(this,session,id,neededfields);
  }
  lib.inherit(CGIDownloadEvent,CGIEventBase);
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

  return CGIDownloadEvent;
}

module.exports = createCGIDownloadEvent;
