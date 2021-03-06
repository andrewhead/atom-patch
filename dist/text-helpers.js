/** @babel */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getExtent = getExtent;
exports.getPrefix = getPrefix;
exports.getSuffix = getSuffix;
exports.characterIndexForPoint = characterIndexForPoint;
var NEWLINE_REG_EXP = /\n/g;

function getExtent(text) {
  var lastLineStartIndex = 0;
  var row = 0;
  NEWLINE_REG_EXP.lastIndex = 0;
  while (NEWLINE_REG_EXP.exec(text)) {
    row++;
    lastLineStartIndex = NEWLINE_REG_EXP.lastIndex;
  }
  var column = text.length - lastLineStartIndex;
  return { row: row, column: column };
}

function getPrefix(text, prefixExtent) {
  return text.substring(0, characterIndexForPoint(text, prefixExtent));
}

function getSuffix(text, prefixExtent) {
  return text.substring(characterIndexForPoint(text, prefixExtent));
}

function characterIndexForPoint(text, point) {
  var row = point.row;
  var column = point.column;

  NEWLINE_REG_EXP.lastIndex = 0;
  while (row-- > 0) {
    var matches = NEWLINE_REG_EXP.exec(text);
    if (matches == null) {
      return text.length;
    }
  }
  return NEWLINE_REG_EXP.lastIndex + column;
}
