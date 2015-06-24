function createUser(execlib,ParentUser){
  'use strict';
  var CGIEvent = require('./cgieventcreator')(execlib),
    lib = execlib.lib,
    q = lib.q,
    execSuite = execlib.execSuite,
    UserTcpServer,
    UserSession,
    OOBChannel;

  if(!ParentUser){
    ParentUser = execlib.execSuite.ServicePack.Service.prototype.userFactory.get('user');
  }
  UserTcpServer = ParentUser.prototype.TcpTransmissionServer;
  UserSession = ParentUser.prototype.getSessionCtor('.');
  OOBChannel = UserSession.Channel;

  function CGIChannel(usersession,name){
    OOBChannel.call(this,usersession,name);
  }
  lib.inherit(CGIChannel,OOBChannel);
  CGIChannel.prototype.name = 'cgi';

  function CGIUserSession(user,session,gate){
    UserSession.call(this,user,session,gate);
    this.addChannel(CGIChannel);
  }
  UserSession.inherit(CGIUserSession,{
    registerEvent: [{
      title: 'username',
      type: 'string'
    }]
  });
  CGIUserSession.prototype.startTheDyingProcedure = function(){
    var myeventids = [], t = this, gevents = this.user.__service.events;
    gevents.traverse(function(evnt,evntid){
      if(evnt.session === t){
        myeventids.push(evntid);
      }
    });
    myeventids.forEach(function(evntid){
      gevents.remove(evntid).destroy();
    });
    UserSession.prototype.startTheDyingProcedure.call(this);
  };
  CGIUserSession.prototype.registerEvent = function(username,defer){
    var evnt = new CGIEvent(this,lib.uid(),username);
    this.user.__service.events.add(evnt.id,evnt);
    defer.resolve(evnt.id);
  };
  CGIUserSession.prototype.consumeEvent = function(evntid,evnt,req,res,url){
    var data;
    res.end("Your event:"+evntid);
    if(req.method==='POST'){
      req.on('end',this.announceEvent.bind(this,evntid,evnt,req,res,url,data));
      data = '';
      req.on('data',function(chunk){
        data += chunk;
      });
    }else{
      this.announceEvent(evntid,evnt,req,req,url,data);
    }
  };
  CGIUserSession.prototype.announceEvent = function(evntid,evnt,req,res,url,body){
    this.channels.get('cgi').onStream({
      e:evntid,
      query:url.query,
      body:body
    });
  };


  function DownloadTcpServer(user,options){
    if(!options.session){
      throw new lib.Error('DOWNLOAD_TCP_SERVER_MISSES_SESSION','Constructor for DownloadTcpServer misses the session field in its property hash');
    }
    if(!options.response){
      throw new lib.Error('DOWNLOAD_TCP_SERVER_MISSES_RESPONSE','Constructor for DownloadTcpServer misses the response field in its property hash');
    }
    UserTcpServer.call(this,user,options);
    this.session = options.session;
    this.response = options.response;
  }
  lib.inherit(DownloadTcpServer,UserTcpServer);
  DownloadTcpServer.prototype.destroy = function () {
    this.response = null;
    this.session = null;
    UserTcpServer.prototype.destroy.call(this);
  };
  DownloadTcpServer.prototype.processTransmissionPacket = function(server,connection,data){
    this.response.write(data);
  };

  function User(prophash){
    ParentUser.call(this,prophash);
  }
  ParentUser.inherit(User,require('../methoddescriptors/user'),['port'/*visible state fields here*/]/*or a ctor for StateStream filter*/);
  User.prototype.__cleanUp = function(){
    ParentUser.prototype.__cleanUp.call(this);
  };
  User.prototype.getSessionCtor = execSuite.userSessionFactoryCreator(CGIUserSession);
  User.prototype.TcpTransmissionServer = DownloadTcpServer;

  return User;
}

module.exports = createUser;
