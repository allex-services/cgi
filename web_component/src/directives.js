(function (lib, allex, module) {
  module.directive('allexCgiUpload', ['$compile', function ($compile) {
    ///- use UploadMixIn as parent scope ...
    ///- only most important attributes supported .. For more, visit https://github.com/danialfarid/ng-file-upload and add attributes to directive in markup ...

    return {
      'restrict': 'E',
      'replace' : true,
      'scope' : false,
      'template': '<button class="btn btn-primary" data-ng-model="_ctrl.uploadFiles" data-ngf-drag-over-class="dragover" ngf-multiple="{{_ctrl.uploadSettings.multiple}}" ngf-allow-dir="{{_ctrl.uploadSettings.allowDir}}" data-ngf-change="_ctrl.uploadOnFileDropped($files, $event, $rejected)"></button>',
      'link': function (scope, el, attrs) {
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
    };
  }]);

  module.factory('allex.cgi.FormUploadInputControllerF', [function () {
    var WIDGET_DEFAULTS = {
      'ngf-drop-disabled' : true,
      'ngf-multiple': false,
      'accept':'*',
      'ngf-allow-dir': false
    };
    function FormUploadInputController ($scope) {
      lib.BasicController.call(this, $scope);
      var _parent = $scope.$parent;
      this.widget_config = angular.extend({}, WIDGET_DEFAULTS , (_parent._ctrl.getWidgetConfig() || {}).ngfupload);
    }
    lib.inherit(FormUploadInputController, lib.BasicController);
    FormUploadInputController.prototype.__cleanUp = function () {
      this.ig = null;
      this.uploadFiles = null;
      this.widget_config = null;
      lib.BasicController.prototype.__cleanUp.call(this);
    };

    FormUploadInputController.prototype.onFile = function ($files, $file, $event) {
      this.set('files', $files);
    };

    FormUploadInputController.prototype.set_files = function ($files) {
      var _parent = this.scope.$parent;
      _parent.formctrl.vals[_parent.index] = $files;
      _parent.formctrl.$apply();
    };

    FormUploadInputController.prototype.get_files = function ($files) {
      var _parent = this.scope.$parent;
      return _parent.formctrl.vals[_parent.index];
    };
    return FormUploadInputController;
  }]);

  module.controller('allex.cgi.FormUploadInputController', ['$scope', 'allex.cgi.FormUploadInputControllerF', function ($scope, FormUploadInputController) {
    new FormUploadInputController($scope);
  }]);

  module.directive ('allexFormUploadInput', function () {
    return {
      restrict: 'E',
      template: '<div><button type="file" accept="{{_ctrl.widget_config.accept}}" data-ngf-select data-ngf-change="_ctrl.onFile($files, $file, $event)" class="btn btn-default btn-block"><span data-ng-show="!_ctrl.get(\'files\').length">Choose file</span><span data-ng-show="_ctrl.get(\'files\').length">{{_ctrl.get(\'files\').length}} file selected</span></button><allex-form-input-emulator></allex-form-input-emulator></div>',
      replace: true,
      controller: 'allex.cgi.FormUploadInputController'
    };
  });
})(ALLEX.lib, ALLEX, angular.module('allex.cgi'));
