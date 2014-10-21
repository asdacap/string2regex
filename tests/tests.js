/* global module,inject,it,describe,beforeEach,expect,sinon */

describe("String2RegexConfiguration",function(){
  var configuration;
  beforeEach(module('string2regex'));
  beforeEach(inject(function(String2RegexConfiguration){
    configuration = String2RegexConfiguration;
  }));

  describe("characterClassFunction",function(){
    it("should check for number correctly",function(){
      expect(configuration.characterClassFunction('0')).to.eql(["number","alphanumerical","nonspace","any"]);
    });
    it("should check for letter correctly",function(){
      expect(configuration.characterClassFunction('a')).to.eql(["lowercase","alphabet","alphanumerical","nonspace","any"]);
    });
    it("should check for symbol correctly",function(){
      expect(configuration.characterClassFunction('!')).to.eql(["nonspace","symbol","any"]);
    });
    it("should check for space correctly",function(){
      expect(configuration.characterClassFunction(' ')).to.eql(["space","any"]);
    });
  });
});

describe("String2RegexCtrl",function(){

  var controller;
  var scope;

  beforeEach(module('string2regex'));
  beforeEach(module(function($provide){
    $provide.decorator('String2RegexConfiguration',function($delegate){
      $delegate.groupColors = [
        "firstcolor",
        "secondcolor"
      ];
      return $delegate;
    });
  }));
  beforeEach(inject(function($controller,$rootScope){
    scope = $rootScope.$new();
    scope.holder = {
      sample: "some sample"
    };
    controller = $controller('String2RegexCtrl', { $scope: scope } );
  }));

  describe("getCommonCharacterClass",function(){
    it("should check for common class correctly",function(){
      expect(scope.getCommonCharacterClass("abc123")).to.eql(["alphanumerical","nonspace","any"]);
      expect(scope.getCommonCharacterClass("abc1 23")).to.eql(["any"]);
    });
  });

  describe("generateGroup",function(){
    it("should generate group correctly",function(){
      var group = scope.generateGroup("thisis a sample!!@#");
      var stringarr = _.pluck(group.childs,'string');
      expect(stringarr).to.eql(['thisis',' ','a',' ','sample!!@#']);
      stringarr = _.pluck(group.childs[group.childs.length-1].childs,'string');
      expect(stringarr).to.eql(['sample','!!@#']);
    });

    it("should assign depth correctly",function(){
      var group = scope.generateGroup("this23");
      expect(group.depth).to.eql(0);
      expect(group.childs[0].depth).to.eql(1);
      expect(group.childs[0].childs[0].depth).to.eql(2);
    });
  });

  describe("group",function(){
    var group;
    beforeEach(function(){
      group = scope.generateGroup("this23");
    });
    describe("getGroupColor",function(){
      it("should return value depending on depth",function(){
        group.depth = 0;
        expect(group.getGroupColor()).to.eql('firstcolor');
        group.depth = 1;
        expect(group.getGroupColor()).to.eql('secondcolor');
        group.depth = 2;
        expect(group.getGroupColor()).to.eql('firstcolor');
      });
    });
    describe('hasSelected',function(){
      it("should return true of selected class is non empty",function(){
        group.childs = [];
        group.selectedClass = '';
        expect(group.hasSelected()).to.be.false;
        group.selectedClass = 'any';
        expect(group.hasSelected()).to.be.true;
      });
      it("should return true if any of its child is selected",function(){
        group.ensureNoSelection();
        expect(group.hasSelected()).to.be.false;
        group.childs[0].hasSelected = function(){ return true; };
        expect(group.hasSelected()).to.be.true;
      });
    });
    describe('ensureSelection',function(){
      it("should fill selected class if no child is selected",function(){
        group.ensureNoSelection();
        expect(group.selectedClass).to.eql('');
        group.ensureSelection();
        expect(group.selectedClass).to.not.eql('');
      });
      it("should fill the rest of the child if some child is selected",function(){
        group.ensureNoSelection();
        expect(group.selectedClass).to.eql('');
        group.childs[0].ensureSelection();
        expect(group.selectedClass).to.eql('');
        group.ensureSelection();
        expect(group.selectedClass).to.eql('');
        expect(_.every(group.childs,function(child){ return child.hasSelected(); })).to.be.true;
      });
    });
    describe('ensureNoSelection',function(){
      it("should clear selected class and all child selection",function(){
        group.selectedClass = 'any';
        group.childs[0].selectedClass = 'any';
        expect(group.selectedClass).to.not.eql('');
        expect(_.any(group.childs,function(child){ return child.hasSelected(); })).to.be.true;
        group.ensureNoSelection();
        expect(group.selectedClass).to.eql('');
        expect(_.all(group.childs,function(child){ return !child.hasSelected(); })).to.be.true;
      });
    });
    describe('select',function(){
      it("should clear all child selection",function(){
        group.selectedClass = '';
        group.childs[0].selectedClass = 'any';
        expect(_.any(group.childs,function(child){ return child.hasSelected(); })).to.be.true;

        group.select('any');
        expect(group.selectedClass).to.eql('any');
        expect(_.all(group.childs,function(child){ return !child.hasSelected(); })).to.be.true;
      });
      it("should call rootGroup ensureSelection",function(){
        sinon.spy(scope.rootGroup,'ensureSelection');
        group.select('any');
        expect(scope.rootGroup.ensureSelection).to.have.been.called;
      });
    });
  });

  describe("getColorForDepth",function(){
    it("should give color",function(){
      expect(scope.getColorForDepth(0)).to.eql('firstcolor');
    });
    it("should give rotated color when not enough color",function(){
      expect(scope.getColorForDepth(3)).to.eql('secondcolor');
    });
  });

});
