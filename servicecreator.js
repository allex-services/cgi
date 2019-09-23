var http = require('http'),
  Url = require('url');
function createCGIService(execlib,ParentService,dirlib,leveldblib, jobondestroyablelib, httprequestparamextlib){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    execSuite = execlib.execSuite,
    nodehelperscreator = require('./nodehelperscreator')(execlib),
    SessionEventsMixin = require('./mixin')(execlib, leveldblib, jobondestroyablelib),
    cgiEventFactory = require('./cgievents')(execlib,dirlib,nodehelperscreator, httprequestparamextlib, jobondestroyablelib);

  function factoryCreator(parentFactory){
    return {
      'service': require('./users/serviceusercreator')(execlib,parentFactory.get('service')),
      'user': require('./users/usercreator')(execlib,parentFactory.get('user'),dirlib,nodehelperscreator) 
    };
  }

  function CGIService(prophash){
    var sed = q.defer();
    ParentService.call(this,prophash);
    SessionEventsMixin.call(this, prophash, cgiEventFactory, sed);
    qlib.promise2defer(sed.promise, this.readyToAcceptUsersDefer);
  }
  ParentService.inherit(CGIService,factoryCreator);
  SessionEventsMixin.addMethods(CGIService);
  CGIService.prototype.__cleanUp = function(){
    SessionEventsMixin.prototype.destroy.call(this);
    ParentService.prototype.__cleanUp.call(this);
  };
  CGIService.prototype.isInitiallyReady = function (prophash) {
    return false;
  };
  CGIService.prototype.acquirePort = function(defer){
    execSuite.firstFreePortStartingWith(8000).done(
      defer.resolve.bind(defer),
      defer.reject.bind(defer)
    );
  };
  CGIService.prototype._onPortAcquired = function (port) {
    ParentService.prototype._onPortAcquired.call(this,port);
    this.state.set('port',port);
  };
  CGIService.prototype._onRequest = function(req,res){
    if(req.url.charAt(1)!=='_'){
      res.end();
      return;
    }
    var url = Url.parse(req.url,true,true),
      _req = req,
      _res = res,
      _url = url,
      evntid = url.pathname.substring(2),
      _evntid = evntid;

    this.instantiateEventById(evntid).then(
      this.onRequestEvent.bind(this, _req, _res, _url, _evntid),
      _res.end.bind(_res, '{}')
    );
    _url = null;
    _req = null;
    _res = null;
    _evntid = null;
  };
  CGIService.prototype.onRequestEvent = function (req, res, url, evntid, evnt) {
    if(!evnt){
      res.end('{"error": "No event for '+evntid+'"}');
      return;
    }
    evnt.trigger(req,res,url);
  };
  
  return CGIService;
}

module.exports = createCGIService;
