// weather-background.js
(async function() {
  function getCoords() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject('Konum desteği yok.');
      navigator.geolocation.getCurrentPosition(
        pos => resolve([pos.coords.latitude, pos.coords.longitude]),
        () => resolve([48.8566, 2.3522]) // fallback Paris
      );
    });
  }
  async function getWeatherCode(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
    const res = await fetch(url);
    const data = await res.json();
    return data.current_weather ? data.current_weather.weathercode : 0;
  }

  function animateWeather(code) {
    const canvas = document.getElementById('weather-bg');
    const pixelRatio = Math.max(window.devicePixelRatio || 1, 2.5); // Ultra netlik
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    canvas.style.filter = 'blur(2px) brightness(1.09) saturate(1.08)';

    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 3000);
    camera.position.z = 900;

    function resizeRenderer() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(pixelRatio);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resizeRenderer);
    resizeRenderer();

    // 0: Güneşli - Lens flare, sıcak partiküller, hafif hava dalgası
    if (code === 0) {
      // Güneş (lens flare efekti için büyük sprite)
      let sunTexture = new THREE.TextureLoader().load("https://upload.wikimedia.org/wikipedia/commons/5/5a/Sun_flare.png");
      let sunMat = new THREE.SpriteMaterial({ map: sunTexture, color: 0xfff7c0, opacity: 0.7, transparent: true });
      let sun = new THREE.Sprite(sunMat);
      sun.scale.set(420, 420, 1);
      sun.position.set(0, 250, 0);
      scene.add(sun);

      // Parlak sıcak partiküller
      let geometry = new THREE.BufferGeometry();
      let count = 2800;
      let positions = new Float32Array(count*3), colors = new Float32Array(count*3);
      for(let i=0;i<count;i++){
        positions[i*3]=(Math.random()-0.5)*2800;
        positions[i*3+1]=(Math.random()-0.5)*1200;
        positions[i*3+2]=(Math.random()-0.5)*2200;
        colors[i*3]=1;
        colors[i*3+1]=0.91+Math.random()*0.09;
        colors[i*3+2]=0.47+Math.random()*0.18;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions,3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors,3));
      let mat = new THREE.PointsMaterial({vertexColors:true, size:13, opacity:0.18, transparent:true, sizeAttenuation:true});
      let pts = new THREE.Points(geometry,mat);
      scene.add(pts);

      // Hafif hava dalgası için sinüsle kamera pozisyonu oynat
      function anim(){
        sun.material.opacity = 0.7 + 0.18*Math.sin(Date.now()/800);
        sun.position.y = 250 + Math.sin(Date.now()/1200)*30;
        pts.rotation.y += 0.0014;
        pts.rotation.x += 0.0007;
        camera.position.x = Math.sin(Date.now()/2000)*70;
        camera.position.y = Math.cos(Date.now()/2500)*54;
        camera.lookAt(scene.position);
        renderer.render(scene,camera);
        requestAnimationFrame(anim);
      }
      anim();
    }
    // 1,2,3,45,48: Bulutlu/Puslu/Sisli - Dinamik bulut tabakası + hafif sis
    else if ([1,2,3,45,48].includes(code)) {
      // Bulut katmanları (iki tabaka)
      function createCloudLayer(count, spreadX, spreadY, spreadZ, color, size, opacity, speed) {
        let geometry = new THREE.BufferGeometry();
        let positions = new Float32Array(count*3), colors = new Float32Array(count*3);
        for(let i=0;i<count;i++){
          positions[i*3]=(Math.random()-0.5)*spreadX;
          positions[i*3+1]=(Math.random()-0.5)*spreadY;
          positions[i*3+2]=(Math.random()-0.5)*spreadZ;
          colors[i*3]=color[0]; colors[i*3+1]=color[1]; colors[i*3+2]=color[2];
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions,3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors,3));
        let mat = new THREE.PointsMaterial({vertexColors:true, size, opacity, transparent:true, sizeAttenuation:true});
        let pts = new THREE.Points(geometry,mat);
        pts.userData = { speed };
        scene.add(pts);
        return pts;
      }
      let clouds1 = createCloudLayer(2400, 3200, 500, 1800, [0.88,0.88,0.93], 55, 0.12, 0.0002);
      let clouds2 = createCloudLayer(1600, 1850, 350, 2400, [0.74,0.76,0.83], 35, 0.10, -0.0001);

      // Hafif sis efekti (yarı saydam büyük disk)
      let fogGeo = new THREE.CircleGeometry(2400, 32);
      let fogMat = new THREE.MeshBasicMaterial({color:0xc6d0de, opacity:0.08, transparent:true});
      let fog = new THREE.Mesh(fogGeo, fogMat);
      fog.position.set(0, -300, -300);
      fog.rotation.x = -Math.PI/2;
      scene.add(fog);

      function anim(){
        clouds1.rotation.y += clouds1.userData.speed;
        clouds2.rotation.y += clouds2.userData.speed;
        fog.material.opacity = 0.08 + 0.01*Math.sin(Date.now()/1700);
        renderer.render(scene,camera);
        requestAnimationFrame(anim);
      }
      anim();
    }
    // Yağmurlu - Damlalar + hızlı bulut akışı
    else if ([51,53,55,61,63,65,80,81,82].includes(code)) {
      // Damlalar
      let drops=[];
      let dropCount=2100;
      for(let i=0;i<dropCount;i++){
        let geo = new THREE.SphereGeometry(1.25,8,8);
        let mat = new THREE.MeshBasicMaterial({color:0x6bb7ff,opacity:0.29+Math.random()*0.28,transparent:true});
        let mesh = new THREE.Mesh(geo,mat);
        mesh.position.set((Math.random()-0.5)*2500,Math.random()*1200, (Math.random()-0.5)*1000);
        scene.add(mesh);
        drops.push(mesh);
      }
      // Bulut tabakası
      let geometry = new THREE.BufferGeometry();
      let count = 1300;
      let positions = new Float32Array(count*3), colors = new Float32Array(count*3);
      for(let i=0;i<count;i++){
        positions[i*3]=(Math.random()-0.5)*3200;
        positions[i*3+1]=(Math.random()-0.5)*400;
        positions[i*3+2]=(Math.random()-0.5)*1700;
        let c=0.73+Math.random()*0.19;
        colors[i*3]=c; colors[i*3+1]=c; colors[i*3+2]=c;
      }
      geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
      geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
      let mat = new THREE.PointsMaterial({vertexColors:true, size:44, opacity:0.17, transparent:true, sizeAttenuation:true});
      let pts = new THREE.Points(geometry,mat);
      scene.add(pts);

      function anim(){
        for(let d of drops){
          d.position.y -= 17+Math.random()*8;
          if(d.position.y<-300) d.position.y=1200+Math.random()*210;
        }
        pts.rotation.y += 0.0004;
        renderer.render(scene,camera);
        requestAnimationFrame(anim);
      }
      anim();
    }
    // Karlı - Büyük dönen taneler, 2 tabaka
    else if ([71,73,75,77,85,86].includes(code)) {
      let snows1=[], snows2=[];
      let snowCount1=1200, snowCount2=800;
      for(let i=0;i<snowCount1;i++){
        let geo = new THREE.SphereGeometry(3.5,8,8);
        let mat = new THREE.MeshBasicMaterial({color:0xffffff,opacity:0.69+Math.random()*0.22,transparent:true});
        let mesh = new THREE.Mesh(geo,mat);
        mesh.position.set((Math.random()-0.5)*2000,Math.random()*1500, (Math.random()-0.5)*1300);
        scene.add(mesh);
        snows1.push(mesh);
      }
      for(let i=0;i<snowCount2;i++){
        let geo = new THREE.SphereGeometry(6,8,8);
        let mat = new THREE.MeshBasicMaterial({color:0xe4f6ff,opacity:0.41+Math.random()*0.38,transparent:true});
        let mesh = new THREE.Mesh(geo,mat);
        mesh.position.set((Math.random()-0.5)*3400,Math.random()*1200, (Math.random()-0.5)*2100);
        scene.add(mesh);
        snows2.push(mesh);
      }
      function anim(){
        for(let s of snows1){
          s.position.y -= 4+Math.random()*2.7;
          s.position.x += Math.sin(Date.now()/800+s.position.y)*0.33;
          s.rotation.z += 0.005;
          if(s.position.y<-380) s.position.y=1500+Math.random()*200;
        }
        for(let s of snows2){
          s.position.y -= 2+Math.random()*1.6;
          s.position.x += Math.cos(Date.now()/1400+s.position.y)*0.14;
          s.rotation.z -= 0.004;
          if(s.position.y<-320) s.position.y=1200+Math.random()*220;
        }
        renderer.render(scene,camera);
        requestAnimationFrame(anim);
      }
      anim();
    }
    // Fırtına - Damlalar + bulut + dinamik şimşek
    else if ([95,96,99].includes(code)) {
      let drops=[], flashes=0;
      let dropCount=1200;
      for(let i=0;i<dropCount;i++){
        let geo = new THREE.SphereGeometry(1.7,8,8);
        let mat = new THREE.MeshBasicMaterial({color:0x2288ff,opacity:0.47+Math.random()*0.3,transparent:true});
        let mesh = new THREE.Mesh(geo,mat);
        mesh.position.set((Math.random()-0.5)*2400,Math.random()*1200, (Math.random()-0.5)*1100);
        scene.add(mesh);
        drops.push(mesh);
      }
      // Bulut tabakası
      let geometry = new THREE.BufferGeometry();
      let count = 1400;
      let positions = new Float32Array(count*3), colors = new Float32Array(count*3);
      for(let i=0;i<count;i++){
        positions[i*3]=(Math.random()-0.5)*3200;
        positions[i*3+1]=(Math.random()-0.5)*400;
        positions[i*3+2]=(Math.random()-0.5)*1700;
        let c=0.62+Math.random()*0.21;
        colors[i*3]=c; colors[i*3+1]=c; colors[i*3+2]=c;
      }
      geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
      geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
      let mat = new THREE.PointsMaterial({vertexColors:true, size:54, opacity:0.17, transparent:true, sizeAttenuation:true});
      let pts = new THREE.Points(geometry,mat);
      scene.add(pts);
      // Şimşek
      let flash = new THREE.PointLight(0xffffee,0,3500);
      flash.position.set(0, 600, 0);
      scene.add(flash);
      function anim(){
        for(let d of drops){
          d.position.y -= 18+Math.random()*13;
          if(d.position.y<-340) d.position.y=1200+Math.random()*190;
        }
        pts.rotation.y += 0.0005;
        // Şimşek efekti
        if(Math.random()<0.01) flashes=1+Math.random()*2.2;
        if(flashes>0){
          flash.intensity = 18*flashes;
          flash.color.setHSL(0.12+Math.random()*0.1,1,0.9);
          flashes -= 0.19;
        }else{
          flash.intensity = 0;
        }
        renderer.render(scene,camera);
        requestAnimationFrame(anim);
      }
      anim();
    }
    // Diğer - Nötr bulutlu
    else {
      let geometry = new THREE.BufferGeometry();
      let count = 1200;
      let positions = new Float32Array(count*3), colors = new Float32Array(count*3);
      for(let i=0;i<count;i++){
        positions[i*3]=(Math.random()-0.5)*1200;
        positions[i*3+1]=(Math.random()-0.5)*250;
        positions[i*3+2]=(Math.random()-0.5)*700;
        let c=0.7+Math.random()*0.23;
        colors[i*3]=c; colors[i*3+1]=c; colors[i*3+2]=c;
      }
      geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
      geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
      let mat = new THREE.PointsMaterial({vertexColors:true, size:36, opacity:0.18, transparent:true, sizeAttenuation:true});
      let pts = new THREE.Points(geometry,mat);
      scene.add(pts);
      function anim(){
        pts.rotation.y += 0.0005;
        pts.rotation.x += 0.00015;
        renderer.render(scene,camera);
        requestAnimationFrame(anim);
      }
      anim();
    }
  }

  const [lat, lon] = await getCoords();
  const code = await getWeatherCode(lat, lon);
  animateWeather(code);
})();
