var http = require('http'),
  Url = require('url');
function createCGIService(execlib,ParentServicePack){
  'use strict';
  var lib = execlib.lib,
    execSuite = execlib.execSuite,
    ParentService = ParentServicePack.Service;

  function factoryCreator(parentFactory){
    return {
      'service': require('./users/serviceusercreator')(execlib,parentFactory.get('service')),
      'user': require('./users/usercreator')(execlib,parentFactory.get('user')) 
    };
  }

  function CGIService(prophash){
    ParentService.call(this,prophash);
    this.events = new lib.Map();
  }
  ParentService.inherit(CGIService,factoryCreator);
  CGIService.prototype.__cleanUp = function(){
    this.events.destroy();
    this.events = null;
    ParentService.prototype.__cleanUp.call(this);
  };
  CGIService.prototype.acquirePort = function(defer){
    execSuite.firstFreePortStartingWith(8000).done(
      defer.resolve.bind(defer),
      defer.reject.bind(defer)
    );
  };
  CGIService.prototype._onRequest = function(req,res){
    console.log('got request',req.url);
    if(req.url.charAt(1)!=='_'){
      res.end();
      return;
    }
    var url = Url.parse(req.url,true,true),
      evntid = url.pathname.substring(2),
      evnt = this.events.remove(evntid),
      session;
    console.log('parsed url',url,evntid,'=>',evnt);
    if(!evnt){
      res.end();
      return;
    }
    session = evnt.session;
    if(!session){
      res.end();
      return;
    }
    session.consumeEvent(evnt,req,res);
  };
  
  return CGIService;
}

module.exports = createCGIService;
