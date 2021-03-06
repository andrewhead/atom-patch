/** @babel */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var idCounter = 0;

var Node = function Node(parent, inputLeftExtent, outputLeftExtent) {
  _classCallCheck(this, Node);

  this.parent = parent;
  this.left = null;
  this.right = null;
  this.inputLeftExtent = inputLeftExtent;
  this.outputLeftExtent = outputLeftExtent;
  this.inputExtent = inputLeftExtent;
  this.outputExtent = outputLeftExtent;

  this.id = ++idCounter;
  this.isChangeStart = false;
  this.isChangeEnd = false;
  this.newText = null;
  this.oldText = null;
};

exports["default"] = Node;
module.exports = exports["default"];
