
angular.module('string2regex',[])
.directive('string2regex',function(){
  return {
    scope: {
      holder: '=string2regex'
    },
    controllerAs: 'string2regex',
    link: function(scope, element, attrs, controllers){
      var holder = scope.holder;

      function generateGroups(string){
      }

      scope.groups = generateGroups(holder.sample);
    },
    templateUrl: 'string2regex-template.html'
  };
});
