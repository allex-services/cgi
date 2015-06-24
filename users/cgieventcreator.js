function createCGIEvent(execlib){
  'use strict';
  var lib = execlib.lib,
    q = lib.q;

  function CGIEvent(session,id,username){
    this.id = id;
    this.session = session;
    this.username = username || this.user().get('name');
  }
  CGIEvent.prototype.destroy = function(){
    this.username = null;
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
      res.end();
      return;
    }
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
    if(url && url.query && url.query.username === this.username){
      return true;
    }
    return false;
  };
  CGIEvent.prototype.triggerGET = function (req, res, url) {
    this.triggerDownload(res);
  };
  CGIEvent.prototype.triggerPOST = function (req, res, url) {
    res.end();
  };
  CGIEvent.prototype.emitCGI = function (obj){
    if(!this.session){
      return;
    }
    obj.e = this.id;
    this.session.channels.get('cgi').onStream(obj);
  };
  CGIEvent.prototype.triggerDownload = function (res) {
    var user = this.user();
    if(!user){
      res.end();
      return;
    }
    var d = q.defer();
    user.requestTcpTransmission({session:this.session,response:res},d);
    d.promise.done(
      this.emitCGI.bind(this)
    );
  };

  return CGIEvent;
}

module.exports = createCGIEvent;
