// Arka planda etkileşimli elektrik ağı WebGL animasyonu
(function(){
  const container = document.getElementById('webgl-electric-network');
  if (!container) return;
  const w = container.offsetWidth, h = 400;
  const renderer = new THREE.WebGLRenderer({alpha:true,antialias:true});
  renderer.setSize(w,h,false);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, w/h, 1, 6000);
  camera.position.set(0,0,760);

  // Reseau: Noeuds (nodes) et connexions (liens)
  const nodeCount = 24;
  const nodes = [];
  for(let i=0;i<nodeCount;i++){
    let phi = Math.PI*2*i/nodeCount, r = 155+Math.sin(i*0.8)*37;
    let sphereGeo = new THREE.SphereGeometry(16+Math.random()*10,28,28);
    let sphereMat = new THREE.MeshPhongMaterial({color:0x29a3ff, emissive:0x0080ff, shininess:80, opacity:0.95, transparent:true});
    let s = new THREE.Mesh(sphereGeo,sphereMat);
    s.position.set(Math.cos(phi)*r, Math.sin(phi)*r*0.8, Math.sin(phi*1.6)*r*0.66);
    scene.add(s);
    nodes.push(s);
  }
  // Liens (edges)
  const links = [];
  for(let i=0;i<nodeCount;i++){
    let j = (i+Math.floor(nodeCount/3)+Math.floor(Math.random()*3))%nodeCount;
    let geometry = new THREE.BufferGeometry().setFromPoints([nodes[i].position,nodes[j].position]);
    let mat = new THREE.LineBasicMaterial({color:0x35b1ff,opacity:0.17+Math.random()*0.33,transparent:true});
    let line = new THREE.Line(geometry,mat);
    scene.add(line);
    links.push(line);
  }
  // Éclairage
  const amb = new THREE.AmbientLight(0xa9c9f5,0.8);
  scene.add(amb);
  const dL = new THREE.PointLight(0xffffff,1.2,1500);
  dL.position.set(0,0,600);
  scene.add(dL);

  // Animation: pulsation et rotation
  function animate(){
    for(let i=0;i<nodes.length;i++){
      nodes[i].scale.setScalar(1+Math.sin(Date.now()/800+i)*0.09);
    }
    scene.rotation.y += 0.0018;
    scene.rotation.x = Math.sin(Date.now()/2300)*0.07;
    renderer.render(scene,camera);
    requestAnimationFrame(animate);
  }
  animate();
  window.addEventListener('resize',()=>{
    renderer.setSize(container.offsetWidth,h,false);
    camera.aspect = container.offsetWidth/h;
    camera.updateProjectionMatrix();
  });
})();
