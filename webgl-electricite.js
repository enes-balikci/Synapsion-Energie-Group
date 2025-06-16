// webgl-electricite.js
(function(){
  const container = document.getElementById('webgl-electric-network');
  if (!container) return;
  let w = container.offsetWidth || 600;
  let h = container.offsetHeight || 400;

  // Renderer
  const renderer = new THREE.WebGLRenderer({alpha:true,antialias:true});
  renderer.setPixelRatio(window.devicePixelRatio || 1.5);
  renderer.setSize(w, h, false);
  container.innerHTML = ''; // varolanı temizle (tekrar eklenirse)
  container.appendChild(renderer.domElement);

  // Scene & Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, w/h, 1, 3000);
  camera.position.set(0, 0, 700);

  // Ambient & Point Light
  scene.add(new THREE.AmbientLight(0x99ccff, 0.6));
  let pointLight = new THREE.PointLight(0xffffff, 1.1, 2000);
  pointLight.position.set(0,0,500);
  scene.add(pointLight);

  // Nodes (points)
  const nodeCount = 18;
  const nodes = [];
  for(let i=0;i<nodeCount;i++){
    let theta = (i / nodeCount) * Math.PI * 2;
    let r = 180 + Math.sin(i) * 32;
    let geo = new THREE.SphereGeometry(12 + Math.random() * 8, 28, 28);
    let mat = new THREE.MeshPhongMaterial({color:0x29a3ff, emissive:0x0080ff, shininess:90, opacity:0.94, transparent:true});
    let mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(Math.cos(theta) * r, Math.sin(theta) * r * 0.8, Math.sin(theta*1.5) * r * 0.5);
    scene.add(mesh);
    nodes.push(mesh);
  }
  // Edges (lines)
  for(let i=0;i<nodeCount;i++){
    let j = (i + Math.floor(nodeCount/3)) % nodeCount;
    let geometry = new THREE.BufferGeometry().setFromPoints([nodes[i].position, nodes[j].position]);
    let mat = new THREE.LineBasicMaterial({color:0x35b1ff, opacity:0.28, transparent:true});
    let line = new THREE.Line(geometry, mat);
    scene.add(line);
  }

  // Animation loop
  function animate(){
    // Nodal pulsation effect
    for(let i=0;i<nodes.length;i++){
      nodes[i].scale.setScalar(1 + Math.sin(Date.now()/500 + i) * 0.08);
    }
    scene.rotation.y += 0.0013;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  // Responsive resize
  window.addEventListener('resize', ()=>{
    let newW = container.offsetWidth || 600;
    let newH = container.offsetHeight || 400;
    renderer.setSize(newW, newH, false);
    camera.aspect = newW / newH;
    camera.updateProjectionMatrix();
  });
})();
