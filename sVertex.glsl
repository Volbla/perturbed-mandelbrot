precision mediump float;

attribute vec2 Position;

void main() {
  gl_Position = vec4(Position, 1, 1);
}