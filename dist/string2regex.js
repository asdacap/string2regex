/*! string2regex - v0.0.1 - 2014-10-20
* Copyright (c) 2014 ; Licensed  */

angular.module('string2regex',[])
.value('String2RegexConfiguration',{
  groupColors:[
    "#F5A9A9",
    "#F3E2A9",
    "#D0F5A9",
    "#A9F5BC",
    "#A9F5F2",
    "#A9BCF5",
    "#D0A9F5",
    "#F5A9E1"
  ],
  characterClassFunction: function(char){ // Return an array of string corresponding to the character class.
    var result = [];
    if(char >= '0' && char <= '9'){
      result.push('number');
    }
    if(char >= 'a' && char <= 'z'){
      result.push('lowercase');
    }
    if(char >= 'A' && char <= 'Z'){
      result.push('uppercase');
    }
    if(_.contains(result,'lowercase') || _.contains(result,'uppercase')){
      result.push('alphabet');
    }
    if(_.contains(result,'alphabet') || _.contains(result,'number')){
      result.push('alphanumerical');
    }
    if(char === ' '){
      result.push('space');
    }else{
      result.push('nonspace');
    }
    if(!_.contains(result,'alphanumerical') && !_.contains(result,'space')){
      result.push('symbol');
    }
    result.push('any');
    return result;
  },
  defaultClass: 'any'
})
.controller('String2RegexCtrl',['$scope','String2RegexConfiguration',function($scope,String2RegexConfiguration){
  var holder = $scope.holder;
  var groupColors = String2RegexConfiguration.groupColors;
  var getCharacterClass = String2RegexConfiguration.characterClassFunction;
  var defaultClass = String2RegexConfiguration.defaultClass;

  // common class is character class which every character in the string have.
  function getCommonCharacterClass(string){
    var commonClass = getCharacterClass(string[0]);
    for(var i=1;i<string.length;i++){
      var cclass = getCharacterClass(string[i]);
      commonClass = _.intersection(cclass,commonClass);
    }
    return commonClass;
  }

  // generate child groups.
  function generateChildGroups(string, depth){
    if( depth === undefined ){
      depth = 0;
    }

    // if string length is 1 or less, no need to find child.
    if(string.length <= 1){
      return [];
    }

    var groups = [];

    var commonClass = getCommonCharacterClass(string);
    var curClass = _.difference(getCharacterClass(string[0]),commonClass); //The first character class excluding common class
    var curStart = 0;
    var substr = '';
    for(var i=1;i<string.length;i++){
      var cchar = string[i];
      var ccurClass = _.difference(getCharacterClass(string[i]),commonClass); //current character class excluding common class
      if(_.intersection(ccurClass,curClass).length === 0){ // they are not of the same set.
        substr = string.substring(curStart,i);
        groups.push(generateGroup(substr, depth));
        curClass = ccurClass;
        curStart = i;
      }else{
        curClass = _.intersection(ccurClass,curClass);
      }
    }

    if(curStart === 0){
      //The whole string have the same group.
      console.log("Apparently same group");
      return [];
    }
    substr = string.substring(curStart,string.length); // last substr
    groups.push(generateGroup(substr, depth));

    return groups;
  }

  function generateGroup(string, depth){
    if( depth === undefined ){ //Depth is the depth from topmost parent.
      depth = 0;
    }

    var group={
      picked: false,
      string: string,
      getSize: function(){
        return this.string.length;
      },
      getGroupColor: function(){
        return getColorForDepth(this.depth);
      },
      commonClass: getCommonCharacterClass(string, depth),
      depth: depth,
      selectedClass: '', // Which class should output in regular expression?
      hasSelected: function(){
        if(this.selectedClass !== ''){
          return true;
        }
        var selectedChild = _.find(this.childs,function(child){ return child.hasSelected(); });
        return selectedChild !== undefined;
      },
      ensureSelection: function(){ 
        // If any child is selected, this cannot be selected. 
        // If any child is selected, all child must be selected.
        // If none of the child is selected, then this must be selected.

        if(_.any(this.childs,function(child){
          return child.hasSelected();
        })){
          this.selectedClass = '';
          _.each(this.childs,function(child){
            child.ensureSelection();
          });
        }else{
          // no child selected
          this.selectedClass = defaultClass;
        }
      },
      ensureNoSelection: function(){
        // This and all child should not be selected.
        this.selectedClass = '';
        _.each(this.childs,function(child){
          child.ensureNoSelection();
        });
      },
      select: function(characterClass){ 
        // Select a characterClass from this group.
        this.ensureNoSelection();
        this.selectedClass = characterClass;
      },
      childs: generateChildGroups(string, depth+1)
    };

    return group;
  }

  function getColorForDepth(depth){
    return groupColors[depth%groupColors.length];
  }

  $scope.getCharacterClass = getCharacterClass;
  $scope.getCommonCharacterClass = getCommonCharacterClass;
  $scope.generateChildGroups = generateChildGroups;
  $scope.generateGroup = generateGroup;
  $scope.getColorForDepth = getColorForDepth;
  $scope.group = generateGroup(holder.sample);
  $scope.group.ensureSelection();
} ])
.directive('string2regex',function(){

  return {
    scope: {
      holder: '=string2regex'
    },
    controller: 'String2RegexCtrl',
    link: function(scope, element, attrs, controllers){
    },
    templateUrl: 'string2regex-template.html'
  };
})
.directive('string2regexGroup',['RecursionHelper',function(RecursionHelper){

  return {
    scope: {
      group: '=string2regexGroup'
    },
    link: function(scope, element, attrs, controllers){
    },
    compile: function(element) {
      // Use the compile function from the RecursionHelper,
      // And return the linking function(s) which it returns
      return RecursionHelper.compile(element);
    },
    templateUrl: 'string2regex-template-group.html'
  };
}])
//Copied from StackOverflow
.factory('RecursionHelper', ['$compile', function($compile){
    return {
        /** 
         * Manually compiles the element, fixing the recursion loop.
         * @param element
         * @param [link] A post-link function, or an object with function(s) registered via pre and post properties.
         * @returns An object containing the linking functions.
         */
        compile: function(element, link){
            // Normalize the link parameter
            if(angular.isFunction(link)){
                link = { post: link };
            }

            // Break the recursion loop by removing the contents
            var contents = element.contents().remove();
            var compiledContents;
            return {
                pre: (link && link.pre) ? link.pre : null,
                /**
                 * Compiles and re-adds the contents
                 */
                post: function(scope, element){
                    // Compile the contents
                    if(!compiledContents){
                        compiledContents = $compile(contents);
                    }
                    // Re-add the compiled contents to the element
                    compiledContents(scope, function(clone){
                        element.append(clone);
                    });

                    // Call the post-linking function, if any
                    if(link && link.post){
                        link.post.apply(null, arguments);
                    }
                }
            };
        }
    };
}]);
