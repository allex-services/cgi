function createUser(execlib,ParentUser,dirlib,nodehelperscreator){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    execSuite = execlib.execSuite,
    UserSession,
    OOBChannel;

  if(!ParentUser){
    ParentUser = execlib.execSuite.ServicePack.Service.prototype.userFactory.get('user');
  }
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
    }],
    registerUploadUnique: [{
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
    }],
    registerUploadContents: [{
      title: 'Parser Module Name',
      type: 'string'
    },{
      title: 'boundfields',
      type: 'object'
    },{
      title: 'neededfields',
      type: 'array'
    }],
    registerUploadImage: [{
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
    },{
      title: 'imagesizes',
      type: 'array'
    }],
    registerUploadImageArrayElement: [{
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
    },{
      title: 'imagesizes',
      type: 'array'
    }]
  });
  CGIUserSession.prototype.startTheDyingProcedure = function(){
    if (!(this.user && this.user.__service)) {
      return;
    }
    this.user.__service.unregisterSessionEventsForSession(this);
    UserSession.prototype.startTheDyingProcedure.call(this);
  };
  CGIUserSession.prototype.registerDownload = function(neededfields,defer){
    qlib.promise2defer(this.user.__service.registerSessionEvent(this, 'download', {
      session: this,
      neededfields: neededfields
    }), defer);
  };
  CGIUserSession.prototype.registerUpload = function(targetsinkname,identityattargetsink,boundfields,neededfields,defer){
    qlib.promise2defer(this.user.__service.registerSessionEvent(this, 'upload', {
      boundfields: boundfields,
      neededfields: neededfields,
      targetsinkname: targetsinkname,
      identityattargetsink: identityattargetsink
    }), defer);
  };
  CGIUserSession.prototype.registerUploadUnique = function(targetsinkname,identityattargetsink,boundfields,neededfields,defer){
    qlib.promise2defer(this.user.__service.registerSessionEvent(this, 'uploadunique', {
      boundfields: boundfields,
      neededfields: neededfields,
      targetsinkname: targetsinkname,
      identityattargetsink: identityattargetsink
    }), defer);
  };
  CGIUserSession.prototype.registerUploadContents = function(parsermodulename,boundfields,neededfields,defer){
    qlib.promise2defer(this.user.__service.registerSessionEvent(this, 'uploadcontents', {
      parsermodulename: parsermodulename,
      boundfields: boundfields,
      neededfields: neededfields
    }), defer);
  };
  CGIUserSession.prototype.registerUploadImage = function(targetsinkname,identityattargetsink,boundfields,neededfields,imagesizes,defer){
    qlib.promise2defer(this.user.__service.registerSessionEvent(this, 'uploadimage', {
      boundfields: boundfields,
      neededfields: neededfields,
      imagesizes: imagesizes,
      targetsinkname: targetsinkname,
      identityattargetsink: identityattargetsink
    }), defer);
  };
  CGIUserSession.prototype.registerUploadImageArrayElement = function(targetsinkname,identityattargetsink,boundfields,neededfields,imagesizes,defer){
    qlib.promise2defer(this.user.__service.registerSessionEvent(this, 'uploadimagearrayelement', {
      boundfields: boundfields,
      neededfields: neededfields,
      imagesizes: imagesizes,
      targetsinkname: targetsinkname,
      identityattargetsink: identityattargetsink
    }), defer);
  };

  function User(prophash){
    ParentUser.call(this,prophash);
    this.downloads = new lib.Map();
  }
  ParentUser.inherit(User,require('../methoddescriptors/user'),['port'/*visible state fields here*/]/*or a ctor for StateStream filter*/);
  User.prototype.__cleanUp = function () {
    if (this.downloads) {
      lib.containerDestroyAll(this.downloads);
      this.downloads.destroy();
    }
    this.downloads = null;
    ParentUser.prototype.__cleanUp.call(this);
  };
  User.prototype.takeDownloadHeaders = function (downloadid, headers, defer) {
    //console.log('takeDownloadHeaders', downloadid, headers);
    var download = this.downloads.get(downloadid);
    if (!download) {
      defer.reject(new lib.Error('NO_DOWNLOAD_JOB', downloadid));
      return;
    }
    try {
      headers = JSON.parse(headers);
    }
    catch (e) {
      download.reject(e);
      defer.resolve(false);
    }
    download.takeHeaders(headers);
    defer.resolve(true);
  };
  User.prototype.takeDownloadContents = function (downloadid, contents, defer) {
    //console.log('takeDownloadContents', downloadid, contents);
    var download = this.downloads.get(downloadid);
    if (!download) {
      defer.reject(new lib.Error('NO_DOWNLOAD_JOB', downloadid));
      return;
    }
    download.takeContents(contents);
    defer.resolve(true);
  };
  User.prototype.getSessionCtor = execSuite.userSessionFactoryCreator(CGIUserSession);

  return User;
}

module.exports = createUser;
