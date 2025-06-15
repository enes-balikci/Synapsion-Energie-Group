document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('.webgl-button-container').forEach(function (container) {
    const canvas = container.querySelector('.webgl-canvas');
    const button = container.querySelector('.webgl-btn');
    if (!canvas || !button) return;

    function syncCanvasSize() {
      canvas.width = button.offsetWidth;
      canvas.height = button.offsetHeight;
      canvas.style.width = button.offsetWidth + 'px';
      canvas.style.height = button.offsetHeight + 'px';
    }
    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);

    // WebGL başlat
    const gl = canvas.getContext('webgl', { alpha: true });
    if (!gl) {
      canvas.style.display = "none"; // WebGL desteklenmiyorsa canvası gizle
      return;
    }

    // Vertex shader
    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0, 1);
      }
    `;

    // Fragment shader (şeffaf mavi dalga efektli)
    const fsSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        float wave = 0.5 + 0.5 * sin(u_time + uv.x * 10.0 + uv.y * 10.0);
        float alpha = 0.35 + 0.25 * wave;
        vec3 color = mix(vec3(0.0,0.7,1.0), vec3(1.0,1.0,1.0), uv.y);
        gl_FragColor = vec4(color, alpha);
      }
    `;

    // Shader yardımcıları
    function compileShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    function createProgram(gl, vsSource, fsSource) {
      const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
      const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
      if (!vertexShader || !fragmentShader) return null;
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
      }
      return program;
    }

    const program = createProgram(gl, vsSource, fsSource);
    if (!program) return;

    // Quad verisi
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
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

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');

    let startTime = performance.now();
    let hover = false;

    button.addEventListener('mouseenter', function () { hover = true; });
    button.addEventListener('mouseleave', function () { hover = false; });

    function render() {
      syncCanvasSize();
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      let t = (performance.now() - startTime) / 1000;
      if (hover) t *= 2.1; // Hoverda animasyon hızlansın

      gl.uniform1f(timeLocation, t);
      gl.uniform2f(resolutionLocation, gl.drawingBufferWidth, gl.drawingBufferHeight);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      requestAnimationFrame(render);
    }
    render();
  });
});
