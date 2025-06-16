// weather-background.js
// Tüm sayfalarda otomatik hava durumuna göre ultra yüksek çözünürlüklü WebGL animasyon
(async function() {
  // Kullanıcıdan konum al
  function getCoords() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject('Konum desteği yok.');
      navigator.geolocation.getCurrentPosition(
        pos => resolve([pos.coords.latitude, pos.coords.longitude]),
        () => resolve([48.8566, 2.3522]) // fallback Paris
      );
    });
  }
  // Hava durumu kodunu al (Open-Meteo)
  async function getWeatherCode(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
    const res = await fetch(url);
    const data = await res.json();
    return data.current_weather ? data.current_weather.weathercode : 0;
  }
  // WebGL animasyonu başlat
  function animateWeather(code) {
    const canvas = document.getElementById('weather-bg');
    const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, preserveDrawingBuffer:true});
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 2000);
    camera.position.z = 420;

    function resizeRenderer() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(window.devicePixelRatio);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resizeRenderer);
    resizeRenderer();

    // Animasyonlar
    // Güneşli
    if(code===0) {
      let geometry = new THREE.BufferGeometry();
      let count = 1800; // extra yoğun partikül
      let positions = new Float32Array(count*3), colors = new Float32Array(count*3);
      for(let i=0;i<count;i++){
        positions[i*3]=(Math.random()-0.5)*1800;
        positions[i*3+1]=(Math.random()-0.5)*1000;
        positions[i*3+2]=(Math.random()-0.5)*1800;
        colors[i*3]=1;
        colors[i*3+1]=0.95+Math.random()*0.04;
        colors[i*3+2]=0.32+Math.random()*0.12;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions,3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors,3));
      let mat = new THREE.PointsMaterial({vertexColors:true, size:10, opacity:0.43, transparent:true});
      let pts = new THREE.Points(geometry,mat);
      scene.add(pts);
      let sun = new THREE.PointLight(0xffe066,3,2000);
      sun.position.set(0,200,300);
      scene.add(sun);
      function anim(){
        sun.intensity = 3+Math.sin(Date.now()/900)*0.6;
        pts.rotation.y += 0.0014;
        pts.rotation.x += 0.0008;
        renderer.render(scene,camera);
        requestAnimationFrame(anim);
      }
      anim();
    }
    // Bulutlu
    else if([1,2,3,45,48].includes(code)) {
      let geometry = new THREE.BufferGeometry();
      let count = 2400;
      let positions = new Float32Array(count*3), colors = new Float32Array(count*3);
      for(let i=0;i<count;i++){
        positions[i*3]=(Math.random()-0.5)*2200;
        positions[i*3+1]=(Math.random()-0.5)*600;
        positions[i*3+2]=(Math.random()-0.5)*1700;
        let c=0.70+Math.random()*0.22;
        colors[i*3]=c; colors[i*3+1]=c; colors[i*3+2]=c;
      }
      geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
      geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
      let mat = new THREE.PointsMaterial({vertexColors:true, size:26, opacity:0.18, transparent:true});
      let pts = new THREE.Points(geometry,mat);
      scene.add(pts);
      function anim(){
        pts.rotation.y += 0.0007;
        pts.rotation.x += 0.00021;
        renderer.render(scene,camera);
        requestAnimationFrame(anim);
      }
      anim();
    }
    // Yağmurlu
    else if([51,53,55,61,63,65,80,81,82].includes(code)) {
      let drops=[];
      let dropCount=1200;
      for(let i=0;i<dropCount;i++){
        let geo = new THREE.SphereGeometry(1.4,8,8);
        let mat = new THREE.MeshBasicMaterial({color:0x6bb7ff,opacity:0.53,transparent:true});
        let mesh = new THREE.Mesh(geo,mat);
        mesh.position.set((Math.random()-0.5)*2400,Math.random()*1100, (Math.random()-0.5)*900);
        scene.add(mesh);
        drops.push(mesh);
      }
      function anim(){
        for(let d of drops){
          d.position.y -= 17+Math.random()*7;
          if(d.position.y<-260) d.position.y=1100+Math.random()*180;
        }
        renderer.render(scene,camera);
        requestAnimationFrame(anim);
      }
      anim();
    }
    // Karlı
    else if([71,73,75,77,85,86].includes(code)) {
      let snows=[];
      let snowCount=900;
      for(let i=0;i<snowCount;i++){
        let geo = new THREE.SphereGeometry(2.5,8,8);
        let mat = new THREE.MeshBasicMaterial({color:0xffffff,opacity:0.77,transparent:true});
        let mesh = new THREE.Mesh(geo,mat);
        mesh.position.set((Math.random()-0.5)*1700,Math.random()*1100, (Math.random()-0.5)*1100);
        scene.add(mesh);
        snows.push(mesh);
      }
      function anim(){
        for(let s of snows){
          s.position.y -= 4+Math.random()*2.7;
          s.position.x += Math.sin(Date.now()/700+s.position.y)*0.33;
          if(s.position.y<-280) s.position.y=1100+Math.random()*220;
        }
        renderer.render(scene,camera);
        requestAnimationFrame(anim);
      }
      anim();
    }
    // Fırtına
    else if([95,96,99].includes(code)) {
      let drops=[], flashes=0;
      let dropCount=900;
      for(let i=0;i<dropCount;i++){
        let geo = new THREE.SphereGeometry(1.7,8,8);
        let mat = new THREE.MeshBasicMaterial({color:0x2288ff,opacity:0.77,transparent:true});
        let mesh = new THREE.Mesh(geo,mat);
        mesh.position.set((Math.random()-0.5)*2200,Math.random()*1100, (Math.random()-0.5)*900);
        scene.add(mesh);
        drops.push(mesh);
      }
      let flash = new THREE.PointLight(0xffffdd,0,2500);
      scene.add(flash);
      function anim(){
        for(let d of drops){
          d.position.y -= 20+Math.random()*8;
          if(d.position.y<-260) d.position.y=1100+Math.random()*180;
        }
        if(Math.random()<0.009) flashes=1+Math.random()*2;
        if(flashes>0){ flash.intensity = 8*flashes; flashes -= 0.18; }
        else{ flash.intensity = 0; }
        renderer.render(scene,camera);
        requestAnimationFrame(anim);
      }
      anim();
    }
    // Default: bulutlu
    else {
      let geometry = new THREE.BufferGeometry();
      let count = 1000;
      let positions = new Float32Array(count*3), colors = new Float32Array(count*3);
      for(let i=0;i<count;i++){
        positions[i*3]=(Math.random()-0.5)*1200;
        positions[i*3+1]=(Math.random()-0.5)*250;
        positions[i*3+2]=(Math.random()-0.5)*700;
        let c=0.6+Math.random()*0.3;
        colors[i*3]=c; colors[i*3+1]=c; colors[i*3+2]=c;
      }
      geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
      geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
      let mat = new THREE.PointsMaterial({vertexColors:true, size:18, opacity:0.22, transparent:true});
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

  // Bütün işlemleri başlat
  const [lat, lon] = await getCoords();
  const code = await getWeatherCode(lat, lon);
  animateWeather(code);
})();
