function createCGIUploadImageArrayElementEvent (execlib, CGIUploadImageEvent) {
  'use strict';

  var lib = execlib.lib;

  function CGIUploadImageArrayElementEvent (prophash) {
    CGIUploadImageEvent.call(this, prophash);
  }
  lib.inherit(CGIUploadImageArrayElementEvent, CGIUploadImageEvent);
  CGIUploadImageArrayElementEvent.prototype.sizesForImage = function (fields, files) {
    var imageIndex = fields.imageIndex;
    if (lib.isArray(this.imageSizes)) {
      return this.imageSizes[imageIndex];
    }
    if (lib.isArray(this.imageSizes.sizes)) {
      return this.imageSizes.sizes[imageIndex] || this.imageSizes.default;
    }
  };

  return CGIUploadImageArrayElementEvent;
}
module.exports = createCGIUploadImageArrayElementEvent;
