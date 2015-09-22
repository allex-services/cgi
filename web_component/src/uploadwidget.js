(function (lib, allex, module) {
  'use strict';

  module.factory('allex.jf.widget.UploadFileControllerF', ['allex.lib.form.BasicWidgetController', function (BasicWidgetController) {
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

    return UploadFileController;
  }]);

  module.controller('allex.jf.widget.UploadFileController', ['allex.jf.widget.UploadFileControllerF', '$scope', 
  function (UploadFileController, $scope) {
    new UploadFileController($scope);
  }]);

  module.directive ('allexJfWidgetUploadFile', ['allex.lib.form.widget_helpers', function(helpers) {
    return {
      'restrict': 'E',
      'replace' : true, 
      'controller': 'allex.jf.widget.UploadFileController',
      'scope': true,
      'templateUrl': 'partials/allex_cgiservice/partials/widgets/upload.html',
      'link': function (scope, el, attrs) {
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
    };
  }]);
  module.run ([ 'allex.lib.form.WidgetsRegistry',
      'allex.lib.form.DefaultWidgetsRegistry',
      'allex.lib.form.widget.descriptors',
      function (WidgetsRegistry, DefaultWidgetsRegistry, descriptors) {
        var DefaultWidgetDescriptor = descriptors.DefaultWidgetDescriptor;
        WidgetsRegistry.replace('file_upload','<allex-jf-widget-upload-file></allex-jf-widget-upload-file>');
      }
  ]);


})(ALLEX.lib, ALLEX, angular.module('allex.cgi'));
