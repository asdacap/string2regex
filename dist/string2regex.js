/*! string2regex - v0.0.1 - 2014-10-23
* Copyright (c) 2014 ; Licensed  */

angular.module('string2regex',['ui.bootstrap'])
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
  classInfo: {
    number: {
      display_button: true,
      button_text: 'Num',
      button_tooltip: 'Number'
    },
    uppercase: {
      display_button: true,
      button_text: 'Up',
      button_tooltip: 'Uppercase'
    },
    lowercase: {
      display_button: true,
      button_text: 'Low',
      button_tooltip: 'Lowercase'
    },
    alphabet: {
      display_button: true,
      button_text: 'Alpha',
      button_tooltip: 'Alphabet'
    },
    alphanumerical: { 
      display_button: true,
      button_text: 'AlNum',
      button_tooltip: 'Alphanumerical'
    },
    space: {
      display_button: true,
      button_text: 'Spac',
      button_tooltip: 'Space'
    },
    nonspace: {
      display_button: true,
      button_text: 'NSpac',
      button_tooltip: 'NonSpace'
    },
    symbol: {
      display_button: true,
      button_text: 'Sym',
      button_tooltip: 'Symbol'
    },
    constant: {
      display_button: true,
      button_text: 'Con',
      button_tooltip: 'Constant'
    },
    any: {
      display_button: true,
      button_text: 'Any',
      button_tooltip: 'Any'
    }
  },
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
    result.push('constant');
    result.push('any');
    return result;
  },
  generateRegexPortion: function(charClass,group){ // Generate part of regular expression based on class.
    var mapping = {
      number: '[0-9]',
      lowercase: '[a-z]',
      uppercase: '[A-Z]',
      alphabet: '[a-zA-Z]',
      alphanumerical: '[a-zA-Z0-9]',
      space: '\\s',
      nonspace: '\\S',
      symbol: '[^a-zA-Z0-9]',
      any: '.'
    };
    if(mapping[charClass] !== undefined){
      return mapping[charClass];
    }else if( charClass === 'constant' ){
      return (group.string+'').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1"); // quite it from being a regular expression.
    }else if( charClass === 'any' ){
      return '.';
    }
    return 'ERROR unknown charClass '+charClass;
  },
  defaultClass: 'any'
})
.controller('String2RegexCtrl',['$scope','String2RegexConfiguration',function($scope,String2RegexConfiguration){
  var holder = $scope.holder;
  _.defaults(holder,{
    sample: '',
    regex: '',
    startAnchor: true,
    endAnchor: true
  });
  var groupColors = String2RegexConfiguration.groupColors;
  var getCharacterClass = _.memoize(String2RegexConfiguration.characterClassFunction);
  var defaultClass = String2RegexConfiguration.defaultClass;
  var generateRegexPortion = String2RegexConfiguration.generateRegexPortion;

  $scope.classInfo = String2RegexConfiguration.classInfo;

  // common class is character class which every character in the string have.
  function getCommonCharacterClass(string){
    var commonClass = getCharacterClass(string[0]);
    for(var i=1;i<string.length;i++){
      var cclass = getCharacterClass(string[i]);
      commonClass = _.intersection(cclass,commonClass);
    }
    return commonClass;
  }

  // Copied and modified from StackOverflow.
  // Deeply extend dst with any other arguments.
  // Array are iterated instead of replaced.
  function extendDeep(dst) {
    angular.forEach(arguments, function(obj) {
      if (obj !== dst) {
        angular.forEach(obj, function(value, key) {
          if( value === undefined ) {
            return;
          }
          if (dst[key] && dst[key].constructor && dst[key].constructor === Array){
            var length = dst[key].length;
            if(value.length < length){
              length = value;
            }
            for(var i=0;i<length;i++){
              extendDeep( dst[key][i], value[i] );
            }
          }else if (dst[key] && dst[key].constructor && dst[key].constructor === Object) {
            extendDeep(dst[key], value);
          } else {
            dst[key] = value;
          }
        });   
      }
    });
    return dst;
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
      multiplier: 'omore', // Set default multiplier
      multiplier_min: 1,
      multiplier_max: 10,
      multiplier_constant: 1,
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
      ensureSelection: function(parent){ 
        // If any child is selected, this cannot be selected. 
        // If any child is selected, all child must be selected.
        // If none of the child is selected, then this must be selected.
        // Also, pass parent to change child setting.
        // Used to hint what class to put when the parent need to fill unselected child
        // with the parent's class properties.

        if(_.any(this.childs,function(child){
          return child.hasSelected();
        })){
          if(parent !== undefined){
            _.extend(this,_.pick(parent,'selectedClass','multiplier','multipler_constant','multiplier_min','multiplier_max'));
          } // Do this, so child have something to inherit.
          if( this.selectedClass === ''){
            this.selectedClass = defaultClass; // if parent does not have selectedClass
          }
          var self = this;
          _.each(this.childs,function(child){
            child.ensureSelection(self);
          });
          this.selectedClass = '';
        }else{
          // no child selected
          if(this.selectedClass === ''){
            if(parent !== undefined){
              _.extend(this,_.pick(parent,'selectedClass','multiplier','multipler_constant','multiplier_min','multiplier_max'));
            }
            if( this.selectedClass === ''){
              this.selectedClass = defaultClass; // if parent does not have selectedClass
            }
          }
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

        if(characterClass == 'constant'){ // auto set multipler to {1} on constant
          this.multiplier = 'constant';
          this.multiplier_constant = 1;
        }

        $scope.rootGroup.ensureSelection();
        regenerateResult();
      },
      generateRegexPartitions: function(){
        // Basically get array of groups with resulting regular expression portion.
        // Used for processing when regex is same between neighbour group.
        var res = [];
        if(this.selectedClass === ''){
          _.each(this.childs,function(child){
            res = res.concat(child.generateRegexPartitions());
          });
        }else{
          res.push({
            regex: generateRegexPortion(this.selectedClass, this), //Obtained from configuration
            group: this
          });
        }
        return res;
      },
      generateRegex: function(){
        // Return a regex string.
        
        var res = '';
        var partitions = this.generateRegexPartitions();
        if(partitions.length === 0){
          return res;
        }
        // Group by same regex
        var groupedPartition = [];
        var cur = {
          regex:partitions[0].regex,
          list:[partitions[0]]
        };
        var i;
        for(i=1;i<partitions.length;i++){
          var cpart = partitions[i];
          if(cpart.regex === cur.regex){
            cur.list.push(cpart);
          }else{
            groupedPartition.push(cur);
            cur = {
              regex:partitions[i].regex,
              list:[partitions[i]]
            };
          }
        }
        groupedPartition.push(cur);

        // Merged the partition. 
        // If one of the multiplier is omore, then merge them all.
        // If one of the multiplier is zmore, then merge them all.
        // Then just merge them.
        for(i=0;i<groupedPartition.length;i++){
          var cgroupedPartition = groupedPartition[i];
          if(_.some(cgroupedPartition.list,function(part){
            return part.group.multiplier == 'omore';
          })){
            res+=cgroupedPartition.regex+'+';
          }else if(_.some(cgroupedPartition.list,function(part){
            return part.group.multiplier == 'zmore';
          })){
            res+=cgroupedPartition.regex+'.';
          }else{
            //merge them one by one.
            _.each(cgroupedPartition.list,function(part){
              if(part.group.multiplier == 'constant'){
                if(part.group.multiplier_constant == 1){
                  res+=cgroupedPartition.regex;
                }else{
                  res+=cgroupedPartition.regex+'{'+part.group.multiplier_constant+'}';
                }
              }else if(part.group.multiplier == 'optional'){
                res+=cgroupedPartition.regex+'?';
              }else if(part.group.multiplier == 'range'){
                res+=cgroupedPartition.regex+'{'+part.group.multiplier_min+','+part.group.multiplier_max+'}';
              }
            });
          }
        }

        if(holder.startAnchor){
          res = '^'+res;
        }
        if(holder.endAnchor){
          res = res+'$';
        }

        return res;
      }, 
      preserveSettingFromOldGroup: function(group){
        // attempt to regain setting from old group.
        var self = this;
        _.each(['selectedClass','multiplier','multiplier_min','multiplier_max','multiplier_constant'],function(val){
          self[val] = group[val];
        });

        // The rest if to see if any child from group is of equal commonClass
        // If so, call preserveSetting from them.
        function childEqual(g1,g2){
          // consider equal if same common class.
          return _.intersection(g1.commonClass,g2.commonClass).length == g1.commonClass.length; 
        }
        var commonChilds = findLCS(group.childs,this.childs,childEqual);

        var ccindex = 0;
        for(var i=0;i<this.childs.length;i++){
          if(ccindex >= commonChilds.length){
            break;
          }
          if(childEqual(this.childs[i],commonChilds[ccindex])){
            this.childs[i].preserveSettingFromOldGroup(commonChilds[ccindex]);
            ccindex++;
          }
        }
      },
      regenerateResult: function(){ // A proxy, so that the dialog can call regenerateResult()
        regenerateResult();
      },
      childs: generateChildGroups(string, depth+1)
    };

    return group;
  }

  function getColorForDepth(depth){
    return groupColors[depth%groupColors.length];
  }

  function regenerateResult(){
    $scope.holder.regex = $scope.rootGroup.generateRegex();
  }

  // A generic longest common subsequence
  // list1 and list2 is self explanatory.
  // is_equal is a function that determine if item is equal.
  function findLCS(list1,list2,is_equal){
    var max = [];
    var ops = [];
    var rows = [];
    var i;
    var i2;
    for(i=0;i<list2.length;i++){
      rows.push(0);
    }
    for(i=0;i<list1.length;i++){
      max.push(angular.copy(rows));
      ops.push(angular.copy(rows));
    }

    for(i=0;i<list1.length;i++){
      for(i2=0;i2<list2.length;i2++){
        if(i===0 || i2===0){
          if( is_equal(list1[i], list2[i2]) ){
            max[i][i2] = 1;
            ops[i][i2] = 1;
          }else if(i===0){
            ops[i][i2] = 3;
          }else if(i2===0){
            ops[i][i2] = 2;
          }
        }else{
          if( is_equal(list1[i], list2[i2]) ){
            max[i][i2] = max[i-1][i2-1]+1;
            ops[i][i2] = 1;
          }else{
            if(max[i-1][i2] > max[i][i2]){
              max[i][i2] = max[i-1][i2];
              ops[i][i2] = 2;
            }
            if(max[i][i2-1] > max[i][i2]){
              max[i][i2] = max[i][i2-1];
              ops[i][i2] = 3;
            }
          }
        }
      }
    }

    var result = [];

    i=list1.length-1;
    i2=list2.length-1;
    while(i != -1 && i2 != -1){
      var op = ops[i][i2];
      if(op == 1){
        result.push(list1[i]);
        i--;
        i2--;
      }
      if(op == 2){
        i--;
      }
      if(op == 3){
        i2--;
      }
      if(op === 0){
        break;
      }
    }

    result.reverse();
    return result;
  }

  $scope.$watch('holder.sample',function(){
    var oldRoot = $scope.rootGroup;
    $scope.rootGroup = generateGroup(holder.sample);
    $scope.rootGroup.preserveSettingFromOldGroup(oldRoot);
    $scope.rootGroup.ensureSelection();
    regenerateResult();
  });
  $scope.$watch('holder.startAnchor',function(){
    regenerateResult();
  });
  $scope.$watch('holder.endAnchor',function(){
    regenerateResult();
  });
  $scope.$watch('holder.rootGroup',function(){
    if(holder.rootGroup !== undefined){
      extendDeep($scope.rootGroup, holder.rootGroup);
    }
  });
  $scope.$watch('holder.regex',function(){
    holder.rootGroup = JSON.parse(JSON.stringify($scope.rootGroup));
  });

  $scope.rootGroup = generateGroup(holder.sample);
  $scope.rootGroup.ensureSelection();
  regenerateResult();


  $scope.getCharacterClass = getCharacterClass;
  $scope.findLCS = findLCS;
  $scope.getCommonCharacterClass = getCommonCharacterClass;
  $scope.generateChildGroups = generateChildGroups;
  $scope.generateGroup = generateGroup;
  $scope.regenerateResult = regenerateResult;
  $scope.getColorForDepth = getColorForDepth;
} ])

