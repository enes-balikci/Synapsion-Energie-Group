document.addEventListener("DOMContentLoaded", function () {
  // Tüm <button> ve <input type="button|submit|reset"> öğelerini bul
  const buttons = Array.from(document.querySelectorAll('button,input[type="button"],input[type="submit"],input[type="reset"]'));

  buttons.forEach(function (btn) {
    // Zaten kapsayıcıya alınmışsa tekrar alma
    if (btn.parentElement && btn.parentElement.classList.contains('webgl-button-container')) return;

    // Kapsayıcı oluştur
    const container = document.createElement('span');
    container.className = 'webgl-button-container';
    container.style.display = 'inline-block';
    container.style.position = 'relative';

    // Canvas ekle
    const canvas = document.createElement('canvas');
    canvas.className = 'webgl-canvas';
    canvas.style.position = 'absolute';
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = 0;
    canvas.style.pointerEvents = 'none';
    canvas.style.borderRadius = getComputedStyle(btn).borderRadius || '6px';

    // Kapsayıcıya ekle
    btn.parentNode.insertBefore(container, btn);
    container.appendChild(canvas);
    container.appendChild(btn);

    // WebGL başlat
    function syncCanvasSize() {
      canvas.width = btn.offsetWidth;
      canvas.height = btn.offsetHeight;
    }
    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);

    const gl = canvas.getContext('webgl', { alpha: true });
    if (!gl) {
      canvas.style.display = "none";
      return;
    }

    // Vertex shader
    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0, 1);
      }
    `;
    // Fragment shader (şeffaf mavi dalga)
    const fsSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        float wave = 0.5 + 0.5 * sin(u_time + uv.x * 10.0 + uv.y * 10.0);
        float alpha = 0.28 + 0.22 * wave;
        vec3 color = mix(vec3(0.0,0.7,1.0), vec3(1.0,1.0,1.0), uv.y);
        gl_FragColor = vec4(color, alpha);
      }
    `;
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

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');

    let startTime = performance.now();
    let hover = false;

    btn.addEventListener('mouseenter', function () { hover = true; });
    btn.addEventListener('mouseleave', function () { hover = false; });

    function render() {
      syncCanvasSize();
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      let t = (performance.now() - startTime) / 1000;
      if (hover) t *= 2.1;

      gl.uniform1f(timeLocation, t);
      gl.uniform2f(resolutionLocation, gl.drawingBufferWidth, gl.drawingBufferHeight);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      requestAnimationFrame(render);
    }
    render();
  });
});
