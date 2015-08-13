function createUser(execlib,ParentUser){
  'use strict';
  var cgiEventFactory = require('./cgieventfactorycreator')(execlib),
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
    registerDownload: [{
      title: 'neededfields',
      type: 'array'
    }],
    registerUpload: [{
      title: 'Target Sink Name',
      type: 'string'
    },{
      title: 'Identity at target Sink',
      type: 'object'
    },{
      title: 'boundfields',
      type: 'object'
    },{
      title: 'neededfields',
      type: 'array'
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
  CGIUserSession.prototype.registerDownload = function(neededfields,defer){
    var evnt = new (cgiEventFactory('download'))(this,lib.uid(),neededfields);
    this.user.__service.events.add(evnt.id,evnt);
    defer.resolve(evnt.id);
  };
  CGIUserSession.prototype.registerUpload = function(targetsinkname,identityattargetsink,boundfields,neededfields,defer){
    var evnt = new (cgiEventFactory('upload'))(this,lib.uid(),boundfields,neededfields,targetsinkname,identityattargetsink);
    this.user.__service.events.add(evnt.id,evnt);
    defer.resolve(evnt.id);
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
    this.headers = options.headers;
  }
  lib.inherit(DownloadTcpServer,UserTcpServer);
  DownloadTcpServer.prototype.destroy = function () {
    if(this.response && !this.headers){
      this.response.end();
    }
    this.headers = null;
    this.response = null;
    this.session = null;
    UserTcpServer.prototype.destroy.call(this);
  };
  DownloadTcpServer.prototype.processTransmissionPacket = function(server,connection,data){
    if (this.headers) {
      this.writeHeaders(data);
    } else {
      this.response.write(data);
    }
  };
  DownloadTcpServer.prototype.writeHeaders = function (data) {
    try {
      var h = JSON.parse(data);
      lib.traverseShallow(h, this.setHeader.bind(this));
    } catch (ignore) {}
  };
  DownloadTcpServer.prototype.setHeader = function (value, name) {
    this.response.setHeader(name, value);
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
