(function (lib, allex, module) {
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
