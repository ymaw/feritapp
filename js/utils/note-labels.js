export function findNoteLabel(labels, id) {
  return labels.find(function(label) {
    return label.id === id;
  }) || null;
}
