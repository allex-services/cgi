function createUser(execlib,ParentUser){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    execSuite = execlib.execSuite,
    UserSession = execSuite.UserSession;
  if(!ParentUser){
    ParentUser = execlib.execSuite.ServicePack.Service.prototype.userFactory.get('user');
  }

  function CGIUserSession(user,session,gate){
    UserSession.call(this,user,session,gate);
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
      gevents.remove(evntid);
    });
    UserSession.prototype.startTheDyingProcedure.call(this);
  };
  CGIUserSession.prototype.registerEvent = function(username,defer){
    var evnt = {
          username: username||this.user.get('name'),
          session: this
        },
        evntid = lib.uid();
    this.user.__service.events.add(evntid,evnt);
    defer.resolve(evntid);
  };
  CGIUserSession.prototype.consumeEvent = function(evnt,req,res){
    res.end("You're ok");
  };


  function User(prophash){
    ParentUser.call(this,prophash);
  }
  ParentUser.inherit(User,require('../methoddescriptors/user'),[/*visible state fields here*/]/*or a ctor for StateStream filter*/);
  User.prototype.__cleanUp = function(){
    ParentUser.prototype.__cleanUp.call(this);
  };
  User.prototype.getSessionCtor = execSuite.userSessionFactoryCreator(CGIUserSession);

  return User;
}

module.exports = createUser;
