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

  module.controller('allex.jf.widget.UploadFileController', ['$scope', 
  function ($scope) {
    new UploadFileController($scope);
  }]);

  module.directive ('allexJfWidgetUploadFile', ['$compile', function($compile) {
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
      helpers.bootwidget($compile, scope, el, $input);
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
