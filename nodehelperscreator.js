var nodehelpersfunc = require('allex_nodehelpersserverruntimelib');
function createNodeHelpers (execlib) {
  'use strict';

  var instance;

  function getNodeHelpers () {
    if (!instance) {
      instance = nodehelpersfunc(execlib.lib);
    }
    return instance;
  }

  return getNodeHelpers;
}

module.exports = createNodeHelpers;
  
