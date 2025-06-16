// API INPI: Liste des entreprises électricité en France (exemple: mock via data.gouv ou INPI API, demo statique)
(async function(){
  const apiUrl = "https://opendata.inpi.fr/api/companies?activite=electricite&country=FR"; // örnek endpoint
  const listDiv = document.getElementById('electricite-list');
  const detailsDiv = document.getElementById('electricite-details');
  const searchInput = document.getElementById('electricite-search');
  if(!listDiv) return;

  // Demo verisi (çünkü INPI API public key gerektirir, burada örnek statik veri)
  let companies = [
    {nom:"EDF", siret:"552081317", siege:"22-30 Av. de Wagram, 75008 Paris", activite:"Production et distribution d'électricité", site:"https://www.edf.fr", date:"1946", capitale:"1 551 810 543 €"},
    {nom:"Engie", siret:"542107651", siege:"1 Place Samuel de Champlain, 92400 Courbevoie", activite:"Électricité, gaz, services", site:"https://www.engie.com", date:"2008", capitale:"2 435 285 011 €"},
    {nom:"Enedis", siret:"444608442", siege:"34 Pl. des Corolles, 92400 Courbevoie", activite:"Gestionnaire du réseau de distribution d'électricité", site:"https://www.enedis.fr", date:"2008", capitale:"2 706 000 000 €"},
    {nom:"TotalEnergies", siret:"542051180", siege:"2 Pl. Jean Millier, 92400 Courbevoie", activite:"Électricité, gaz, multi-énergies", site:"https://totalenergies.com", date:"1924", capitale:"6 524 000 000 €"},
    {nom:"Direct Energie", siret:"442395448", siege:"2 bis rue Louis Armand, 75015 Paris", activite:"Fournisseur d'électricité et de gaz", site:"https://www.totalenergies.fr", date:"2003", capitale:"5 000 000 €"},
    {nom:"ekWateur", siret:"810921255", siege:"79 rue du Faubourg Poissonnière, 75009 Paris", activite:"Fournisseur d'électricité verte", site:"https://ekwateur.fr", date:"2015", capitale:"1 718 429 €"},
    // ...gerçek API'den çekmek için fetch kullanabilirsin
  ];

  function renderList(filter="") {
    const filtered = filter
      ? companies.filter(c =>
          (c.nom+c.activite+c.siege).toLowerCase().includes(filter.toLowerCase())
        )
      : companies;
    if(filtered.length===0){
      listDiv.innerHTML = "<p style='color:#c00;font-weight:bold;'>Aucune entreprise trouvée.</p>";
      return;
    }
    listDiv.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:18px;">`+
      filtered.map(c=>`
        <div class="electricite-card" style="background:var(--box);border-radius:17px;box-shadow:0 2px 15px #0071e311;padding:22px 16px;cursor:pointer;transition:box-shadow .22s;">
          <div style="font-size:1.14em;font-weight:600;color:var(--primary);margin-bottom:9px;">${c.nom}</div>
          <div style="color:#777;font-size:0.97em;">${c.activite}</div>
          <div style="color:#888;margin:7px 0 0 0;font-size:0.93em;">${c.siege}</div>
          <div style="margin-top:9px;">
            <span style="background:#eaf3ff;padding:4px 13px;border-radius:8px;color:#2196f3;font-size:0.91em;margin-right:10px;">SIRET : ${c.siret}</span>
            <span style="background:#f7f8fa;padding:4px 10px;border-radius:8px;color:#333;font-size:0.91em;">Créée : ${c.date}</span>
          </div>
        </div>
      `).join("")+"</div>";
    // Kartlara tıklama (detay göster)
    document.querySelectorAll('.electricite-card').forEach((elem,idx)=>{
      elem.onclick = ()=>{
        renderDetails(filtered[idx]);
        detailsDiv.style.display='block';
        detailsDiv.scrollIntoView({behavior:'smooth',block:'center'});
      }
    });
  }
  function renderDetails(company){
    detailsDiv.innerHTML = `
      <div style="background:var(--box);box-shadow:0 4px 32px #0071e311;border-radius:19px;padding:36px 28px;">
        <button onclick="this.parentNode.parentNode.style.display='none'" style="float:right;background:transparent;color:#888;font-size:1.7em;border:0;cursor:pointer;">×</button>
        <h3 style="color:var(--primary);font-size:2em;margin-top:0;">${company.nom}</h3>
        <div style="margin-bottom:14px;"><strong>Activité :</strong> ${company.activite}</div>
        <div><strong>Adresse du siège :</strong> ${company.siege}</div>
        <div><strong>SIRET :</strong> ${company.siret}</div>
        <div><strong>Capital :</strong> ${company.capitale}</div>
        <div><strong>Date de création :</strong> ${company.date}</div>
        <div style="margin-top:14px;">
          <a href="${company.site}" target="_blank" style="color:var(--primary);text-decoration:underline;font-weight:500;">Site officiel</a>
        </div>
      </div>
    `;
  }
  // Arama
  searchInput.addEventListener('input',e=>{
    renderList(e.target.value);
    detailsDiv.style.display='none';
  });
  // İlk liste
  renderList();
})();
