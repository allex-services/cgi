(function (lib, allex, module) {
})(ALLEX.lib, ALLEX, angular.module('allex.cgi', ['ngFileUpload']));
//samo da te vidim
(function (lib, allex, module) {
  var allexcomponent = allex.WEB_COMPONENT,
    HttpStatusTranslator = allexcomponent.http.parseHttpResponseError;

  module.factory('allex.cgi.UploadMixIn', ['Upload', function (Upload) {
    var DEFAULT_SETTINGS = {
      uploadslugname: 'uploadURL',
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
      var monitorobj = {};
      monitorobj[this.uploadSettings.uploadslugname] = this.set.bind(this, 'uploadURL');
      this._uploadStateM = user.getStateAndAttach(monitorobj);
    };

    UploadMixIn.prototype.uploadOnFileDropped = function () {
      ///event triggered by the ngFileUpload
    };
    UploadMixIn.prototype.upload = function (data) {
      var d = lib.q.defer();
      Upload.upload({
        'url': this.uploadURL,
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
      if (!status) {
        defer.reject('Connectivity issues detected ...');
        return;
      }
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
//samo da te vidim
(function (lib, allex, module) {
  module.directive('allexCgiUpload', ['$compile', function ($compile) {
    ///- use UploadMixIn as parent scope ...
    ///- only most important attributes supported .. For more, visit https://github.com/danialfarid/ng-file-upload and add attributes to directive in markup ...
    function linkCgi (scope, el, attrs) {
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
      if (s.browse) {
        el.attr('data-ngf-select', 'true');
      }

      if (attrs.cgilabel) {
        el.html(attrs.cgilabel);
      }else{
        el.html('Upload files');
      }

      if (recompile) {
        $compile(el)(scope);
      }
    }

    return {
      'restrict': 'E',
      'replace' : true,
      'scope' : false,
      'template': '<button class="btn btn-primary" data-ng-model="_ctrl.uploadFiles" data-ngf-drag-over-class="dragover" ngf-multiple="{{_ctrl.uploadSettings.multiple}}" ngf-allow-dir="{{_ctrl.uploadSettings.allowDir}}" data-ngf-change="_ctrl.uploadOnFileDropped($files, $event, $rejected)"></button>',
      'link': linkCgi
    };
  }]);

})(ALLEX.lib, ALLEX, angular.module('allex.cgi'));
//samo da te vidim
(function (lib, allex, module) {
  'use strict';

  var allex_component = allex.WEB_COMPONENT,
    JSONFORM = allex_component.jsonform,
    WIDGETS = JSONFORM.widgets,
    DefaultWidgetDescriptor = JSONFORM.DefaultWidgetDescriptor,
    DefaultWidgetsRegistry = JSONFORM.DefaultWidgetsRegistry,
    WidgetsRegistry = JSONFORM.WidgetsRegistry,
    BasicWidgetController = JSONFORM.BasicWidgetController,
    GridController = JSONFORM.widgets.GridController,
    helpers = JSONFORM.helpers;


  function UploadFileController ($scope){
    BasicWidgetController.call(this, $scope);
  }
  lib.inherit(UploadFileController, BasicWidgetController);
  UploadFileController.prototype.__cleanUp = function () {
    BasicWidgetController.prototype.__cleanUp.call(this);
  };

  UploadFileController.prototype.get_default_config = function () {
    return UploadFileController.DEFAULT_CONFIG;
  };

  UploadFileController.DEFAULT_CONFIG = {
    allowDir: false,
    multiple: false,
    label: 'Upload files',
    accept: null,
    allowDrop: false,
    onChange: null
  };

  module.controller('allex.jf.widget.UploadFileController', ['allex.jf.widget.UploadFileControllerF', '$scope', 
  function (UploadFileController, $scope) {
    new UploadFileController($scope);
  }]);

  module.directive ('allexJfWidgetUploadFile', ['allex.lib.form.widget_helpers', function(helpers) {
    function link (scope, el, attrs) {
      var $input = el.find('button'),
        _ctrl = scope._ctrl,
        config = _ctrl.config,
        attributes = {
        'data-ngf-select': true
      };

      if (_ctrl.config.accept) {
        attributes.accept = _ctrl.config.accept;
      }
      if (_ctrl.config.allowDrop) attributes['data-ngf-drop'] = '';

      $input.attr(attributes);
      helpers.bootwidget(scope, el, $input);
    }

    return {
      'restrict': 'E',
      'replace' : true, 
      'controller': 'allex.jf.widget.UploadFileController',
      'scope': true,
      'templateUrl': 'partials/allex_cgiservice/partials/widgets/upload.html',
      'link': link
    };
  }]);

  WidgetsRegistry.replace('file_upload','<allex-jf-widget-upload-file></allex-jf-widget-upload-file>');
})(ALLEX.lib, ALLEX, angular.module('allex.cgi'));
