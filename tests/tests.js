/* global module,inject,it,describe,beforeEach,expect,sinon */

describe("String2RegexConfiguration",function(){
  var configuration;
  beforeEach(module('string2regex'));
  beforeEach(inject(function(String2RegexConfiguration){
    configuration = String2RegexConfiguration;
  }));

  describe("characterClassFunction",function(){
    it("should check for number correctly",function(){
      expect(configuration.characterClassFunction('0')).to.eql(["number","alphanumerical","nonspace","constant","any"]);
    });
    it("should check for letter correctly",function(){
      expect(configuration.characterClassFunction('a')).to.eql(["lowercase","alphabet","alphanumerical","nonspace","constant","any"]);
    });
    it("should check for symbol correctly",function(){
      expect(configuration.characterClassFunction('!')).to.eql(["nonspace","symbol","constant","any"]);
    });
    it("should check for space correctly",function(){
      expect(configuration.characterClassFunction(' ')).to.eql(["space","constant","any"]);
    });
  });

  describe("generateRegexPortion",function(){
    _.each({
      number: '[0-9]',
      lowercase: '[a-z]',
      uppercase: '[A-Z]',
      alphabet: '[a-zA-Z]',
      alphanumerical: '[a-zA-Z0-9]',
      space: '\\s',
      nonspace: '\\S',
      symbol: '[^a-zA-Z0-9]',
      any: '.'
    },function(value,key){
      it("should return correct regex for class "+key,function(){
        expect(configuration.generateRegexPortion(key)).to.eql(value);
      });
    });

    it("should properly escape it for constant class",function(){
      expect(configuration.generateRegexPortion('constant',{
        string: '\\[]'
      })).to.eql('\\\\\\[\\]');
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
      expect(scope.getCommonCharacterClass("abc123")).to.eql(["alphanumerical","nonspace","constant","any"]);
      expect(scope.getCommonCharacterClass("abc1 23")).to.eql(["constant","any"]);
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

  describe("serializeGroup",function(){
    var group;
    beforeEach(function(){
      group = scope.generateGroup("this23");
    });
    it("should retain main group selection",function(){
      group.selectedClass = 'somethingnew';
      var serialized = scope.serializeGroup(group);
      expect(serialized.selectedClass).to.eql('somethingnew');
    });
    it("should retain child group selection",function(){
      group.childs[0].selectedClass = 'somethingnew';
      var serialized = scope.serializeGroup(group);
      expect(serialized.childs[0].selectedClass).to.eql('somethingnew');
    });
  });

  describe("applySerializedGroupData",function(){
    var group;
    var data;
    beforeEach(function(){
      group = scope.generateGroup("this23");
      data = scope.serializeGroup(group);
    });
    it("should apply main group selection",function(){
      data.selectedClass = 'somethingnew';
      scope.applySerializedGroupData(data,group);
      expect(group.selectedClass).to.eql('somethingnew');
    });
    it("should retain child group selection",function(){
      data.childs[0].selectedClass = 'somethingnew';
      scope.applySerializedGroupData(data,group);
      expect(group.childs[0].selectedClass).to.eql('somethingnew');
    });
  });

  describe("group",function(){
    var group;
    beforeEach(function(){
      scope.holder.startAnchor = false;
      scope.holder.endAnchor = false;
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
      it("should fill the rest of the child with parent class",function(){
        group.ensureNoSelection();
        expect(group.selectedClass).to.eql('');
        group.childs[0].ensureSelection();
        group.selectedClass = 'somethingnew';
        expect(group.selectedClass).to.eql('somethingnew');
        group.ensureSelection();
        expect(group.selectedClass).to.eql('');
        expect(group.childs[1].selectedClass).to.eql('somethingnew');
      });
      it("should fill the rest of the child with parent's parent class when parent class is not available.",function(){
        group.ensureNoSelection();
        group.childs[0].childs[0].ensureSelection();
        group.selectedClass = 'somethingnew';
        expect(group.selectedClass).to.eql('somethingnew');
        group.ensureSelection();
        expect(group.selectedClass).to.eql('');
        expect(group.childs[0].childs[1].selectedClass).to.eql('somethingnew');
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
      it("if select 'constant', it should set multiplier to 'constant' and multiplier_constant to 1",function(){
        group.select('constant');
        expect(group.selectedClass).to.eql('constant');
        expect(group.multiplier).to.eql('constant');
        expect(group.multiplier_constant).to.eql(1);
      });
    });
    describe('preserveSettingFromOldGroup',function(){
      it("should preserve properties",function(){
        group.selectedClass = 'any';
        group.multiplier = 'zmore';
        group.multiplier_min = 10;
        group.multiplier_max = 100;
        group.multiplier_constant = 100;

        var newgroup = scope.generateGroup(group.string);
        newgroup.preserveSettingFromOldGroup(group);

        expect(newgroup.selectedClass).to.eql('any');
        expect(newgroup.multiplier).to.eql('zmore');
        expect(newgroup.multiplier_min).to.eql(10);
        expect(newgroup.multiplier_max).to.eql(100);
        expect(newgroup.multiplier_constant).to.eql(100);
      });
      it("should not preserve do_capture",function(){
        group.do_capture = true;
        var newgroup = scope.generateGroup(group.string);
        newgroup.preserveSettingFromOldGroup(group);
        expect(newgroup.do_capture).to.be.false;
      });
      it("should preserve child's selectedClass",function(){
        group.childs[0].selectedClass = 'any';
        var newgroup = scope.generateGroup(group.string);
        newgroup.preserveSettingFromOldGroup(group);
        expect(newgroup.childs[0].selectedClass).to.eql('any');
      });
    });
    describe('generateRegex',function(){
      beforeEach(function(){
        group = scope.generateGroup("Abc!");
      });
      it("should generate regex properly for class constant",function(){
        group.ensureNoSelection();
        group.selectedClass = 'constant';
        expect(group.generateRegex()).to.eql('Abc!+');
      });
      it("should generate regex properly for class any",function(){
        group.ensureNoSelection();
        group.selectedClass = 'any';
        expect(group.generateRegex()).to.eql('.+');
      });
      it("should generate regex properly",function(){
        group.ensureNoSelection();
        group.childs[0].selectedClass = 'constant';
        group.childs[0].multiplier = 'constant';
        group.childs[0].multiplier_constant = '2';
        group.childs[1].selectedClass = 'constant';
        group.childs[1].multiplier = 'optional';
        expect(group.generateRegex()).to.eql('Abc{2}!?');
      });
      it('should start with ^ if startAnchor is true',function(){
        scope.holder.startAnchor = true;
        group.ensureNoSelection();
        group.selectedClass = 'constant';
        expect(group.generateRegex()).to.eql('^Abc!+');
      });
      it('should end with $ if endAnchor is true',function(){
        scope.holder.endAnchor = true;
        group.ensureNoSelection();
        group.selectedClass = 'constant';
        expect(group.generateRegex()).to.eql('Abc!+$');
      });
      it('should start with ^ and end with $ if startAnchor is true and endAnchor is true',function(){
        scope.holder.endAnchor = true;
        scope.holder.startAnchor = true;
        group.ensureNoSelection();
        group.selectedClass = 'constant';
        expect(group.generateRegex()).to.eql('^Abc!+$');
      });
      it('should generate regex with capture',function(){
        group.selectedClass = 'constant';
        group.do_capture = true;
        expect(group.generateRegex()).to.eql('(Abc!+)');
      });
      it('should generate regex with capture for child',function(){
        group.ensureNoSelection();
        group.multiplier = 'omore';
        group.selectedClass = 'constant';
        group.childs[0].select('constant');
        group.childs[0].do_capture = true;
        group.ensureSelection();
        expect(group.generateRegex()).to.eql('(Abc)!+');
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

  describe("findLCS",function(){
    it("should give the value correctly",function(){
      var a1 = 'adbec';
      var a2 = 'abzc';
      expect(scope.findLCS(a1,a2,function(a,b){ return a === b; })).to.eql(['a','b','c']);
      expect(scope.findLCS(a2,a1,function(a,b){ return a === b; })).to.eql(['a','b','c']);
    });
  });

});
