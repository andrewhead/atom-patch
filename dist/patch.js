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

var _iterator = require('./iterator');

var _iterator2 = _interopRequireDefault(_iterator);

var _serialization = require('./serialization');

var Patch = (function () {
  _createClass(Patch, null, [{
    key: 'compose',
    value: function compose(patches) {
      var composedPatch = new Patch();
      for (var index = 0; index < patches.length; index++) {
        var changes = patches[index].getChanges();
        if ((index & 1) === 0) {
          // flip
          for (var i = 0; i < changes.length; i++) {
            var _changes$i = changes[i];
            var newStart = _changes$i.newStart;
            var oldExtent = _changes$i.oldExtent;
            var newExtent = _changes$i.newExtent;
            var oldText = _changes$i.oldText;
            var newText = _changes$i.newText;

            composedPatch.splice(newStart, oldExtent, newExtent, { oldText: oldText, newText: newText });
          }
        } else {
          // flop
          for (var i = changes.length - 1; i >= 0; i--) {
            var _changes$i2 = changes[i];
            var oldStart = _changes$i2.oldStart;
            var oldExtent = _changes$i2.oldExtent;
            var newExtent = _changes$i2.newExtent;
            var oldText = _changes$i2.oldText;
            var newText = _changes$i2.newText;

            composedPatch.splice(oldStart, oldExtent, newExtent, { oldText: oldText, newText: newText });
          }
        }
      }

      return new Patch({ cachedChanges: composedPatch.getChanges() });
    }
  }, {
    key: 'invert',
    value: function invert(patch) {
      var invertedChanges = patch.getChanges().map(function (change) {
        return {
          oldStart: change.newStart, newStart: change.oldStart,
          oldExtent: change.newExtent, newExtent: change.oldExtent,
          oldText: change.newText, newText: change.oldText
        };
      });

      return new Patch({ cachedChanges: invertedChanges });
    }
  }, {
    key: 'hunk',
    value: function hunk(change) {
      var changes = [{
        oldStart: change.newStart,
        newStart: change.newStart,
        oldExtent: change.oldExtent,
        newExtent: change.newExtent,
        oldText: change.oldText,
        newText: change.newText
      }];

      return new Patch({ cachedChanges: changes });
    }
  }, {
    key: 'deserialize',
    value: function deserialize(serializedChanges) {
      return new Patch({ serializedChanges: serializedChanges });
    }
  }]);

  function Patch() {
    var params = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Patch);

    this.root = null;
    this.nodesCount = 0;
    this.iterator = this.buildIterator();
    this.cachedChanges = params.cachedChanges;
    this.serializedChanges = params.serializedChanges;
    if (params.cachedChanges || params.serializedChanges) {
      this.freeze();
    }
  }

  _createClass(Patch, [{
    key: 'serialize',
    value: function serialize() {
      if (this.serializedChanges == null) {
        this.serializedChanges = (0, _serialization.serializeChanges)(this.getChanges());
        this.freeze();
      }

      return this.serializedChanges;
    }
  }, {
    key: 'freeze',
    value: function freeze() {
      this.splice = function () {
        throw new Error("Cannot splice into a read-only Patch!");
      };
    }
  }, {
    key: 'buildIterator',
    value: function buildIterator() {
      return new _iterator2['default'](this);
    }
  }, {
    key: 'rebalance',
    value: function rebalance() {
      this.transformTreeToVine();
      this.transformVineToBalancedTree();
    }
  }, {
    key: 'transformTreeToVine',
    value: function transformTreeToVine() {
      var pseudoRoot = this.root;
      while (pseudoRoot != null) {
        var leftChild = pseudoRoot.left;
        var rightChild = pseudoRoot.right;
        if (leftChild != null) {
          this.rotateNodeRight(leftChild);
          pseudoRoot = leftChild;
        } else {
          pseudoRoot = rightChild;
        }
      }
    }
  }, {
    key: 'transformVineToBalancedTree',
    value: function transformVineToBalancedTree() {
      var n = this.nodesCount;
      var m = Math.pow(2, Math.floor(Math.log2(n + 1))) - 1;
      this.performRebalancingRotations(n - m);
      while (m > 1) {
        m = Math.floor(m / 2);
        this.performRebalancingRotations(m);
      }
    }
  }, {
    key: 'performRebalancingRotations',
    value: function performRebalancingRotations(count) {
      var root = this.root;
      for (var i = 0; i < count; i++) {
        if (root == null) return;
        var rightChild = root.right;
        if (rightChild == null) return;
        root = rightChild.right;
        this.rotateNodeLeft(rightChild);
      }
    }
  }, {
    key: 'spliceWithText',
    value: function spliceWithText(newStart, oldText, newText) {
      this.splice(newStart, (0, _textHelpers.getExtent)(oldText), (0, _textHelpers.getExtent)(newText), { oldText: oldText, newText: newText });
    }
  }, {
    key: 'splice',
    value: function splice(newStart, oldExtent, newExtent) {
      var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

      if ((0, _pointHelpers.isZero)(oldExtent) && (0, _pointHelpers.isZero)(newExtent)) return;

      var oldEnd = (0, _pointHelpers.traverse)(newStart, oldExtent);
      var newEnd = (0, _pointHelpers.traverse)(newStart, newExtent);

      var startNode = this.iterator.insertSpliceBoundary(newStart);
      startNode.isChangeStart = true;
      this.splayNode(startNode);

      var endNode = this.iterator.insertSpliceBoundary(oldEnd, startNode);
      endNode.isChangeEnd = true;
      this.splayNode(endNode);
      if (endNode.left !== startNode) this.rotateNodeRight(startNode);

      endNode.outputExtent = (0, _pointHelpers.traverse)(newEnd, (0, _pointHelpers.traversalDistance)(endNode.outputExtent, endNode.outputLeftExtent));
      endNode.outputLeftExtent = newEnd;
      if (options.newText != null) endNode.newText = options.newText;
      if (options.oldText != null) endNode.oldText = this.replaceChangedText(options.oldText, startNode, endNode);

      startNode.right = null;
      startNode.inputExtent = startNode.inputLeftExtent;
      startNode.outputExtent = startNode.outputLeftExtent;

      if (endNode.isChangeStart) {
        var rightAncestor = this.bubbleNodeDown(endNode);
        if (endNode.newText != null) rightAncestor.newText = endNode.newText + rightAncestor.newText;
        if (endNode.oldText != null) rightAncestor.oldText = endNode.oldText + rightAncestor.oldText;
        this.deleteNode(endNode);
      } else if ((0, _pointHelpers.compare)(endNode.outputLeftExtent, startNode.outputLeftExtent) === 0 && (0, _pointHelpers.compare)(endNode.inputLeftExtent, startNode.inputLeftExtent) === 0) {
        startNode.isChangeStart = endNode.isChangeStart;
        this.deleteNode(endNode);
      }

      if (startNode.isChangeStart && startNode.isChangeEnd) {
        var rightAncestor = this.bubbleNodeDown(startNode) || this.root;
        if (startNode.newText != null) rightAncestor.newText = startNode.newText + rightAncestor.newText;
        if (startNode.oldText != null) rightAncestor.oldText = startNode.oldText + rightAncestor.oldText;
        this.deleteNode(startNode);
      }

      this.cachedChanges = null;
    }
  }, {
    key: 'replaceChangedText',
    value: function replaceChangedText(oldText, startNode, endNode) {
      var replacedText = "";
      var lastChangeEnd = _pointHelpers.ZERO_POINT;
      for (var change of this.changesForSubtree(startNode.right)) {
        if (change.start) {
          replacedText += oldText.substring((0, _textHelpers.characterIndexForPoint)(oldText, lastChangeEnd), (0, _textHelpers.characterIndexForPoint)(oldText, change.start));
        } else if (change.end) {
          replacedText += change.oldText;
          lastChangeEnd = change.end;
        }
      }

      if (endNode.oldText == null) {
        replacedText += oldText.substring((0, _textHelpers.characterIndexForPoint)(oldText, lastChangeEnd));
      } else {
        replacedText += endNode.oldText;
      }

      return replacedText;
    }
  }, {
    key: 'changesForSubtree',
    value: function changesForSubtree(node) {
      var outputDistance = arguments.length <= 1 || arguments[1] === undefined ? _pointHelpers.ZERO_POINT : arguments[1];
      var changes = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

      if (node == null) return changes;

      this.changesForSubtree(node.left, outputDistance, changes);
      var change = {};
      var outputLeftExtent = (0, _pointHelpers.traverse)(outputDistance, node.outputLeftExtent);
      if (node.isChangeStart) change.start = outputLeftExtent;
      if (node.isChangeEnd) {
        change.end = outputLeftExtent;
        change.oldText = node.oldText;
      }
      changes.push(change);
      this.changesForSubtree(node.right, outputLeftExtent, changes);

      return changes;
    }
  }, {
    key: 'getChanges',
    value: function getChanges() {
      if (this.cachedChanges == null) {
        if (this.serializedChanges == null) {
          this.cachedChanges = this.iterator.getChanges();
        } else {
          this.cachedChanges = (0, _serialization.deserializeChanges)(this.serializedChanges);
        }
      }

      return this.cachedChanges;
    }
  }, {
    key: 'deleteNode',
    value: function deleteNode(node) {
      this.bubbleNodeDown(node);
      if (node.parent) {
        if (node.parent.left === node) {
          node.parent.left = null;
        } else {
          node.parent.right = null;
          node.parent.inputExtent = node.parent.inputLeftExtent;
          node.parent.outputExtent = node.parent.outputLeftExtent;
          var ancestor = node.parent;
          while (ancestor.parent && ancestor.parent.right === ancestor) {
            ancestor.parent.inputExtent = (0, _pointHelpers.traverse)(ancestor.parent.inputLeftExtent, ancestor.inputExtent);
            ancestor.parent.outputExtent = (0, _pointHelpers.traverse)(ancestor.parent.outputLeftExtent, ancestor.outputExtent);
            ancestor = ancestor.parent;
          }
        }

        this.splayNode(node.parent);
      } else {
        this.root = null;
      }

      this.nodesCount--;
    }
  }, {
    key: 'bubbleNodeDown',
    value: function bubbleNodeDown(node) {
      var rightAncestor = undefined;

      while (true) {
        if (node.left) {
          this.rotateNodeRight(node.left);
        } else if (node.right) {
          rightAncestor = node.right;
          this.rotateNodeLeft(node.right);
        } else {
          break;
        }
      }

      return rightAncestor;
    }
  }, {
    key: 'splayNode',
    value: function splayNode(node) {
      if (node == null) return;

      while (true) {
        if (this.isNodeLeftChild(node.parent) && this.isNodeRightChild(node)) {
          // zig-zag
          this.rotateNodeLeft(node);
          this.rotateNodeRight(node);
        } else if (this.isNodeRightChild(node.parent) && this.isNodeLeftChild(node)) {
          // zig-zag
          this.rotateNodeRight(node);
          this.rotateNodeLeft(node);
        } else if (this.isNodeLeftChild(node.parent) && this.isNodeLeftChild(node)) {
          // zig-zig
          this.rotateNodeRight(node.parent);
          this.rotateNodeRight(node);
        } else if (this.isNodeRightChild(node.parent) && this.isNodeRightChild(node)) {
          // zig-zig
          this.rotateNodeLeft(node.parent);
          this.rotateNodeLeft(node);
        } else {
          // zig
          if (this.isNodeLeftChild(node)) {
            this.rotateNodeRight(node);
          } else if (this.isNodeRightChild(node)) {
            this.rotateNodeLeft(node);
          }

          return;
        }
      }
    }
  }, {
    key: 'isNodeLeftChild',
    value: function isNodeLeftChild(node) {
      return node != null && node.parent != null && node.parent.left === node;
    }
  }, {
    key: 'isNodeRightChild',
    value: function isNodeRightChild(node) {
      return node != null && node.parent != null && node.parent.right === node;
    }
  }, {
    key: 'rotateNodeLeft',
    value: function rotateNodeLeft(pivot) {
      var root = pivot.parent;

      if (root.parent) {
        if (root === root.parent.left) {
          root.parent.left = pivot;
        } else {
          root.parent.right = pivot;
        }
      } else {
        this.root = pivot;
      }
      pivot.parent = root.parent;

      root.right = pivot.left;
      if (root.right) {
        root.right.parent = root;
      }

      pivot.left = root;
      pivot.left.parent = pivot;

      pivot.inputLeftExtent = (0, _pointHelpers.traverse)(root.inputLeftExtent, pivot.inputLeftExtent);
      pivot.inputExtent = (0, _pointHelpers.traverse)(pivot.inputLeftExtent, pivot.right ? pivot.right.inputExtent : _pointHelpers.ZERO_POINT);
      root.inputExtent = (0, _pointHelpers.traverse)(root.inputLeftExtent, root.right ? root.right.inputExtent : _pointHelpers.ZERO_POINT);

      pivot.outputLeftExtent = (0, _pointHelpers.traverse)(root.outputLeftExtent, pivot.outputLeftExtent);
      pivot.outputExtent = (0, _pointHelpers.traverse)(pivot.outputLeftExtent, pivot.right ? pivot.right.outputExtent : _pointHelpers.ZERO_POINT);
      root.outputExtent = (0, _pointHelpers.traverse)(root.outputLeftExtent, root.right ? root.right.outputExtent : _pointHelpers.ZERO_POINT);
    }
  }, {
    key: 'rotateNodeRight',
    value: function rotateNodeRight(pivot) {
      var root = pivot.parent;

      if (root.parent) {
        if (root === root.parent.left) {
          root.parent.left = pivot;
        } else {
          root.parent.right = pivot;
        }
      } else {
        this.root = pivot;
      }
      pivot.parent = root.parent;

      root.left = pivot.right;
      if (root.left) {
        root.left.parent = root;
      }

      pivot.right = root;
      pivot.right.parent = pivot;

      root.inputLeftExtent = (0, _pointHelpers.traversalDistance)(root.inputLeftExtent, pivot.inputLeftExtent);
      root.inputExtent = (0, _pointHelpers.traversalDistance)(root.inputExtent, pivot.inputLeftExtent);
      pivot.inputExtent = (0, _pointHelpers.traverse)(pivot.inputLeftExtent, root.inputExtent);

      root.outputLeftExtent = (0, _pointHelpers.traversalDistance)(root.outputLeftExtent, pivot.outputLeftExtent);
      root.outputExtent = (0, _pointHelpers.traversalDistance)(root.outputExtent, pivot.outputLeftExtent);
      pivot.outputExtent = (0, _pointHelpers.traverse)(pivot.outputLeftExtent, root.outputExtent);
    }
  }]);

  return Patch;
})();

exports['default'] = Patch;
module.exports = exports['default'];
