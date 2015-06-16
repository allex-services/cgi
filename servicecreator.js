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
    this.server = http.createServer(this.onRequest.bind(this));
    var onStopped = this.onStopped.bind(this);
    this.server.on('close',onStopped);
    this.server.on('error',onStopped);
    this.events = new lib.Map();
    execSuite.firstFreePortStartingWith(8000).then(this.onListeningPort.bind(this));
  }
  ParentService.inherit(CGIService,factoryCreator);
  CGIService.prototype.__cleanUp = function(){
    this.events.destroy();
    this.events = null;
    if(this.server){
      this.server.close();
    }
    this.server = null;
    ParentService.prototype.__cleanUp.call(this);
  };
  CGIService.prototype.onListeningPort = function(port){
    this.server.listen(port,this.onStarted.bind(this,port));
  };
  CGIService.prototype.onStarted = function(port,error){
    if(!error){
      this.state.set('listening',port);
    }
  };
  CGIService.prototype.onStopped = function(){
    if(!this.destroyed){
      return;
    }
    this.server = null;
    this.state.remove('listening');
  };
  CGIService.prototype.onRequest = function(req,res){
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
