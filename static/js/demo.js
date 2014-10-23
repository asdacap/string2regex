
angular.module('string2regexdemo',['string2regex'])
.controller('MainController',function($scope){
  var self = this;
  this.holder = {
    sample: 'Hi! I\'m a sample!',
    regex: ''
  };

  this.result_json = '';

  this.set_json = function(){
    var obj = JSON.parse(this.result_json);
    _.extend(self.holder,obj);
  }

  this.update_json = function(){
    this.result_json = JSON.stringify(self.holder,undefined,2);
  }

  $scope.$watch(function(){
    return self.holder;
  },function(){
    self.update_json();
  },true);
});
