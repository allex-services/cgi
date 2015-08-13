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
})(ALLEX.lib, ALLEX, angular.module('allex.cgi'));
