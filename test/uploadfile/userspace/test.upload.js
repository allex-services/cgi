var superagent = require('superagent');

var cgiEvent = new lib.HookCollection(),
  JobBase = qlib.JobBase;

function CGIEventListenerJob (eventname) {
  JobBase.call(this);
  this.eventname = eventname;
  this.listener = null;
}
lib.inherit(CGIEventListenerJob, JobBase);
CGIEventListenerJob.prototype.destroy = function () {
  if (this.listener) {
    this.listener.destroy();
  }
  this.listener = null;
  this.eventname = null;
  JobBase.prototype.destroy.call(this);
};
CGIEventListenerJob.prototype.go = function () {
  var ret = this.defer.promise;
  this.listener = cgiEvent.attach(this.onEvent.bind(this));
  return ret;
};
CGIEventListenerJob.prototype.onEvent = function (evnt) {
  if (!evnt) {
    return;
  }
  if (evnt.e !== this.eventname) {
    return;
  }
  if (evnt.success) {
    this.resolve(evnt.data);
    return;
  }
  this.reject(evnt.error);
};

function expectCGI(eventname) {
  return (new CGIEventListenerJob(eventname)).go();
}

function cgiUploadIt (title, urlname, uploadfilepath, _expect) {
  it(title, function () {
    this.timeout(5000);
    console.log(urlname, getGlobal(urlname));
    superagent
      .post('http://127.0.0.1:8280/_'+getGlobal(urlname))
      .attach('file', uploadfilepath)
      .catch(console.error.bind(console, 'post error'))
    return expect(expectCGI(getGlobal(urlname))).to.eventually.deep.include(_expect);
  });
}

function testSequenceForUser (username) {
  it('Acquire CGI', function () {
    return setGlobal('CGI', findSink('CGI', {role: 'user', name: username}));
  });
  it("Listen to CGI's cgi channel", function () {
    CGI.consumeChannel('cgi', cgiEvent.fire.bind(cgiEvent));
  });
  it('Register file upload', function () {
    return setGlobal('uploadURL', CGI.sessionCall('registerUpload', 'Files', {role: 'user', name: 'user'}));
  });
  cgiUploadIt('upload?', 'uploadURL', 'files/blah', {});
  it('Register file download', function () {
    return setGlobal('downloadURL', CGI.sessionCall('registerDownload'));
  });
  it('Register unique file upload', function () {
    return setGlobal('uploadUniqueURL', CGI.sessionCall('registerUploadUnique', 'Files', {role: 'user', name: 'user'}));
  });
  cgiUploadIt('upload unique?', 'uploadUniqueURL', 'files/blah', {});
  it('Register file verbatim contents upload', function () {
    return setGlobal('uploadContentsVerbatimURL', CGI.sessionCall('registerUploadContents'));
  });
  cgiUploadIt('upload verbatim contents?', 'uploadContentsVerbatimURL', 'files/thingy.json', {});
  it('Register file parseable contents upload', function () {
    return setGlobal('uploadContentsParsedURL', CGI.sessionCall('registerUploadContents', 'allex_jsonparser'));
  });
  cgiUploadIt('upload parseable contents?', 'uploadContentsParsedURL', 'files/thingy.json', {
    __file__: {
      name: 'thingy',
      type: 'some_thingy',
      size: 49,
      properties: {
        down: 'never',
        up: 7
      },
      wishes: ['big', 'strong', 'mighty']
    }
  });
  it('Destroy CGI sink', function () {
    CGI.destroy();
  });
}

describe ('Upload file plain', function () {
  loadMochaIntegration('allex_masterservice');
  for (var i=1; i<=30; i++) {
    testSequenceForUser('user'+i);
  }
});
