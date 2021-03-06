/** @babel */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _pointHelpers = require('./point-helpers');

var _textHelpers = require('./text-helpers');

var _node = require('./node');

var _node2 = _interopRequireDefault(_node);

var Iterator = (function () {
  function Iterator(patch) {
    _classCallCheck(this, Iterator);

    this.patch = patch;
  }

  _createClass(Iterator, [{
    key: 'reset',
    value: function reset() {
      this.leftAncestor = null;
      this.leftAncestorInputPosition = _pointHelpers.ZERO_POINT;
      this.leftAncestorOutputPosition = _pointHelpers.ZERO_POINT;
      this.leftAncestorStack = [];
      this.leftAncestorInputPositionStack = [_pointHelpers.ZERO_POINT];
      this.leftAncestorOutputPositionStack = [_pointHelpers.ZERO_POINT];

      this.rightAncestor = null;
      this.rightAncestorInputPosition = _pointHelpers.INFINITY_POINT;
      this.rightAncestorOutputPosition = _pointHelpers.INFINITY_POINT;
      this.rightAncestorStack = [];
      this.rightAncestorInputPositionStack = [_pointHelpers.INFINITY_POINT];
      this.rightAncestorOutputPositionStack = [_pointHelpers.INFINITY_POINT];

      this.inputStart = _pointHelpers.ZERO_POINT;
      this.outputStart = _pointHelpers.ZERO_POINT;

      this.setCurrentNode(this.patch.root);
    }
  }, {
    key: 'moveToBeginning',
    value: function moveToBeginning() {
      this.reset();

      while (this.currentNode && this.currentNode.left) {
        this.descendLeft();
      }
    }
  }, {
    key: 'moveToEnd',
    value: function moveToEnd() {
      this.reset();

      while (this.currentNode && this.currentNode.right) {
        this.descendRight();
      }
    }
  }, {
    key: 'getChanges',
    value: function getChanges() {
      this.moveToBeginning();

      var changes = [];
      while (this.moveToSuccessor()) {
        if (!this.inChange()) continue;

        var change = {
          oldStart: this.inputStart,
          newStart: this.outputStart,
          oldExtent: (0, _pointHelpers.traversalDistance)(this.inputEnd, this.inputStart),
          newExtent: (0, _pointHelpers.traversalDistance)(this.outputEnd, this.outputStart)
        };
        if (this.currentNode.newText != null) change.newText = this.currentNode.newText;
        if (this.currentNode.oldText != null) change.oldText = this.currentNode.oldText;

        changes.push(change);
      }

      return changes;
    }
  }, {
    key: 'inChange',
    value: function inChange() {
      return this.currentNode && this.currentNode.isChangeEnd;
    }
  }, {
    key: 'getInputStart',
    value: function getInputStart() {
      return this.inputStart;
    }
  }, {
    key: 'getInputEnd',
    value: function getInputEnd() {
      return this.inputEnd;
    }
  }, {
    key: 'getInputExtent',
    value: function getInputExtent() {
      return (0, _pointHelpers.traversalDistance)(this.inputEnd, this.inputStart);
    }
  }, {
    key: 'getOutputStart',
    value: function getOutputStart() {
      return this.outputStart;
    }
  }, {
    key: 'getOutputEnd',
    value: function getOutputEnd() {
      return this.outputEnd;
    }
  }, {
    key: 'getOutputExtent',
    value: function getOutputExtent() {
      return (0, _pointHelpers.traversalDistance)(this.outputEnd, this.outputStart);
    }
  }, {
    key: 'getNewText',
    value: function getNewText() {
      return this.currentNode.newText;
    }
  }, {
    key: 'getOldText',
    value: function getOldText() {
      return this.currentNode.oldText;
    }
  }, {
    key: 'insertSpliceBoundary',
    value: function insertSpliceBoundary(boundaryOutputPosition, spliceStartNode) {
      this.reset();

      var insertingStart = spliceStartNode == null;

      if (!this.currentNode) {
        this.patch.root = new _node2['default'](null, boundaryOutputPosition, boundaryOutputPosition);
        this.patch.nodesCount++;
        return this.patch.root;
      }

      while (true) {
        this.inputEnd = (0, _pointHelpers.traverse)(this.leftAncestorInputPosition, this.currentNode.inputLeftExtent);
        this.outputEnd = (0, _pointHelpers.traverse)(this.leftAncestorOutputPosition, this.currentNode.outputLeftExtent);

        var comparison = (0, _pointHelpers.compare)(boundaryOutputPosition, this.outputEnd);
        if (comparison < 0) {
          if (this.currentNode.left) {
            this.descendLeft();
          } else {
            var outputLeftExtent = (0, _pointHelpers.traversalDistance)(boundaryOutputPosition, this.leftAncestorOutputPosition);
            var inputLeftExtent = (0, _pointHelpers.min)(outputLeftExtent, this.currentNode.inputLeftExtent);
            var newNode = new _node2['default'](this.currentNode, inputLeftExtent, outputLeftExtent);
            this.currentNode.left = newNode;
            this.descendLeft();
            this.patch.nodesCount++;
            break;
          }
        } else if (comparison === 0 && this.currentNode !== spliceStartNode) {
          return this.currentNode;
        } else {
          // comparison > 0
          if (this.currentNode.right) {
            this.descendRight();
          } else {
            var outputLeftExtent = (0, _pointHelpers.traversalDistance)(boundaryOutputPosition, this.outputEnd);
            var inputLeftExtent = (0, _pointHelpers.min)(outputLeftExtent, (0, _pointHelpers.traversalDistance)(this.rightAncestorInputPosition, this.inputEnd));
            var newNode = new _node2['default'](this.currentNode, inputLeftExtent, outputLeftExtent);
            this.currentNode.right = newNode;
            this.descendRight();
            this.patch.nodesCount++;
            break;
          }
        }
      }

      if (this.rightAncestor && this.rightAncestor.isChangeEnd) {
        this.currentNode.isChangeStart = true;
        this.currentNode.isChangeEnd = true;
        var _rightAncestor = this.rightAncestor;
        var newText = _rightAncestor.newText;
        var oldText = _rightAncestor.oldText;

        if (newText != null) {
          var boundaryIndex = (0, _textHelpers.characterIndexForPoint)(newText, this.currentNode.outputLeftExtent);
          if (insertingStart) this.currentNode.newText = newText.substring(0, boundaryIndex);
          this.rightAncestor.newText = newText.substring(boundaryIndex);
        }
        if (oldText != null) {
          var boundaryIndex = (0, _textHelpers.characterIndexForPoint)(oldText, this.currentNode.inputLeftExtent);
          this.currentNode.oldText = oldText.substring(0, boundaryIndex);
          this.rightAncestor.oldText = oldText.substring(boundaryIndex);
        }
      }

      return this.currentNode;
    }
  }, {
    key: 'setCurrentNode',
    value: function setCurrentNode(node) {
      this.currentNode = node;

      if (node && node.left) {
        this.inputStart = (0, _pointHelpers.traverse)(this.leftAncestorInputPosition, node.left.inputExtent);
        this.outputStart = (0, _pointHelpers.traverse)(this.leftAncestorOutputPosition, node.left.outputExtent);
      } else {
        this.inputStart = this.leftAncestorInputPosition;
        this.outputStart = this.leftAncestorOutputPosition;
      }

      this.inputEnd = (0, _pointHelpers.traverse)(this.leftAncestorInputPosition, node ? node.inputLeftExtent : _pointHelpers.INFINITY_POINT);
      this.outputEnd = (0, _pointHelpers.traverse)(this.leftAncestorOutputPosition, node ? node.outputLeftExtent : _pointHelpers.INFINITY_POINT);
    }
  }, {
    key: 'moveToSuccessor',
    value: function moveToSuccessor() {
      if (!this.currentNode) return false;

      if (this.currentNode.right) {
        this.descendRight();
        while (this.currentNode.left) {
          this.descendLeft();
        }
        return true;
      } else {
        var previousInputEnd = this.inputEnd;
        var previousOutputEnd = this.outputEnd;

        while (this.currentNode.parent && this.currentNode.parent.right === this.currentNode) {
          this.ascend();
        }
        this.ascend();

        if (!this.currentNode) {
          // advanced off right edge of tree
          this.inputStart = previousInputEnd;
          this.outputStart = previousOutputEnd;
          this.inputEnd = _pointHelpers.INFINITY_POINT;
          this.outputEnd = _pointHelpers.INFINITY_POINT;
        }
        return true;
      }
    }
  }, {
    key: 'moveToPredecessor',
    value: function moveToPredecessor() {
      if (!this.currentNode) return false;

      if (this.currentNode.left) {
        this.descendLeft();
        while (this.currentNode.right) {
          this.descendRight();
        }
        return true;
      } else {
        while (this.currentNode.parent && this.currentNode.parent.left === this.currentNode) {
          this.ascend();
        }
        this.ascend();

        return this.currentNode != null;
      }
    }
  }, {
    key: 'ascend',
    value: function ascend() {
      this.leftAncestor = this.leftAncestorStack.pop();
      this.leftAncestorInputPosition = this.leftAncestorInputPositionStack.pop();
      this.leftAncestorOutputPosition = this.leftAncestorOutputPositionStack.pop();
      this.rightAncestor = this.rightAncestorStack.pop();
      this.rightAncestorInputPosition = this.rightAncestorInputPositionStack.pop();
      this.rightAncestorOutputPosition = this.rightAncestorOutputPositionStack.pop();
      this.setCurrentNode(this.currentNode.parent);
    }
  }, {
    key: 'descendLeft',
    value: function descendLeft() {
      this.pushToAncestorStacks();
      this.rightAncestor = this.currentNode;
      this.rightAncestorInputPosition = this.inputEnd;
      this.rightAncestorOutputPosition = this.outputEnd;
      this.setCurrentNode(this.currentNode.left);
    }
  }, {
    key: 'descendRight',
    value: function descendRight() {
      this.pushToAncestorStacks();
      this.leftAncestor = this.currentNode;
      this.leftAncestorInputPosition = this.inputEnd;
      this.leftAncestorOutputPosition = this.outputEnd;
      this.setCurrentNode(this.currentNode.right);
    }
  }, {
    key: 'pushToAncestorStacks',
    value: function pushToAncestorStacks() {
      this.leftAncestorStack.push(this.leftAncestor);
      this.leftAncestorInputPositionStack.push(this.leftAncestorInputPosition);
      this.leftAncestorOutputPositionStack.push(this.leftAncestorOutputPosition);
      this.rightAncestorStack.push(this.rightAncestor);
      this.rightAncestorInputPositionStack.push(this.rightAncestorInputPosition);
      this.rightAncestorOutputPositionStack.push(this.rightAncestorOutputPosition);
    }
  }]);

  return Iterator;
})();

exports['default'] = Iterator;
module.exports = exports['default'];
