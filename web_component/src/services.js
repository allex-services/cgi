(function (lib, allex, module) {
  module.factory('allex.cgi.UploadMixIn', ['Upload', 'allex.lib.parseHttpResponseError', function (Upload, HttpStatusTranslator) {
    var DEFAULT_SETTINGS = {
      allowDir: false,
      multiple: false,
      doDrop : true,
      accept: null,
      forget: true,
      browse: true
    };
    function UploadMixIn ($scope, settings) {
      this.uploadSettings = angular.extend({}, DEFAULT_SETTINGS, settings);
      this._uploadStateM = null;
      this.uploadURL = null;
      this.uploadFiles = null;
    }

    UploadMixIn.prototype.__cleanUp = function () {
      this.uploadSettings = null;
      if (this._uploadStateM) this._uploadStateM.destroy();
      this._uploadStateM = null;
      this.uploadURL = null;
      this.uploadFiles = null;
    };

    UploadMixIn.prototype.uploadSetUser = function (user) {
      if (this._uploadStateM) this._uploadStateM.destroy();
      this._uploadStateM = null;
      if (!user) return;
      this._uploadStateM = user.getStateAndAttach({
        uploadURL: this.set.bind(this, 'uploadURL')
      });
    };

    UploadMixIn.prototype.uploadOnFileDropped = function () {
      ///event triggered by the ngFileUpload
    };
    UploadMixIn.prototype.upload = function (data) {
      var d = lib.q.defer();
      Upload.upload({
        'url': this.get('uploadURL'),
        'file':this.get('uploadFiles'),
        'method': 'POST',
        'fields': data
      })
      .progress(this._onUploadProgress.bind(this, d))
      .success(this._onUploadSuccess.bind(this, d))
      .error(this._onUploadError.bind(this, d));
      return d.promise;
    };

    UploadMixIn.prototype._onUploadProgress = function (defer, evnt){
      defer.notify(parseInt(100*(evnt.loaded/evnt.total)));
    };

    UploadMixIn.prototype._onUploadSuccess = function (defer, data, status, headers, config) {
      //if ('ok' === data) {
        ///za sad ...
      if (true) {
        if (this.uploadSettings.forget) this.uploadFiles.splice(0, this.uploadFiles.length);
        defer.resolve(this.uploadGetSuccessMessage());
      }else{
        defer.reject(data);
      }
    };

    UploadMixIn.prototype._onUploadError = function (defer, data, status, headers, config) {
      if (data.length) {
        return defer.reject(data);
      }
      defer.reject(HttpStatusTranslator(status));
    };


    UploadMixIn.prototype.uploadGetSuccessMessage = function () {
      return 'Successfully done';
    };

    UploadMixIn.addMethods = function (extended) {
      lib.inheritMethods(extended, UploadMixIn, '_onUploadProgress', '_onUploadSuccess', '_onUploadError', 'uploadOnFileDropped', 'upload', 'uploadSetUser', 'uploadGetSuccessMessage');
    };

    return UploadMixIn;
  }]);
})(ALLEX.lib, ALLEX, angular.module('allex.cgi'));
