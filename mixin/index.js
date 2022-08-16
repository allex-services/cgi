function createSessionEventsMixin (execlib, leveldblib, jobondestroyablelib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    JobOnDestroyable = jobondestroyablelib.JobOnDestroyable;

  function RegisterSessionEventJob (cgi, session, type, prophash, defer) {
    //prophash has the id=lib.uid() already
    JobOnDestroyable.call(this, cgi, defer);
    this.session = session;
    this.type = type;
    this.prophash = prophash;
  }
  lib.inherit(RegisterSessionEventJob, JobOnDestroyable);
  RegisterSessionEventJob.prototype.destroy = function () {
    this.prophash = null;
    this.type = null;
    this.session = null;
    JobOnDestroyable.prototype.destroy.call(this);
  };
  RegisterSessionEventJob.prototype._destroyableOk = function () {
    var ret = JobOnDestroyable.prototype._destroyableOk.call(this);
    if (!ret) {
      return ret;
    }
    return this.session && this.session.destroyed;
  };
  RegisterSessionEventJob.prototype.go = function () {
    var ok = this.okToGo();
    if (!ok.ok) {
      return ok.val;
    }
    this.destroyable.sessionEventIDsDB.safeGet(this.session.session, []).then(
      this.onSessionEventIDs.bind(this),
      this.reject.bind(this)
    );
    return ok.val;
  };
  RegisterSessionEventJob.prototype.onSessionEventIDs = function (eventids) {
    if (!this.okToProceed()) {
      return;
    }
    eventids.push(this.prophash.id);
    this.destroyable.sessionEventIDsDB.put(this.session.session, eventids).then(
      this.onSessionEventIDsDone.bind(this),
      this.reject.bind(this)
    );
  };
  RegisterSessionEventJob.prototype.onSessionEventIDsDone = function () {
    if (!this.okToProceed()) {
      return;
    }
    this.prophash.session = this.session.session;
    this.destroyable.sessionEventsDB.put(this.prophash.id, {session: this.session.session, type: this.type, prophash: this.prophash}).then(
      this.onSessionEventsDone.bind(this),
      this.reject.bind(this)
    );
  };
  RegisterSessionEventJob.prototype.onSessionEventsDone = function () {
    var gate;
    if (!this.okToProceed()) {
      return;
    }
    gate = this.session.gate;
    if (this.destroyable.sessionGates.indexOf(gate)<0) {
      this.destroyable.sessionGates.push(gate);
    }
    this.resolve(this.prophash.id);
  };


  function UnregisterSessionEventJob (cgi, session) {
    JobOnDestroyable.call(this, cgi);
    this.session = session.session;
  }
  lib.inherit(UnregisterSessionEventJob, JobOnDestroyable);
  UnregisterSessionEventJob.prototype.destroy = function () {
    this.session = null;
    JobOnDestroyable.prototype.destroy.call(this);
  };
  UnregisterSessionEventJob.prototype.go = function () {
    var ok = this.okToGo();
    if (!ok.ok) {
      return ok.val;
    }
    this.destroyable.sessionEventIDsDB.get(this.session).then(
      this.onSessionEventIDs.bind(this),
      this.reject.bind(this)
    );
    return ok.val;
  };
  UnregisterSessionEventJob.prototype.onSessionEventIDs = function (eventids) {
    if (!this.okToProceed()) {
      return;
    }
    if (!lib.isArray(eventids)) {
      this.resolve(false);
    }
    q.all(eventids.map(this.sessionEventDeleter.bind(this))).then(
      this.onAllSessionEventsDeleted.bind(this)
    );
  };
  UnregisterSessionEventJob.prototype.sessionEventDeleter = function (sessid) {
    var ok = this.peekToProceed();
    if (!ok.ok) {
      return q.reject(val);
    }
    return this.destroyable.sessionEventsDB.del(sessid);
  };
  UnregisterSessionEventJob.prototype.onAllSessionEventsDeleted = function () {
    if (!this.okToProceed()) {
      return;
    }
    this.destroyable.sessionEventIDsDB.del(this.session).then(
      this.resolve.bind(this, true),
      this.reject.bind(this)
    );
  };

  function addToPath (path, add) {
    var ret;
    if (lib.isString(path)) {
      return [path, add];
    }
    if (lib.isArray(path)) {
      ret = path.slice();
      ret.push(add);
      return ret;
    }
    throw (new lib.Error('INVALID_PATH', 'Path '+path+' can be only a String or an Array'));
  }
  function SessionEventsMixin (prophash, factoryfunction, starteddefer) {
    if (!lib.isFunction(factoryfunction)) {
      throw new lib.Error('NO_FACTORY_FUNCTION', 'SessionEventsMixin expects the factoryfunction Function as its second construction parameter');
    }
    var edb = q.defer(), sdb = q.defer(), basename = prophash.sessioneventsdbname || lib.uid();
    this.factoryFunction = factoryfunction;
    this.sessionGates = [];
    this.sessionEventsDB = new leveldblib.LevelDBHandler({
      dbname: addToPath(basename, 'sessionevents.db'),
      initiallyempty: true,
      dbcreationoptions: {
        valueEncoding: 'json'
      },
      starteddefer: edb
    });
    this.sessionEventIDsDB = new leveldblib.LevelDBHandler({
      dbname: addToPath(basename, 'sessioneventids.db'),
      initiallyempty: true,
      dbcreationoptions: {
        valueEncoding: 'json'
      },
      starteddefer: sdb
    });
    this.sessionEventJobs = new qlib.JobCollection();
    if (starteddefer) {
      qlib.promise2defer(q.all([edb.promise, sdb.promise]), starteddefer);
    }
  }
  SessionEventsMixin.prototype.destroy = function () {
    if (this.sessionEventJobs) {
      this.sessionEventJobs.destroy();
    }
    this.sessionEventJobs = null;
    if (this.sessionEventIDsDB) {
      this.sessionEventIDsDB.destroy();
    }
    this.sessionEventIDsDB = null;
    if (this.sessionEventsDB) {
      this.sessionEventsDB.destroy();
    }
    this.sessionEventsDB = null;
    this.sessionGates = null;
    this.factoryFunction = null;
  };
  SessionEventsMixin.prototype.registerSessionEvent = function (session, type, prophash) {
    var eid, evnt;
    if (!lib.isFunction(this.factoryFunction)) {
      return q.reject(new lib.Error('ALREADY_DESTROYED', 'This instance of '+this.constructor.name+' is already destroyed'));
    }
    eid = lib.uid();
    prophash.id = eid;
    return this.sessionEventJobs.run('.', new RegisterSessionEventJob(this, session, type, prophash));
  };
  SessionEventsMixin.prototype.unregisterSessionEventsForSession = function (session) {
    this.sessionEventJobs.run('.', new UnregisterSessionEventJob(this, session));
  };
  SessionEventsMixin.prototype.instantiateEventById = function (evntid) {
    var t, ret;
    if (!this.sessionEventsDB) {
      return q.reject(new lib.Error('ALREADY_DESTROYED', 'This instance of '+this.constructor.name+' is already destroyed'));
    }
    t = this;
    ret = this.sessionEventsDB.get(evntid).then(
      onSessionEventFromDB.bind(null, t)
    );
    t = null;
    return ret;
  };
  var _evntcnt = 0;
  function onSessionEventFromDB (mixin, result) {
    var sessionid, session, evnt;
    if (!mixin) {
      return null;
    }
    if (!result) {
      return null;
    }
    sessionid = result.session;
    session = mixin.findUserSessionById(sessionid);
    if (!session) {
      return null;
    }
    result.prophash.session = session;
    evnt = mixin.factoryFunction(result.type, result.prophash);
    return evnt;
  };
  SessionEventsMixin.prototype.findUserSessionById = function (sessionid) {
    if (!this.sessionGates) {
      return null;
    }
    return this.sessionGates.reduce(sessionfinder.bind(null, sessionid), null);
  };
  function sessionfinder (sessionid, result, gate) {
    if (result) {
      return result;
    }
    return gate.sessions.get(sessionid);
  }

  SessionEventsMixin.addMethods = function (klass) {
    lib.inheritMethods(klass, SessionEventsMixin
      ,'registerSessionEvent'
      ,'unregisterSessionEventsForSession'
      ,'findUserSessionById'
      ,'instantiateEventById'
    );
  };

  return SessionEventsMixin;
}

module.exports = createSessionEventsMixin;
