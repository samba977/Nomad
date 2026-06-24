let ioRef = null;

function setIO(io) {
  ioRef = io;
}
function getIO() {
  return ioRef;
}

module.exports = { setIO, getIO };
