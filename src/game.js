function mountBasketball(root, project, B = Basketball, options = {}) {
  const p=B.clone(project),e=B.escape,words=B.words[p.language]||B.words.ru,t=i=>words[i];
  let state='title',index=0,score=0,lives=p.scoring.lives,streak=0,correctCount=0,seconds=p.scoring.seconds,locked=false,destroyed=false;
  let queue=[],chosen=[],ordered=[],tick=null,animation=null,advanceTimer=null,music=null,audioContext=null,masterGain=null,activeSounds=new Map(),decodedSounds=new Map(),activeAnimations=[];
  const mathText=(el,text)=>{el.innerHTML=BasketballMath.rich(text);return el};
  const reduced=p.accessibility.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shuffled=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  const asset=id=>p.assets[id]?.data||'';
  const make=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls||'';if(text!==undefined)el.textContent=text;return el};
  root.innerHTML='';root.classList.add('game-host');root.dir=p.language==='ar'?'rtl':'ltr';root.lang=p.language;
  const viewport=make('div','game-viewport'),scene=make('div','game-scene');viewport.append(scene);root.append(viewport);
  scene.style.setProperty('--question-bg',p.questionStyle.background);scene.style.setProperty('--question-color',p.questionStyle.color);scene.style.setProperty('--accent',p.questionStyle.accent);scene.style.setProperty('--q-radius',p.questionStyle.radius+'px');scene.style.setProperty('--q-font',(p.questionStyle.fontSize*p.accessibility.textScale)+'px');scene.style.fontFamily=p.questionStyle.fontFamily;
  if(p.accessibility.contrast)scene.classList.add('high-contrast');
  function fit(){const width=viewport.clientWidth;scene.style.transform=`scale(${width/1200})`;viewport.style.height=width*675/1200+'px'}
  const observer=new ResizeObserver(fit);observer.observe(viewport);fit();
  const img=(id,cls='')=>{const image=make('img',cls);image.src=asset(id);image.alt='';image.draggable=false;image.onerror=()=>image.remove();return image};
  function background(which){scene.style.backgroundColor=which?.color||p.scene.color;scene.style.backgroundImage=asset(which?.background)?`url("${asset(which.background)}")`:''}
  function button(label,action,cls=''){const b=make('button','game-button '+cls,label);b.type='button';b.onclick=()=>{ensureAudio();action()};return b}
  function ensureAudio(){
    if(!p.audio.effects||options.editor||destroyed)return null;
    try{if(!audioContext){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return null;audioContext=new Context();masterGain=audioContext.createGain();masterGain.gain.value=p.audio.volume/100;masterGain.connect(audioContext.destination)}audioContext.resume().catch(()=>{});return audioContext}catch{return null}
  }
  function playSound(event){
    if(!p.audio.effects||options.editor||destroyed||!p.audio.volume)return;
    const context=ensureAudio(),id=p.audio.assets[event],url=id&&asset(id);
    if(url){
      if(context){if(!decodedSounds.has(id)){const bytes=Uint8Array.from(atob(url.split(',')[1]),c=>c.charCodeAt(0));decodedSounds.set(id,context.decodeAudioData(bytes.buffer).catch(()=>null))}decodedSounds.get(id).then(buffer=>{if(destroyed||!buffer)return;try{activeSounds.get(event)?.stop?.()}catch{}const sound=context.createBufferSource();sound.buffer=buffer;sound.connect(masterGain);activeSounds.set(event,sound);sound.start()});return}
      activeSounds.get(event)?.pause?.();const sound=new Audio(url);sound.volume=p.audio.volume/100;activeSounds.set(event,sound);sound.play().catch(()=>{});return;
    }
    if(!context)return;
    const start=context.currentTime;
    const tone=(frequency,offset,duration,type='sine',volume=.16,endFrequency=frequency)=>{const osc=context.createOscillator(),gain=context.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,start+offset);osc.frequency.exponentialRampToValueAtTime(Math.max(20,endFrequency),start+offset+duration);gain.gain.setValueAtTime(.001,start+offset);gain.gain.exponentialRampToValueAtTime(volume,start+offset+.015);gain.gain.exponentialRampToValueAtTime(.001,start+offset+duration);osc.connect(gain);gain.connect(masterGain);osc.start(start+offset);osc.stop(start+offset+duration)};
    const noise=(duration,frequency,volume)=>{const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*duration),context.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2);const sound=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();sound.buffer=buffer;filter.type='bandpass';filter.frequency.value=frequency;gain.gain.value=volume;sound.connect(filter);filter.connect(gain);gain.connect(masterGain);sound.start(start)};
    if(event==='correct'){tone(523,0,.2,'sine');tone(659,.09,.24,'sine');tone(784,.18,.32,'sine')}
    else if(event==='wrong'){tone(220,0,.28,'triangle',.13,120);tone(164,.08,.28,'triangle',.1,80)}
    else if(event==='throw'){noise(.22,1200,.09)}
    else if(event==='swish'){noise(.42,5200,.45);tone(880,.12,.13,'sine',.07)}
    else if(event==='miss'||event==='impact'){tone(150,0,.16,'sine',.45,45);noise(.14,650,.28)}
    else if(event==='bonus'||event==='win'){[523,659,784,1047].forEach((note,i)=>tone(note,i*.09,.28,'sine',.14))}
    else if(event==='lose'){[330,261,196].forEach((note,i)=>tone(note,i*.12,.26,'triangle',.12))}
    else if(event==='life')tone(130,0,.17,'sine',.07,65);
    else if(event==='question')tone(440,0,.08,'sine',.04);
  }
  function glow(style){const hex=/^#[0-9a-f]{6}$/i.test(style.glowColor)?style.glowColor:'#35d7d0';const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(',');return `0 0 ${style.glowSize||0}px rgba(${rgb},${style.glowStrength??.35})`}
  function styleButton(el,style){if(!style)return el;Object.assign(el.style,{background:style.color,color:style.textColor,fontSize:style.fontSize+'px',width:style.width+'px',minHeight:style.height+'px',borderRadius:style.radius+'px',boxShadow:glow(style)});return el}
  function startMusic(){if(p.audio.music&&asset(p.audio.assets.music)){music?.pause();music=new Audio(asset(p.audio.assets.music));music.loop=true;music.volume=p.audio.volume/100;music.play().catch(()=>{})}}
  function clearTimers(){clearInterval(tick);tick=null;clearTimeout(advanceTimer);advanceTimer=null;if(animation){cancelAnimationFrame(animation);animation=null}activeAnimations.forEach(a=>a.cancel());activeAnimations=[]}
  function title(){state='title';scene.innerHTML='';background(p.titleScreen);const wrap=make('section','game-cover');wrap.style.color=p.titleScreen.textColor;wrap.style.fontFamily=p.titleScreen.fontFamily;wrap.append(make('div','cover-ball','🏀'),make('h1','',p.titleScreen.title||p.meta.name),make('p','cover-subtitle',p.titleScreen.subtitle),make('p','cover-rules',p.titleScreen.rules),styleButton(button(p.titleScreen.button||t(0),start),p.titleScreen.buttonStyle));wrap.querySelector('h1').style.fontSize=p.titleScreen.titleSize+'px';wrap.querySelector('.cover-subtitle').style.fontSize=p.titleScreen.subtitleSize+'px';scene.append(wrap)}
  function start(){clearTimers();index=score=streak=correctCount=0;lives=p.scoring.lives;seconds=p.scoring.seconds;locked=false;queue=p.scoring.random?shuffled(p.questions):[...p.questions];state='playing';startMusic();court();nextQuestion();if(p.scoring.timer)tick=setInterval(()=>{if(state!=='playing'||locked)return;seconds--;updateHud();if(seconds<=0)timeout()},1000)}
  let objectEls={},hudEl,questionEl,feedback;
  const unlockAudio=()=>{ensureAudio();if(state==='playing'&&p.audio.music){if(!music)startMusic();else music.play().catch(()=>{})}};root.addEventListener('pointerdown',unlockAudio);root.addEventListener('keydown',unlockAudio);
  function court(){scene.innerHTML='';background(p.scene);objectEls={};
    const floor=make('div','court-floor');floor.style.backgroundColor=p.scene.floor;floor.style.opacity=p.scene.floorOpacity;if(p.scene.lines)floor.classList.add('court-lines');scene.append(floor,make('div','arena-lights'));
    const shade=make('div','scene-shade');shade.style.opacity=p.scene.dimming;scene.append(shade);
    for(const o of [...p.scene.objects].sort((a,b)=>a.z-b.z)){if(o.hidden)continue;const el=make('div','scene-object object-'+o.kind);el.dataset.object=o.id;Object.assign(el.style,{left:o.x+'px',top:o.y+'px',width:o.w+'px',height:o.h+'px',zIndex:o.z,opacity:o.opacity,transform:`rotate(${o.rotation}deg) scaleX(${o.flip?-1:1})`});
      if(o.kind==='hud'){hudEl=el;el.classList.add('game-hud')}else if(o.asset||o.kind==='player'&&p.player.idle){el.append(img(o.asset||p.player.idle));el.setAttribute('aria-label',o.name)}else el.innerHTML=basketballArt(o.art||o.kind,e(o.name));objectEls[o.id]=el;scene.append(el)}
    if(p.scoring.timer){const controls=make('div','game-controls');controls.append(button(t(15),()=>{seconds+=30;updateHud()},'subtle'));scene.append(controls);}
    questionEl=make('section','question-panel');questionEl.setAttribute('aria-label',t(12));Object.assign(questionEl.style,{left:p.questionStyle.x+'px',top:p.questionStyle.y+'px',width:p.questionStyle.width+'px',borderWidth:p.questionStyle.border+'px',borderColor:p.questionStyle.borderColor,boxShadow:p.questionStyle.shadow?glow(p.questionStyle)+', 0 18px 50px #001b3250':'none'});scene.append(questionEl);
    feedback=make('div','game-feedback');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');scene.append(feedback);updateHud();
  }
  function updateHud(){if(!hudEl)return;hudEl.innerHTML='';const heart=make('span','hud-pill');if(asset(p.scoring.lifeAsset)){heart.append(img(p.scoring.lifeAsset));heart.append(document.createTextNode(' × '+lives))}else heart.textContent=(p.scoring.lifeIcon||'♥')+' '+lives;const timer=make('span','hud-pill','◷ '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'));const stats=make('span','hud-pill',`★ ${score} · ${Math.min(index+(locked?1:0),queue.length)}/${queue.length} · ${t(19)} ${streak}`);hudEl.append(heart);if(p.scoring.timer)hudEl.append(timer);hudEl.append(stats)}
  function nextQuestion(){if(destroyed)return;if(lives<=0)return finish(false);if(index>=queue.length)return finish(true);if(p.scoring.timerMode==='question')seconds=p.scoring.seconds;locked=false;chosen=[];feedback.textContent='';questionEl.hidden=false;const q=queue[index];ordered=q.type==='order'?shuffled(q.options):[];renderQuestion();updateHud();playSound('question')}
  function renderQuestion(){
    const q=queue[index];questionEl.innerHTML='';questionEl.append(make('div','question-number',`${t(12)} ${index+1} / ${queue.length}`),mathText(make('h2','question-title'),q.prompt));if(asset(q.asset))questionEl.append(img(q.asset,'question-image'));
    // Genially can sandbox native form submission. Checking uses a normal button, never submit.
    const form=make('div','answer-form');form.setAttribute('role','group');
    const checkAnswer=()=>{ensureAudio();if(locked||state!=='playing')return;let answer;
      if(q.type==='text'){answer=form.querySelector('input').value;if(!answer.trim()){feedback.textContent=t(13);form.querySelector('input').focus();return}}
      else if(q.type==='single')answer=form.querySelector('input:checked')?.value;
      else if(q.type==='multiple')answer=[...form.querySelectorAll('input:checked')].map(el=>el.value);
      else if(q.type==='order')answer=ordered.map(o=>o.id);
      if((q.type==='single'&&!answer)||(q.type==='multiple'&&!answer.length)){feedback.textContent=t(16);return}
      submit(B.check(q,answer));
    };
    form.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.tagName==='INPUT'&&q.type==='text'){event.preventDefault();checkAnswer()}});
    if(['single','multiple'].includes(q.type)){const opts=q.shuffle?shuffled(q.options):q.options;for(const o of opts){const label=make('label','answer-option');const input=make('input');input.type=q.type==='single'?'radio':'checkbox';input.name='answer';input.value=o.id;input.onchange=()=>{chosen=q.type==='single'?[o.id]:[...form.querySelectorAll('input:checked')].map(el=>el.value)};label.append(input,mathText(make('span',''),o.text));if(asset(o.asset))label.append(img(o.asset,'option-image'));form.append(label)}}
    if(q.type==='text'){const input=make('input','text-answer');input.type='text';input.placeholder=t(13);input.setAttribute('aria-label',t(13));input.autocomplete='off';input.required=true;form.append(input)}
    if(q.type==='order'){form.append(make('p','order-hint',t(17)));const list=make('div','order-list');form.append(list);let dragId='';const draw=()=>{list.innerHTML='';ordered.forEach((o,i)=>{const row=make('div','order-row');row.draggable=true;row.ondragstart=ev=>{dragId=o.id;ev.dataTransfer.setData('text/plain',o.id)};row.ondragover=ev=>ev.preventDefault();row.ondrop=ev=>{ev.preventDefault();const from=ordered.findIndex(x=>x.id===dragId);if(from<0)return;const [item]=ordered.splice(from,1);ordered.splice(i,0,item);draw()};row.append(mathText(make('span',''),`${i+1}. ${o.text}`));for(const d of [-1,1]){const b=button(d<0?'↑':'↓',()=>{const j=i+d;if(j<0||j>=ordered.length)return;[ordered[i],ordered[j]]=[ordered[j],ordered[i]];draw();list.children[j].querySelector('button').focus()},'order-move');b.setAttribute('aria-label',`${o.text} ${d<0?'↑':'↓'}`);b.disabled=i+d<0||i+d>=ordered.length;row.append(b)}list.append(row)})};draw()}
    if(q.type==='oral'){if(q.oralMode==='continue')form.append(button(t(5),()=>submit(true)));else form.append(button(t(3),()=>submit(true)),button(t(4),()=>submit(false),'secondary'))}
    else form.append(styleButton(button(p.questionStyle.checkLabel||t(1),checkAnswer),p.questionStyle.buttonStyle));questionEl.append(form);requestAnimationFrame(()=>{if(!options.editor)questionEl.querySelector('input,button')?.focus()})
  }
  function timeout(){playSound('wrong');feedback.textContent=t(14);if(p.scoring.timeout==='extend'){seconds=30;updateHud();return}if(p.scoring.timeout==='end'){lives=0;finish(false);return}if(p.scoring.timerMode==='total')seconds=p.scoring.seconds;submit(false)}
  function submit(good){
    if(locked||state!=='playing')return;locked=true;questionEl.querySelectorAll('button,input').forEach(el=>el.disabled=true);questionEl.hidden=true;
    const q=queue[index];if(good){correctCount++;streak++;score+=q.points;if(p.scoring.bonusEvery>0&&streak%p.scoring.bonusEvery===0){score+=p.scoring.bonusPoints;playSound('bonus')}}else{lives--;streak=0;playSound('life')}
    playSound(good?'correct':'wrong');feedback.textContent=good?t(3):t(4);feedback.classList.toggle('incorrect',!good);updateHud();throwBall(good,()=>{if(destroyed)return;mathText(feedback,(good?t(3):t(4))+(q.explanation?' — '+q.explanation:''));const continueButton=styleButton(button(p.questionStyle.nextLabel||t(2),()=>{index++;nextQuestion()}),p.questionStyle.buttonStyle);feedback.append(continueButton);continueButton.focus()});
  }
  function throwBall(good,done){
    playSound('throw');const ball=objectEls.ball,hero=objectEls.player,hoop=objectEls.hoop;const b=p.scene.objects.find(o=>o.id==='ball'),h=p.scene.objects.find(o=>o.id==='hoop');if(!ball||!b||!h){done();return}
    const custom=good?p.player.success:p.player.miss;if(hero&&asset(custom)){hero.innerHTML='';hero.append(img(custom))}
    if(hero?.animate&&!reduced){const a=hero.animate([{translate:'0 0'},{translate:'0 -45px',offset:.45},{translate:'0 0'}],{duration:800/p.ball.speed,easing:'ease-in-out'});activeAnimations.push(a)}
    const target={x:h.x+h.w*p.hoop.targetX-b.w/2,y:h.y+h.h*p.hoop.targetY-b.h/2};if(!good){target.x+=(index%2===0?-110:140);target.y+=95}
    const duration=reduced?180:Math.max(350,1100/p.ball.speed);let elapsed=0,last=null;
    const step=now=>{if(destroyed)return;if(last!==null)elapsed+=now-last;last=now;const progress=Math.min(1,elapsed/duration);const x=b.x+(target.x-b.x)*progress,y=b.y+(target.y-b.y)*progress-(reduced?0:4*p.ball.arc*progress*(1-progress));ball.style.left=x+'px';ball.style.top=y+'px';ball.style.rotate=(progress*480)+'deg';if(progress<1){animation=requestAnimationFrame(step);return}animation=null;playSound(good?'swish':'impact');if(ball.animate&&!reduced)activeAnimations.push(ball.animate([{left:target.x+'px',top:target.y+'px'},{left:(target.x+(good?0:-35))+'px',top:(target.y+(good?60:125))+'px',offset:.7},{left:(target.x+(good?0:-48))+'px',top:(target.y+(good?85:85))+'px'}],{duration:350,easing:'ease-out'}));if(good&&hoop?.animate&&!reduced)activeAnimations.push(hoop.animate([{scale:'1'},{scale:'1.03'},{scale:'1'}],{duration:250}));ball.style.left=b.x+'px';ball.style.top=b.y+'px';ball.style.rotate='0deg';if(hero){hero.innerHTML='';if(asset(p.player.idle)||asset(p.scene.objects.find(o=>o.id==='player')?.asset))hero.append(img(p.player.idle||p.scene.objects.find(o=>o.id==='player').asset));else hero.innerHTML=basketballArt('player',e(p.player.name))}done()};animation=requestAnimationFrame(step)
  }
  function finish(win){clearTimers();state='finished';locked=false;music?.pause();playSound(win?'win':'lose');scene.innerHTML='';const screen=win?p.winScreen:p.loseScreen;background(screen);const cover=make('section','game-cover');cover.style.color=screen.textColor||'#ffffff';cover.append(make('div','cover-ball',win?'🏆':'🏀'),make('h1','',screen.title||t(win?9:10)),make('p','cover-subtitle',screen.subtitle),make('p','cover-rules',`${t(11)}: ${score} · ${t(18)}: ${Math.min(index,queue.length)}/${queue.length} · ✓ ${correctCount} · ${p.scoring.lifeIcon} ${lives}`),styleButton(button(screen.button||t(8),start),screen.buttonStyle));scene.append(cover)}
  if(options.screen==='win'||options.screen==='lose'){queue=p.questions;finish(options.screen==='win')}else if(options.screen==='court'){queue=p.questions;court();questionEl.hidden=true}else if(options.screen==='title'||p.titleScreen.enabled)title();else start();
  return {destroy(){destroyed=true;clearTimers();observer.disconnect();music?.pause();activeSounds.forEach(a=>{a.pause?.();try{a.stop?.()}catch{}});audioContext?.close().catch(()=>{});root.removeEventListener('pointerdown',unlockAudio);root.removeEventListener('keydown',unlockAudio);root.innerHTML=''},start};
}
function basketballArt(kind,label='') {
  if(kind==='ball')return '<svg viewBox="0 0 100 100" aria-label="'+label+'"><circle cx="50" cy="50" r="46" fill="#ed8b30" stroke="#402e21" stroke-width="4"/><path d="M4 50h92M50 4v92M16 17Q85 46 17 84M84 17Q15 46 84 84" fill="none" stroke="#593922" stroke-width="3"/></svg>';
  if(kind==='hoop')return '<svg viewBox="0 0 180 320" aria-label="'+label+'"><path d="M115 94v214h35V90" fill="#a9bdc8" stroke="#1e3543" stroke-width="6"/><rect x="8" y="8" width="154" height="105" rx="7" fill="#e5f2f3" fill-opacity=".92" stroke="#fff" stroke-width="8"/><rect x="38" y="43" width="62" height="48" fill="none" stroke="#d7553c" stroke-width="5"/><path d="M37 119l15 56h35l15-56M42 128l48 36M48 151l48-24M64 120v54M83 120v54" fill="none" stroke="#f9fbec" stroke-width="3"/><ellipse cx="68" cy="116" rx="40" ry="9" fill="none" stroke="#f97440" stroke-width="7"/></svg>';
  if(kind==='player')return '<svg viewBox="0 0 155 290" aria-label="'+label+'"><ellipse cx="77" cy="275" rx="55" ry="10" fill="#000" opacity=".15"/><path d="M57 179l-12 61-25 20M93 179l22 58 24 14" fill="none" stroke="#b87248" stroke-width="23" stroke-linecap="round"/><path d="M40 246l-24 20h33M123 244l19 15h-28" fill="none" stroke="#fff3cf" stroke-width="14" stroke-linecap="round"/><path d="M43 97l-17 48M108 98l17-43" stroke="#bd8057" stroke-width="19" stroke-linecap="round"/><path d="M47 91h60l4 94H41z" fill="#ecad48"/><path d="M42 173h69l7 29H79l-5-20-4 20H36z" fill="#267c81"/><text x="77" y="151" font-size="36" font-family="Arial" font-weight="bold" text-anchor="middle" fill="#173e46">7</text><rect x="64" y="68" width="26" height="31" rx="10" fill="#bd8057"/><ellipse cx="78" cy="48" rx="32" ry="37" fill="#cd926b"/><path d="M46 49Q27-2 74 4q52-9 38 55l-17-32-46 10" fill="#392e2a"/><path d="M62 50h4M87 50h4M69 67q10 7 20-2" fill="none" stroke="#392e2a" stroke-width="4" stroke-linecap="round"/></svg>';
  return '<div class="decor-star" aria-label="'+label+'">★</div>';
}
