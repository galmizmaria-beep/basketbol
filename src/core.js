/* Shared model. No dependencies, no network requests. */
const Basketball = (() => {
  const uid = () => 'id-' + Math.random().toString(36).slice(2, 11);
  const clone = value => JSON.parse(JSON.stringify(value));
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const types = {single:'Один вариант',multiple:'Множественный выбор',text:'Ввод ответа',oral:'Устный ответ',order:'Расставить по порядку'};
  const languages = {ru:'Русский',en:'English',de:'Deutsch',fr:'Français',es:'Español',it:'Italiano',pt:'Português',pl:'Polski',uk:'Українська',kk:'Қазақша',tr:'Türkçe',zh:'中文',ja:'日本語',ko:'한국어',ar:'العربية'};
  const words = {
    ru:['Играть','Проверить','Продолжить','Верно','Неверно','Ответ дан','Пауза','Продолжить игру','Ещё раз','Отличная игра!','Попробуем ещё раз','Очки','Задание','Ответ','Время вышло','+30 секунд','Выберите ответ','Расположите по порядку','Завершено','Серия','Закрыть'],
    en:['Play','Check','Continue','Correct','Incorrect','Answered','Pause','Resume','Play again','Great game!','Let’s try again','Score','Question','Answer','Time is up','+30 seconds','Choose an answer','Put in order','Completed','Streak','Close'],
    de:['Spielen','Prüfen','Weiter','Richtig','Falsch','Beantwortet','Pause','Fortsetzen','Noch einmal','Tolles Spiel!','Versuchen wir es erneut','Punkte','Aufgabe','Antwort','Zeit abgelaufen','+30 Sekunden','Antwort wählen','Reihenfolge ordnen','Abgeschlossen','Serie','Schließen'],
    fr:['Jouer','Vérifier','Continuer','Correct','Incorrect','Réponse donnée','Pause','Reprendre','Rejouer','Bien joué !','Essayons encore','Points','Question','Réponse','Temps écoulé','+30 secondes','Choisir une réponse','Mettre en ordre','Terminé','Série','Fermer'],
    es:['Jugar','Comprobar','Continuar','Correcto','Incorrecto','Respondido','Pausa','Reanudar','Otra vez','¡Buen juego!','Intentémoslo de nuevo','Puntos','Pregunta','Respuesta','Tiempo agotado','+30 segundos','Elige una respuesta','Ordena','Completado','Racha','Cerrar'],
    it:['Gioca','Verifica','Continua','Corretto','Errato','Risposto','Pausa','Riprendi','Rigioca','Ottima partita!','Riproviamo','Punti','Domanda','Risposta','Tempo scaduto','+30 secondi','Scegli una risposta','Metti in ordine','Completato','Serie','Chiudi'],
    pt:['Jogar','Verificar','Continuar','Correto','Incorreto','Respondido','Pausa','Retomar','Jogar novamente','Bom jogo!','Vamos tentar novamente','Pontos','Pergunta','Resposta','Tempo esgotado','+30 segundos','Escolha uma resposta','Coloque em ordem','Concluído','Sequência','Fechar'],
    pl:['Graj','Sprawdź','Dalej','Dobrze','Źle','Odpowiedziano','Pauza','Wznów','Jeszcze raz','Świetna gra!','Spróbujmy ponownie','Punkty','Pytanie','Odpowiedź','Czas minął','+30 sekund','Wybierz odpowiedź','Ułóż kolejność','Ukończono','Seria','Zamknij'],
    uk:['Грати','Перевірити','Продовжити','Правильно','Неправильно','Відповідь дана','Пауза','Продовжити гру','Ще раз','Чудова гра!','Спробуймо ще раз','Бали','Завдання','Відповідь','Час вийшов','+30 секунд','Оберіть відповідь','Розташуйте за порядком','Завершено','Серія','Закрити'],
    kk:['Ойнау','Тексеру','Жалғастыру','Дұрыс','Қате','Жауап берілді','Үзіліс','Ойынды жалғастыру','Қайта ойнау','Керемет ойын!','Қайта байқап көрейік','Ұпай','Тапсырма','Жауап','Уақыт бітті','+30 секунд','Жауапты таңдаңыз','Ретімен қойыңыз','Аяқталды','Серия','Жабу'],
    tr:['Oyna','Kontrol et','Devam','Doğru','Yanlış','Yanıtlandı','Duraklat','Sürdür','Tekrar oyna','Harika oyun!','Tekrar deneyelim','Puan','Soru','Yanıt','Süre doldu','+30 saniye','Yanıt seç','Sırala','Tamamlandı','Seri','Kapat'],
    zh:['开始','检查','继续','正确','错误','已回答','暂停','继续游戏','再玩一次','玩得很好！','再试一次','得分','问题','答案','时间到','+30秒','选择答案','排序','已完成','连续','关闭'],
    ja:['プレイ','確認','続ける','正解','不正解','回答済み','一時停止','再開','もう一度','よくできました！','もう一度挑戦','得点','問題','回答','時間切れ','+30秒','回答を選択','順番に並べる','完了','連続','閉じる'],
    ko:['시작','확인','계속','정답','오답','답변 완료','일시 정지','재개','다시 하기','잘했어요!','다시 해봐요','점수','문제','답변','시간 종료','+30초','답을 선택하세요','순서대로 정렬','완료','연속','닫기'],
    ar:['العب','تحقق','تابع','صحيح','غير صحيح','تمت الإجابة','إيقاف مؤقت','استئناف','العب مجددًا','لعبة رائعة!','لنحاول مجددًا','النقاط','السؤال','الإجابة','انتهى الوقت','+٣٠ ثانية','اختر الإجابة','رتب بالترتيب','مكتمل','سلسلة','إغلاق']
  };
  const object = (id,name,kind,x,y,w,h,z) => ({id,name,kind,x,y,w,h,z,rotation:0,opacity:1,locked:false,hidden:false,flip:false,asset:''});
  const question = (type='single') => ({id:uid(),type,prompt:'Новое задание',options:[{id:uid(),text:'Первый ответ',correct:true,asset:''},{id:uid(),text:'Второй ответ',correct:false,asset:''},{id:uid(),text:'Третий ответ',correct:false,asset:''}],answers:['ответ'],caseSensitive:false,tolerance:0,mathAnswers:true,shuffle:true,points:10,explanation:'',oralMode:'self',asset:''});
  const buttonStyle=()=>({color:'#f6b63f',textColor:'#122b3b',fontFamily:'Arial',fontSize:24,width:260,height:62,radius:18,glowColor:'#f6b63f',glowSize:25,glowStrength:0.35});
  const panelStyle=()=>({background:'#122b3e',color:'#ffffff',fontFamily:'Arial',fontSize:28,width:560,height:240,radius:24,glowColor:'#35d7d0',glowSize:30,glowStrength:.4});
  function defaults(){
    const q=question();q.prompt='Сколько игроков одной команды находится на баскетбольной площадке?';q.options.forEach((o,i)=>{o.text=['5','6','7'][i]});
    const q2=question('multiple');q2.prompt='Выберите чётные числа';q2.options.forEach((o,i)=>{o.text=['2','4','5'][i];o.correct=i<2});
    const q3=question('text');q3.prompt='Вычисли $\\frac{3}{4} + \\frac{1}{4}$';q3.answers=['1'];
    const generated=typeof BasketballAssets!=='undefined'?clone(BasketballAssets):{};
    const p={schemaVersion:1,meta:{name:'Баскетбол знаний',autosave:true,quality:'balanced'},language:'ru',audio:{volume:60,effects:true,music:false,assets:{}},scene:{color:'#0b1e36',floor:'#ca8956',floorOpacity:0,lines:false,dimming:0,background:'',objects:[object('player','Герой','player',85,285,210,325,2),object('hoop','Кольцо','hoop',940,170,230,420,3),object('ball','Мяч','ball',262,390,52,52,4),object('hud','Жизни и счёт','hud',32,24,1136,55,5)]},titleScreen:{enabled:true,title:'Баскетбол знаний',subtitle:'Каждый ответ — бросок к победе',rules:'Отвечай на задания, забрасывай мяч и береги жизни.',button:'Начать игру',buttonStyle:buttonStyle(),background:'',color:'#0c2037',textColor:'#ffffff',fontFamily:'Arial',titleSize:62,subtitleSize:27,backgroundOpacity:1},player:{name:'',idle:'',success:'',miss:''},hoop:{targetX:0.28,targetY:0.26},ball:{speed:1,arc:210},questions:[q,q2,q3],questionStyle:{width:520,x:350,y:160,background:'#122b3e',color:'#f2f7ff',accent:'#f6b63f',borderColor:'#45dbd3',glowColor:'#35d7d0',glowSize:28,glowStrength:0.35,checkLabel:'',nextLabel:'',radius:24,fontSize:24,fontFamily:'Arial',border:2,shadow:true,buttonStyle:buttonStyle()},resultScreen:{...panelStyle(),correctText:'',incorrectText:'',button:'',buttonStyle:buttonStyle()},hudStyle:{lives:{...panelStyle(),width:200,height:55,fontSize:26},timer:{...panelStyle(),width:190,height:55,fontSize:28},score:{...panelStyle(),width:350,height:55,fontSize:23}},timeoutScreen:{width:1000,height:520,radius:30,glowColor:'#35d7d0',glowSize:30,glowStrength:.35,title:'Время закончилось',subtitle:'Нажми кнопку, чтобы продолжить.',background:'',color:'#0c2037',textColor:'#ffffff',fontFamily:'Arial',titleSize:54,subtitleSize:27,backgroundOpacity:1,button:'Продолжить',buttonStyle:buttonStyle()},scoring:{lives:3,lifeIcon:'♥',lifeAsset:'',random:false,timer:false,timerMode:'question',seconds:60,timeout:'life',bonusEvery:3,bonusPoints:10},winScreen:{width:1000,height:520,radius:30,glowColor:'#35d7d0',glowSize:30,glowStrength:.35,title:'',fontFamily:'Arial',titleSize:54,subtitleSize:27,backgroundOpacity:1,subtitle:'Ты справился с заданиями. Так держать!',background:'',color:'#0c2037',textColor:'#ffffff',button:'Ещё раз',buttonStyle:buttonStyle()},loseScreen:{width:1000,height:520,radius:30,glowColor:'#35d7d0',glowSize:30,glowStrength:.35,title:'',fontFamily:'Arial',titleSize:54,subtitleSize:27,backgroundOpacity:1,subtitle:'Каждая попытка помогает учиться. Попробуй снова!',background:'',color:'#0c2037',textColor:'#ffffff',button:'Попробовать снова',buttonStyle:buttonStyle()},accessibility:{reducedMotion:false,contrast:false,textScale:1},assets:generated,exportSettings:{light:false,hostBuiltins:true}};
    if(generated['builtin-arena']){p.scene.background=p.titleScreen.background=p.winScreen.background=p.loseScreen.background='builtin-arena';p.player.idle='builtin-hero';p.scene.objects.find(o=>o.id==='hoop').asset='builtin-hoop';p.scene.objects.find(o=>o.id==='ball').asset='builtin-ball'}return p;
  }
  function check(q,answer){
    if(q.type==='oral')return Boolean(answer);
    if(q.type==='single')return q.options.some(o=>o.id===answer&&o.correct);
    if(q.type==='multiple'){const good=q.options.filter(o=>o.correct).map(o=>o.id);return Array.isArray(answer)&&answer.length===good.length&&good.every(id=>answer.includes(id))}
    if(q.type==='order')return Array.isArray(answer)&&q.options.length===answer.length&&q.options.every((o,i)=>o.id===answer[i]);
    const normal=s=>{s=String(s).trim().replace(/\s+/g,' ');return q.caseSensitive?s:s.toLocaleLowerCase()};
    return q.answers.some(a=>normal(a)===normal(answer)||(q.mathAnswers!==false&&typeof BasketballMath!=='undefined'&&BasketballMath.equivalent(String(a),String(answer),q.tolerance))||(q.tolerance>0&&String(answer).trim()!==''&&Number.isFinite(Number(answer))&&Number.isFinite(Number(a))&&Math.abs(Number(a)-Number(answer))<=q.tolerance));
  }
  function validate(p){
    const errors=[];
    if(!p||p.schemaVersion!==1)return ['Неподдерживаемая версия проекта'];
    if(!p.questions?.length)errors.push('Добавьте хотя бы одно задание');
    const ids=new Set();
    (p.questions||[]).forEach((q,i)=>{const n='Задание '+(i+1)+': ';if(ids.has(q.id))errors.push(n+'повторяющийся ID');ids.add(q.id);if(!q.prompt?.trim())errors.push(n+'нет текста');if(!types[q.type])errors.push(n+'неизвестный тип');if(['single','multiple'].includes(q.type)&&(!q.options?.length||!q.options.some(o=>o.correct)||q.type==='single'&&q.options.filter(o=>o.correct).length!==1))errors.push(n+'проверьте правильные варианты');if(q.type==='order'&&q.options?.length<2)errors.push(n+'нужно минимум два элемента');if(q.type==='text'&&(!q.answers?.length||!q.answers.some(a=>a.trim())))errors.push(n+'нет допустимого ответа');if(!Number.isFinite(q.points)||q.points<0)errors.push(n+'неверные баллы')});
    ['player','hoop','ball','hud'].forEach(id=>{const o=p.scene?.objects?.find(o=>o.id===id);if(!o||o.hidden)errors.push('Обязательный объект отсутствует или скрыт: '+id)});
    return errors;
  }
  const allowedAsset = a => a && typeof a.data==='string' && /^data:(image\/(png|jpeg|webp|gif)|audio\/(mpeg|mp3|wav|x-wav|ogg));base64,[a-zA-Z0-9+/=\s]+$/.test(a.data);
  function load(raw){
    if(!raw||raw.schemaVersion!==1||!raw.scene||!Array.isArray(raw.scene.objects)||!Array.isArray(raw.questions))throw Error('Это не проект редактора Баскетбол версии 1.');
    if(raw.questions.length>500||raw.scene.objects.length>100)throw Error('Слишком большой проект: максимум 500 заданий и 100 объектов.');
    const base=defaults();
    // Only keys in the schema are copied. Prototype keys and executable media are never accepted.
    function merge(t,s){for(const k of Object.keys(t)){if(!Object.prototype.hasOwnProperty.call(s||{},k))continue;const v=s[k];if(Array.isArray(t[k]))t[k]=clone(v);else if(t[k]&&typeof t[k]==='object')merge(t[k],v);else if(typeof v===typeof t[k])t[k]=v}return t}
    const p=merge(base,raw);p.assets={};
    for(const [id,a] of Object.entries(raw.assets||{})){if(!/^[\w-]+$/.test(id)||!allowedAsset(a))throw Error('Недопустимое медиа: '+id);p.assets[id]={name:String(a.name||'Медиа'),data:a.data,type:a.type,size:a.size,originalSize:a.originalSize}}
    p.audio.assets={};for(const [k,v] of Object.entries(raw.audio?.assets||{}))if(typeof v==='string')p.audio.assets[k]=v;
    const allIds=new Set();p.scene.objects.forEach(o=>{if(!o||typeof o.id!=='string'||allIds.has(o.id)||!['player','hoop','ball','hud','decor'].includes(o.kind))throw Error('Некорректный объект сцены');allIds.add(o.id);for(const k of ['x','y','w','h','z','rotation','opacity'])if(!Number.isFinite(o[k]))throw Error('Некорректные координаты');o.w=Math.max(12,Math.min(2400,o.w));o.h=Math.max(12,Math.min(1350,o.h))});
    p.questions.forEach(q=>{if(q&&q.mathAnswers===undefined)q.mathAnswers=true;if(!q||!types[q.type]||typeof q.prompt!=='string'||!Array.isArray(q.options)||!Array.isArray(q.answers))throw Error('Некорректное задание');if(q.options.some(o=>!o||typeof o.id!=='string'||typeof o.text!=='string')||q.answers.some(a=>typeof a!=='string'))throw Error('Некорректные ответы')});
    p.scoring.lives=Math.max(1,Math.min(10,Math.round(p.scoring.lives)));p.scoring.seconds=Math.max(1,Math.min(3600,Math.round(p.scoring.seconds)));p.audio.volume=Math.max(0,Math.min(100,p.audio.volume));
    return p;
  }
  function refs(p){const used=new Set();function walk(v){if(typeof v==='string'&&p.assets[v])used.add(v);else if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')Object.values(v).forEach(walk)}const c={...p};delete c.assets;walk(c);return used}
  function compact(p){const c=clone(p);const used=refs(c);Object.keys(c.assets).forEach(id=>{if(!used.has(id))delete c.assets[id]});return c}
  return {uid,clone,escape,types,languages,words,defaults,question,check,validate,load,compact,allowedAsset};
})();
if(typeof module!=='undefined')module.exports=Basketball;
