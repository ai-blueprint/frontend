export function getParentSize(element) {
  const parent = element.parentElement;
  return {
    width: parent.clientWidth,
    height: parent.clientHeight,
  };
}
