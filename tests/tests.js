/* global module,inject,it,describe,beforeEach,expect */

describe("String2RegexCtrl",function(){

  var controller;
  var scope;

  beforeEach(module('string2regex'));
  beforeEach(inject(function($controller,$rootScope){
    scope = $rootScope.$new();
    scope.holder = {
      sample: "some sample"
    };
    controller = $controller('String2RegexCtrl', { $scope: scope } );
  }));

  describe("getCharacterClass",function(){
    it("should check for number correctly",function(){
      expect(scope.getCharacterClass('0')).to.eql(["number","alphanumerical","nonspace"]);
    });
    it("should check for letter correctly",function(){
      expect(scope.getCharacterClass('a')).to.eql(["lowercase","alphabet","alphanumerical","nonspace"]);
    });
    it("should check for symbol correctly",function(){
      expect(scope.getCharacterClass('!')).to.eql(["nonspace","symbol"]);
    });
    it("should check for space correctly",function(){
      expect(scope.getCharacterClass(' ')).to.eql(["space"]);
    });
  });

  describe("getCommonCharacterClass",function(){
    it("should check for common class correctly",function(){
      expect(scope.getCommonCharacterClass("abc123")).to.eql(["alphanumerical","nonspace"]);
      expect(scope.getCommonCharacterClass("abc1 23")).to.eql([]);
    });
  });

  describe("generateGroups",function(){
    it("should generate group correctly",function(){
      var group = scope.generateGroups("thisis a sample!!@#");
      var stringarr = _.pluck(group.childs,'string');
      expect(stringarr).to.eql(['thisis',' ','a',' ','sample!!@#']);
      stringarr = _.pluck(group.childs[group.childs.length-1].childs,'string');
      expect(stringarr).to.eql(['sample','!!@#']);
    });
  });

});
