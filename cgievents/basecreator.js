function createCGIEventBase (execlib) {
  'use strict';

  function CGIEventBase(session,id,boundfields,neededfields){
    this.id = id;
    this.session = session;
    this.boundfields = boundfields || {};
    this.neededfields = neededfields || [];
  }
  CGIEventBase.prototype.destroy = function(){
    this.boundfields = null;
    this.neededfields = null;
    this.session = null;
    this.id = null;
  };
  CGIEventBase.prototype.user = function(){
    if(!this.session){
      return null;
    }
    return this.session.user;
  }
  CGIEventBase.prototype.service = function(){
    var user = this.user();
    if(!user){
      return null;
    }
    return user.__service;
  };
  CGIEventBase.prototype.trigger = function (req,res,url) {
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
  CGIEventBase.prototype.urlTargetsMyGet = function (url) {
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
  CGIEventBase.prototype.emitCGI = function (url,body,obj) {
    if(!(this.session && this.session.channels)){
      return;
    }
    obj.e = this.id;
    obj.query = url.query;
    obj.body = body;
    this.session.channels.get('cgi').onStream(obj);
  };
  CGIEventBase.prototype.hasNeededFields = function(obj){
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

  return CGIEventBase;
}

module.exports = createCGIEventBase;
