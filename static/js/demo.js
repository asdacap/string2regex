
angular.module('string2regexdemo',['string2regex'])
.controller('MainController',function(){
  this.holder = {
    sample: 'Hi! I\'m a sample!',
    regex: ''
  };
});
