(function(){
  var body=document.body, hdr=document.getElementById('hdr'), track=document.getElementById('topo'),
      copy=document.getElementById('copy'), wrap=document.querySelector('.hero .wrap'), scale=document.getElementById('scale'),
      still=matchMedia('(prefers-reduced-motion: reduce)').matches;

  body.classList.add('play');

  /* Header turns solid once the hero has scrolled past */
  function onScroll(){ hdr.classList.toggle('solid', track.getBoundingClientRect().bottom < 90); }
  addEventListener('scroll',onScroll,{passive:true}); onScroll();

  /* Contact form: demo only, nothing is sent yet */
  document.getElementById('form').addEventListener('submit',function(e){
    e.preventDefault();
    var f=e.target, s=document.getElementById('sent');
    if(!f.nome.value.trim()||!f.email.value.trim()||!document.getElementById('ok').checked){
      s.textContent='Preencha nome, e-mail e aceite a Política de Privacidade para continuar.';
    } else {
      s.textContent='Obrigado. Esta é uma versão de demonstração: o envio será conectado na versão final.';
      f.reset();
    }
    s.classList.add('show');
  });

  /* Sobre reveal, once */
  var rv=document.querySelectorAll('.sobre .rv, .sobre .rv-rule');
  if(still||!('IntersectionObserver' in window)){ rv.forEach(function(el){el.classList.add('in');}); }
  else{
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.2,rootMargin:'0px 0px -60px 0px'});
    rv.forEach(function(el){io.observe(el);});
  }

  if(still) return;
  var hero=document.getElementById('hero'), cv=document.getElementById('dust'),
      fine=matchMedia('(pointer: fine)').matches, ptr={x:0,y:0,tx:0,ty:0}, dust=[], last=0;
  if(fine){
    hero.addEventListener('pointermove',function(e){ptr.tx=e.clientX/innerWidth*2-1; ptr.ty=e.clientY/innerHeight*2-1;});
    hero.addEventListener('pointerleave',function(){ptr.tx=0;ptr.ty=0;});
  }
  for(var i=0;i<48;i++) dust.push({x:Math.random(),y:Math.random(),z:.25+Math.random()*.75,r:.5+Math.random()*1.5,v:.4+Math.random(),ph:Math.random()*6.283});
  function drawDust(t,dt){
    var w=cv.clientWidth,h=cv.clientHeight; if(!w||!h) return;
    var dpr=Math.min(2,devicePixelRatio||1),pw=Math.round(w*dpr),ph=Math.round(h*dpr);
    if(cv.width!==pw||cv.height!==ph){cv.width=pw;cv.height=ph;}
    var c=cv.getContext('2d'); c.clearRect(0,0,pw,ph); c.fillStyle='#e2c88a';
    for(var i=0;i<dust.length;i++){var d=dust[i];
      d.y-=d.v*d.z*dt*.000022; if(d.y<-.03){d.y=1.03;d.x=Math.random();}
      var x=(d.x+Math.sin(t*.00022+d.ph)*.012)*w-ptr.x*28*d.z, y=d.y*h-ptr.y*18*d.z;
      c.globalAlpha=(.35+.65*(.5+.5*Math.sin(t*.0011+d.ph*3)))*.55*d.z;
      c.beginPath(); c.arc(x*dpr,y*dpr,d.r*d.z*dpr,0,6.283); c.fill();}
    c.globalAlpha=1;
  }
  function pin(){return innerWidth<=900?200:360;}
  function frame(t){
    var dt=last?Math.min(64,t-last):16; last=t;
    var p=Math.min(Math.max(-track.getBoundingClientRect().top/pin(),0),1);
    ptr.x+=(ptr.tx-ptr.x)*.07; ptr.y+=(ptr.ty-ptr.y)*.07;
    if(track.getBoundingClientRect().bottom>0){
      hero.style.setProperty('--tx',(-ptr.y*2.5).toFixed(3));
      hero.style.setProperty('--ty',(ptr.x*3.5).toFixed(3));
      hero.style.setProperty('--py',ptr.x.toFixed(4));
      hero.style.setProperty('--px2',ptr.y.toFixed(4));
      drawDust(t,dt);
    }
    scale.style.setProperty('--ry',(-28+56*p)+'deg');
    scale.style.setProperty('--tilt',(-8+16*p+Math.sin(t/1300)*2.2)+'deg');
    /* Emblem and text rise together as one block, so they never overlap; only the text fades */
    wrap.style.transform='translate3d(0,'+(-40*p)+'px,0)';
    copy.style.opacity=1-p*.85;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
