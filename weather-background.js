// weather-background.js
// ANIMATION: Ultra yüksek çözünürlük ve aşırı gerçekçi WebGL hava durumu arka planı
(async function() {
  function getCoords() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject('Pas de support de la géolocalisation.');
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
    // Ultra yüksek çözünürlük ve yumuşaklık için ayarlar
    const pixelRatio = Math.max(window.devicePixelRatio || 1, 3); // Retina ve üstü → 3
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      logarithmicDepthBuffer: true,
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    // Hafif bulanıklık ve yumuşak geçiş için CSS filter (postprocess ile daha da ileri yapılabilir!)
    canvas.style.filter = 'blur(1.5px) brightness(1.08) saturate(1.11)';

    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 5000);
    camera.position.set(0, 0, 1200);

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

    // === ULTRA GERÇEKÇİ HAVA DURUMU ANİMASYONLARI ===

    // --- GÜNEŞLİ: Parlak güneş, lens flare, sıcak hava dalgası, gerçekçi ışık efektleri ---
    if (code === 0) {
      // Güneş - lens flare ve bloom etkisi için sprite ve ışık
      let sunTexture = new THREE.TextureLoader().load("https://raw.githubusercontent.com/pmndrs/drei-assets/main/lensflare/lensflare0.png");
      let sunMat = new THREE.SpriteMaterial({ map: sunTexture, color: 0xffffee, opacity: 0.93, transparent: true, depthWrite: false });
      let sun = new THREE.Sprite(sunMat);
      sun.scale.set(900, 900, 1);
      sun.position.set(0, 500, -600);
      scene.add(sun);

      // Sıcaklığı göstermek için birkaç küçük lens flare spotları
      function addFlare(x, y, s, c) {
        let mat = new THREE.SpriteMaterial({ map: sunTexture, color: c, opacity: 0.61, transparent: true, depthWrite: false });
        let sp = new THREE.Sprite(mat);
        sp.position.set(x, y, -600);
        sp.scale.set(s, s, 1);
        scene.add(sp);
        return sp;
      }
      const flares = [
        addFlare(170, 480, 180, 0xffd268),
        addFlare(-200, 410, 120, 0xf8f5d8),
        addFlare(90, 515, 70, 0xfff6d5)
      ];

      // Ultra gerçekçi sıcak partiküller
      let geometry = new THREE.BufferGeometry();
      let count = 5000;
      let positions = new Float32Array(count*3), colors = new Float32Array(count*3), sizes = new Float32Array(count);
      for(let i=0;i<count;i++){
        positions[i*3]=(Math.random()-0.5)*3800;
        positions[i*3+1]=(Math.random()-0.5)*2000;
        positions[i*3+2]=(Math.random()-0.5)*3200;
        colors[i*3]=1;
        colors[i*3+1]=0.93+Math.random()*0.06;
        colors[i*3+2]=0.59+Math.random()*0.13;
        sizes[i] = 12 + Math.random()*28;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions,3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors,3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes,1));
      let mat = new THREE.PointsMaterial({
        vertexColors:true,
        size:19,
        opacity:0.19,
        transparent:true,
        blending:THREE.AdditiveBlending,
        depthWrite:false,
        sizeAttenuation:true
      });
      let pts = new THREE.Points(geometry,mat);
      scene.add(pts);

      // Hafif sıcak hava dalgası - kırılma efekti için dalgalanan postprocess veya sinüsle kamera oynatma
      function anim(){
        sun.material.opacity = 0.93 + 0.09*Math.sin(Date.now()/700);
        pts.rotation.y += 0.0013;
        pts.rotation.x += 0.0009;
        flares[0].material.opacity = 0.67 + 0.11*Math.sin(Date.now()/1500);
        flares[1].material.opacity = 0.45 + 0.09*Math.sin(Date.now()/1800);
        flares[2].material.opacity = 0.34 + 0.06*Math.sin(Date.now()/1900);
        camera.position.x = Math.sin(Date.now()/3100)*60;
        camera.position.y = Math.cos(Date.now()/2600)*73;
        camera.lookAt(new THREE.Vector3(0,0,0));
        renderer.render(scene,camera);
        requestAnimationFrame(anim);
      }
      anim();
    }
    // --- BULUTLU/SİSLİ: Çok katmanlı hacimli bulutlar ve yumuşak pus ---
    else if ([1,2,3,45,48].includes(code)) {
      // Ultra gerçekçi bulutlar: Sprite tabanlı volumetrik katmanlar
      let cloudTexture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/cloud.png');
      function createCloudLayer(n, r, z, color, size, speed) {
        let clouds = [];
        for(let i=0;i<n;i++){
          let mat = new THREE.SpriteMaterial({ map: cloudTexture, color, opacity: 0.35 + Math.random()*0.19, transparent: true, depthWrite: false });
          let sp = new THREE.Sprite(mat);
          let angle = Math.random()*Math.PI*2;
          let dist = r*(0.6+0.41*Math.random());
          sp.position.set(Math.cos(angle)*dist, (Math.random()-0.5)*380, Math.sin(angle)*dist + z);
          let s = size*(0.6+Math.random()*1.3);
          sp.scale.set(s, s, 1);
          scene.add(sp);
          clouds.push({sprite: sp, angle, dist, speed: speed*(0.8+Math.random()*0.5)});
        }
        return clouds;
      }
      let cloudsFar = createCloudLayer(40, 1900, -1050, 0xb9c4d6, 640, 0.00007);
      let cloudsNear = createCloudLayer(26, 1100, -300, 0xe3e7ed, 440, 0.00013);
      let cloudsLow = createCloudLayer(18, 600, 0, 0xf2f3f7, 260, 0.00019);

      // Puslu atmosfer için büyük saydam düzlem
      let fogGeo = new THREE.PlaneGeometry(4200, 2200, 1, 1);
      let fogMat = new THREE.MeshBasicMaterial({color:0xc2cdde, opacity:0.09, transparent:true, depthWrite:false});
      let fog = new THREE.Mesh(fogGeo, fogMat);
      fog.position.set(0, -90, -600);
      fog.rotation.x = -Math.PI/2.25;
      scene.add(fog);

      function anim(){
        for(let c of cloudsFar) {
          c.angle += c.speed;
          c.sprite.position.x = Math.cos(c.angle)*c.dist;
          c.sprite.position.z = Math.sin(c.angle)*c.dist - 1050;
        }
        for(let c of cloudsNear) {
          c.angle += c.speed;
          c.sprite.position.x = Math.cos(c.angle)*c.dist;
          c.sprite.position.z = Math.sin(c.angle)*c.dist - 300;
        }
        for(let c of cloudsLow) {
          c.angle += c.speed;
          c.sprite.position.x = Math.cos(c.angle)*c.dist;
          c.sprite.position.z = Math.sin(c.angle)*c.dist;
        }
        fog.material.opacity = 0.09 + 0.01*Math.sin(Date.now()/1800);
        renderer.render(scene,camera);
        requestAnimationFrame(anim);
      }
      anim();
    }
    // --- YAĞMURLU: Yüksek çözünürlüklü damlalar, bulut, yansıma efekti ---
    else if ([51,53,55,61,63,65,80,81,82].includes(code)) {
      // Bulutlar
      let cloudTexture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/cloud.png');
      let clouds = [];
      for(let i=0;i<18;i++){
        let mat = new THREE.SpriteMaterial({ map: cloudTexture, color:0xbee0fa, opacity:0.38+Math.random()*0.19, transparent: true, depthWrite: false });
        let sp = new THREE.Sprite(mat);
        let angle = Math.random()*Math.PI*2;
        let dist = 900*(0.7+0.5*Math.random());
        sp.position.set(Math.cos(angle)*dist, 280+Math.random()*340, Math.sin(angle)*dist-700);
        let s = 460*(0.7+Math.random()*1.1);
        sp.scale.set(s, s, 1);
        scene.add(sp);
        clouds.push({sprite: sp, angle, dist, speed: 0.00018*(0.7+Math.random()*0.5)});
      }
      // Ultra gerçekçi yağmur damlaları (parlak, yansımalı)
      let dropTexture = new THREE.TextureLoader().load('https://upload.wikimedia.org/wikipedia/commons/7/7a/Water_drop_icon.svg');
      let drops = [];
      let dropCount = 2600;
      for(let i=0;i<dropCount;i++){
        let mat = new THREE.SpriteMaterial({ map: dropTexture, color:0x77befe, opacity:0.31+Math.random()*0.29, transparent:true, depthWrite:false});
        let sp = new THREE.Sprite(mat);
        sp.position.set((Math.random()-0.5)*2800, Math.random()*1800, (Math.random()-0.5)*1200);
        let s = 19+Math.random()*24;
        sp.scale.set(s, s*2.1, 1);
        scene.add(sp);
        drops.push(sp);
      }
      function anim(){
        for(let d of drops){
          d.position.y -= 24+Math.random()*11;
          if(d.position.y<-400) d.position.y=1800+Math.random()*250;
        }
        for(let c of clouds) {
          c.angle += c.speed;
          c.sprite.position.x = Math.cos(c.angle)*c.dist;
          c.sprite.position.z = Math.sin(c.angle)*c.dist-700;
        }
        renderer.render(scene,camera);
        requestAnimationFrame(anim);
      }
      anim();
    }
    // --- KARLI: Gerçekçi dönen büyük taneler, yumuşaklık, atmosfer ---
    else if ([71,73,75,77,85,86].includes(code)) {
      let snowTexture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/pmndrs/drei-assets/main/sparks/spark1.png');
      let snows=[];
      let snowCount=2000;
      for(let i=0;i<snowCount;i++){
        let mat = new THREE.SpriteMaterial({ map: snowTexture, color:0xffffff, opacity:0.44+Math.random()*0.41, transparent:true, depthWrite:false });
        let sp = new THREE.Sprite(mat);
        sp.position.set((Math.random()-0.5)*3400, Math.random()*2200, (Math.random()-0.5)*2300);
        let s = 44+Math.random()*52;
        sp.scale.set(s, s, 1);
        scene.add(sp);
        snows.push(sp);
      }
      // Hafif mavi pus
      let fogGeo = new THREE.PlaneGeometry(4300, 2600, 1, 1);
      let fogMat = new THREE.MeshBasicMaterial({color:0xbed8ea, opacity:0.12, transparent:true, depthWrite:false});
      let fog = new THREE.Mesh(fogGeo, fogMat);
      fog.position.set(0, -120, -400);
      fog.rotation.x = -Math.PI/2.2;
      scene.add(fog);

      function anim(){
        for(let s of snows){
          s.position.y -= 5+Math.random()*3.5;
          s.position.x += Math.sin(Date.now()/900+s.position.y)*0.44;
          s.material.rotation += 0.01*Math.random();
          if(s.position.y<-600) s.position.y=2200+Math.random()*340;
        }
        fog.material.opacity = 0.12 + 0.02*Math.sin(Date.now()/2100);
        renderer.render(scene,camera);
        requestAnimationFrame(anim);
      }
      anim();
    }
    // --- FIRTINA: Yoğun bulut, yağmur, şimşek efekti ---
    else if ([95,96,99].includes(code)) {
      let cloudTexture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/cloud.png');
      let clouds = [];
      for(let i=0;i<28;i++){
        let mat = new THREE.SpriteMaterial({ map: cloudTexture, color:0x9eb7ce, opacity:0.65+Math.random()*0.22, transparent: true, depthWrite: false });
        let sp = new THREE.Sprite(mat);
        let angle = Math.random()*Math.PI*2;
        let dist = 1100*(0.7+0.5*Math.random());
        sp.position.set(Math.cos(angle)*dist, 380+Math.random()*440, Math.sin(angle)*dist-700);
        let s = 560*(0.7+Math.random()*1.3);
        sp.scale.set(s, s, 1);
        scene.add(sp);
        clouds.push({sprite: sp, angle, dist, speed: 0.00015*(0.7+Math.random()*0.5)});
      }
      // Yağmur damlaları (daha fazla ve daha kalın)
      let dropTexture = new THREE.TextureLoader().load('https://upload.wikimedia.org/wikipedia/commons/7/7a/Water_drop_icon.svg');
      let drops = [];
      let dropCount = 3200;
      for(let i=0;i<dropCount;i++){
        let mat = new THREE.SpriteMaterial({ map: dropTexture, color:0x6ba2ea, opacity:0.39+Math.random()*0.32, transparent:true, depthWrite:false});
        let sp = new THREE.Sprite(mat);
        sp.position.set((Math.random()-0.5)*3200, Math.random()*1800, (Math.random()-0.5)*1500);
        let s = 16+Math.random()*34;
        sp.scale.set(s, s*2.1, 1);
        scene.add(sp);
        drops.push(sp);
      }
      // Şimşek
      let flash = new THREE.PointLight(0xffffee,0,3500);
      flash.position.set(0, 1200, 0);
      scene.add(flash);

      function anim(){
        for(let d of drops){
          d.position.y -= 30+Math.random()*13;
          if(d.position.y<-600) d.position.y=1800+Math.random()*300;
        }
        for(let c of clouds) {
          c.angle += c.speed;
          c.sprite.position.x = Math.cos(c.angle)*c.dist;
          c.sprite.position.z = Math.sin(c.angle)*c.dist-700;
        }
        // Şimşek efekti
        if(Math.random()<0.014) flash.intensity = 35+Math.random()*30;
        else flash.intensity = Math.max(0, flash.intensity-2.7);
        renderer.render(scene,camera);
        requestAnimationFrame(anim);
      }
      anim();
    }
    // --- DİĞER: Yumuşak bulutlu/puslu ---
    else {
      let cloudTexture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/cloud.png');
      let clouds = [];
      for(let i=0;i<30;i++){
        let mat = new THREE.SpriteMaterial({ map: cloudTexture, color:0xdbe6f7, opacity:0.22+Math.random()*0.22, transparent: true, depthWrite: false });
        let sp = new THREE.Sprite(mat);
        let angle = Math.random()*Math.PI*2;
        let dist = 830*(0.7+0.7*Math.random());
        sp.position.set(Math.cos(angle)*dist, (Math.random()-0.5)*400, Math.sin(angle)*dist-600);
        let s = 300*(0.8+Math.random()*1.5);
        sp.scale.set(s, s, 1);
        scene.add(sp);
        clouds.push({sprite: sp, angle, dist, speed: 0.0001*(0.7+Math.random()*0.5)});
      }
      function anim(){
        for(let c of clouds) {
          c.angle += c.speed;
          c.sprite.position.x = Math.cos(c.angle)*c.dist;
          c.sprite.position.z = Math.sin(c.angle)*c.dist-600;
        }
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
