function createWebGLContext(canvas) {
  const gl = canvas.getContext('webgl', {alpha:true});
  if (!gl) {
    alert('WebGL not supported!');
    return null;
  }
  return gl;
}

// Basit bir animasyon için fragment shader
const fragShaderSrc = `
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float alpha = 0.5 + 0.5 * sin(u_time + uv.x * 10.0);
  vec3 color = mix(vec3(1.0,1.0,1.0), vec3(0.0,0.7,1.0), uv.x);
  gl_FragColor = vec4(color, alpha * 0.7);
}`;

// Sabit bir vertex shader
const vertShaderSrc = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0, 1);
}`;

// Yardımcı fonksiyonlar:
function compileShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw gl.getShaderInfoLog(shader);
  }
  return shader;
}

function createProgram(gl, vsSrc, fsSrc) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw gl.getProgramInfoLog(prog);
  }
  return prog;
}

function resizeCanvasToDisplaySize(canvas) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function startWebGLButtonAnimation(container) {
  const canvas = container.querySelector('.webgl-canvas');
  const button = container.querySelector('.webgl-btn');
  function syncCanvasSize() {
    canvas.style.width = button.offsetWidth + 'px';
    canvas.style.height = button.offsetHeight + 'px';
    resizeCanvasToDisplaySize(canvas);
  }
  syncCanvasSize();
  window.addEventListener('resize', syncCanvasSize);

  const gl = createWebGLContext(canvas);
  if (!gl) return;

  const program = createProgram(gl, vertShaderSrc, fragShaderSrc);
  const positionLoc = gl.getAttribLocation(program, 'a_position');
  const timeLoc = gl.getUniformLocation(program, 'u_time');
  const resLoc = gl.getUniformLocation(program, 'u_resolution');

  // Fullscreen quad
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ]),
    gl.STATIC_DRAW
  );

  let startTime = Date.now();
  let hover = false;
  button.addEventListener('mouseenter', () => { hover = true; });
  button.addEventListener('mouseleave', () => { hover = false; });

  function render() {
    syncCanvasSize();
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    gl.enableVertexAttribArray(positionLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    let t = (Date.now() - startTime) / 1000;
    if (hover) t *= 2.5; // Hover animasyonu hızlansın

    gl.uniform1f(timeLoc, t);
    gl.uniform2f(resLoc, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
  }
  render();
}

// Tüm butonlara uygula
document.querySelectorAll('.webgl-button-container').forEach(startWebGLButtonAnimation);
