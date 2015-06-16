var execlib=require('hers_exectesting')();

execlib.test({
  debug_brk: false,
  debug: false,
  name:'CGI',
  modulepath:'./index.js',
  propertyhash: {
  }
},{
  debug_brk: false,
  debug: false,
  tests:[
  {
    count:2,
    role: 'service',
    tester:{
      count:2,
      modulepath:'./test/cgiservicetestercreator',
      propertyhash:{
      }
    }
  },
  {
    count:2,
    role: 'user',
    tester:{
      count:2,
      modulepath:'./test/cgiusertestercreator',
      propertyhash:{
      }
    }
  } 
  ]
});