.controller('String2RegexGroupEditorCtrl',['$scope','group','$modalInstance','String2RegexConfiguration',function($scope,group,$modalInstance,String2RegexConfiguration){
  this.close = function(){
    group.regenerateResult();
    $modalInstance.close();
  };
  this.group = group;
  $scope.group = group;
  $scope.classInfo = String2RegexConfiguration.classInfo;
}])

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
.directive('string2regexGroup',['RecursionHelper','$modal',function(RecursionHelper, $modal){

  return {
    scope: {
      group: '=string2regexGroup'
    },
    controller: function($scope,String2RegexConfiguration){
      $scope.classInfo = String2RegexConfiguration.classInfo;
      $scope.openEditor = function( group ){
        $modal.open({
          templateUrl: 'String2RegexGroupEditor.html',
          controller: 'String2RegexGroupEditorCtrl',
          controllerAs: 'editor',
          resolve:{
            group: function(){ return group; }
          }
        });
      };
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
}])
.directive('ngMin', function() { // Fix angular's broken ng-min
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, elem, attr, ctrl) {
      function isEmpty(value) {
        return angular.isUndefined(value) || value === '' || value === null || value !== value;
      }
      scope.$watch(attr.ngMin, function(){
        ctrl.$setViewValue(ctrl.$viewValue);
      });
      var minValidator = function(value) {
        var min = scope.$eval(attr.ngMin) || 0;
        if (!isEmpty(value) && value < min) {
          ctrl.$setValidity('ngMin', false);
          return undefined;
        } else {
          ctrl.$setValidity('ngMin', true);
          return value;
        }
      };

      ctrl.$parsers.push(minValidator);
      ctrl.$formatters.push(minValidator);
    }
  };
})
.directive('ngMax', function() { // Fix Angular's broken max
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, elem, attr, ctrl) {
      function isEmpty(value) {
        return angular.isUndefined(value) || value === '' || value === null || value !== value;
      }
      scope.$watch(attr.ngMax, function(){
        ctrl.$setViewValue(ctrl.$viewValue);
      });
      var maxValidator = function(value) {
        var max = scope.$eval(attr.ngMax) || Infinity;
        if (!isEmpty(value) && value > max) {
          ctrl.$setValidity('ngMax', false);
          return undefined;
        } else {
          ctrl.$setValidity('ngMax', true);
          return value;
        }
      };

      ctrl.$parsers.push(maxValidator);
      ctrl.$formatters.push(maxValidator);
    }
  };
});

