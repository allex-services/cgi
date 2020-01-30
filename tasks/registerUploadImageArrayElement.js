function createRegisterUploadImageArrayElementTask (execlib, RegisterUploadImageTask) {
  'use strict';

  var lib = execlib.lib;

  function RegisterUploadImageArrayElementTask (prophash) {
    RegisterUploadImageTask.call(this, prophash);
  };
  lib.inherit(RegisterUploadImageArrayElementTask, RegisterUploadImageTask);
  RegisterUploadImageArrayElementTask.prototype.registrationMethodName = 'registerUploadImageArrayElement';

  return RegisterUploadImageArrayElementTask;
}
module.exports = createRegisterUploadImageArrayElementTask;
