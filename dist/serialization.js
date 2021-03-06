/** @babel */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.deserializeChanges = deserializeChanges;
exports.serializeChanges = serializeChanges;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _vendorFlatbuffers = require('../vendor/flatbuffers');

var _vendorFlatbuffers2 = _interopRequireDefault(_vendorFlatbuffers);

var _serializationSchema_generated = require('./serialization-schema_generated');

var _serializationSchema_generated2 = _interopRequireDefault(_serializationSchema_generated);

function deserializeChanges(serializedChanges) {
  var buffer = new _vendorFlatbuffers2['default'].ByteBuffer(serializedChanges.bytes);
  buffer.setPosition(serializedChanges.position);
  var patch = _serializationSchema_generated2['default'].Patch.getRootAsPatch(buffer);
  var changes = [];
  for (var i = 0; i < patch.changesLength(); i++) {
    var serializedChange = patch.changes(i);
    var oldStart = serializedChange.oldStart();
    var newStart = serializedChange.newStart();
    var oldExtent = serializedChange.oldExtent();
    var newExtent = serializedChange.newExtent();
    var change = {
      oldStart: { row: oldStart.row(), column: oldStart.column() },
      newStart: { row: newStart.row(), column: newStart.column() },
      oldExtent: { row: oldExtent.row(), column: oldExtent.column() },
      newExtent: { row: newExtent.row(), column: newExtent.column() }
    };
    var newText = serializedChange.newText();
    var oldText = serializedChange.oldText();
    if (newText != null) change.newText = newText;
    if (oldText != null) change.oldText = oldText;

    changes.push(change);
  }

  return changes;
}

function serializeChanges(changesToSerialize) {
  var builder = new _vendorFlatbuffers2['default'].Builder(1);
  var changes = changesToSerialize.map(function (_ref) {
    var oldStart = _ref.oldStart;
    var newStart = _ref.newStart;
    var oldExtent = _ref.oldExtent;
    var newExtent = _ref.newExtent;
    var oldText = _ref.oldText;
    var newText = _ref.newText;

    var serializedNewText = undefined,
        serializedOldText = undefined;
    if (newText != null) serializedNewText = builder.createString(newText);
    if (oldText != null) serializedOldText = builder.createString(oldText);
    _serializationSchema_generated2['default'].Change.startChange(builder);
    _serializationSchema_generated2['default'].Change.addOldStart(builder, _serializationSchema_generated2['default'].Point.createPoint(builder, oldStart.row, oldStart.column));
    _serializationSchema_generated2['default'].Change.addNewStart(builder, _serializationSchema_generated2['default'].Point.createPoint(builder, newStart.row, newStart.column));
    _serializationSchema_generated2['default'].Change.addOldExtent(builder, _serializationSchema_generated2['default'].Point.createPoint(builder, oldExtent.row, oldExtent.column));
    _serializationSchema_generated2['default'].Change.addNewExtent(builder, _serializationSchema_generated2['default'].Point.createPoint(builder, newExtent.row, newExtent.column));
    if (serializedNewText) _serializationSchema_generated2['default'].Change.addNewText(builder, serializedNewText);
    if (serializedOldText) _serializationSchema_generated2['default'].Change.addOldText(builder, serializedOldText);
    return _serializationSchema_generated2['default'].Change.endChange(builder);
  });

  var changesVector = _serializationSchema_generated2['default'].Patch.createChangesVector(builder, changes);
  _serializationSchema_generated2['default'].Patch.startPatch(builder);
  _serializationSchema_generated2['default'].Patch.addChanges(builder, changesVector);
  builder.finish(_serializationSchema_generated2['default'].Patch.endPatch(builder));
  var buffer = builder.dataBuffer();
  return { position: buffer.position(), bytes: buffer.bytes() };
}
