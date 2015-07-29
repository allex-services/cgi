(function (lib, allex, module) {
})(ALLEX.lib, ALLEX, angular.module('allex.cgi', ['ngFileUpload']));
//samo da te vidim
(function (lib, allex, module) {
  module.factory('allex.cgi.UploadMixIn', ['Upload', function (Upload) {
    var DEFAULT_SETTINGS = {
      allowDir: false,
      multiple: false,
      doDrop : true,
      accept: null,
      forget: true
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
      this._uploadStateM = user.getstateAndAttach({
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
        data: data
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
      if ('ok' === data) {
        if (this.uploadSettings.forget) this.uploadFiles.splice(0, this.uploadFiles.length);
        defer.resolve(this.uploadGetSuccessMessage());
      }else{
        defer.reject(data);
      }
    };

    UploadMixIn.prototype._onUploadError = function (defer, data, status, headers, config) {
      defer.reject(data);
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
//samo da te vidim
(function (lib, allex, module) {
  module.directive('allexCgiUpload', ['$compile', function ($compile) {
    ///- use UploadMixIn as parent scope ...
    ///- only most important attributes supported .. For more, visit https://github.com/danialfarid/ng-file-upload and add attributes to directive in markup ...
    return {
      'restrict': 'E',
      'replace' : true,
      'scope' : false,
      'template': '<div data-ng-model="_ctrl.uploadFiles" data-ngf-drag-over-class="dragover" ngf-multiple="{{_ctrl.uploadSettings.multiple}}" ngf-allow-dir="{{_ctrl.uploadSettings.allowDir}}" data-ngf-change="_ctrl.uploadOnFileDropped($files, $event, $rejected)"></div>',
      'link': function (scope, el) {
        var recompile = false;
        var s = scope._ctrl.uploadSettings;
        if (s.doDrop) {
          el.attr('data-ngf-drop', '');
          recompile = true;
        }

        if(s.accept) {
          el.attr('data-ngf-accept', s.accept);
          recompile = true;
        }

        if (recompile) {
          $compile(el)(scope);
        }
      }
    };
  }]);
})(ALLEX.lib, ALLEX, angular.module('allex.cgi'));
