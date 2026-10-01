/* Offline subset of LaTeX from Shpargalka.pdf, rendered as native MathML. */
const BasketballMath = (() => {
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const symbols={times:'×',cdot:'·',div:'÷',pm:'±',neq:'≠',ne:'≠',leq:'≤',le:'≤',geq:'≥',ge:'≥',infty:'∞',pi:'π',approx:'≈',angle:'∠',triangle:'△',parallel:'∥',perp:'⊥',to:'→',rightarrow:'→',circ:'°',sum:'∑',prod:'∏',int:'∫',in:'∈',notin:'∉',alpha:'α',beta:'β',gamma:'γ',theta:'θ',delta:'δ',lambda:'λ',mu:'μ',sigma:'σ',omega:'ω',ldots:'…',dots:'…'};
  const node=(tag,content,attributes='')=>`<${tag}${attributes}>${content}</${tag}>`;
  function latex(input,display=false){
    const source=String(input);if(source.length>5000)throw Error('Формула слишком длинная');let pos=0,depth=0;
    const whitespace=()=>{while(/\s/.test(source[pos]||'')&&pos<source.length)pos++};
    function rawGroup(){whitespace();if(source[pos]!=='{')throw Error('Нужны фигурные скобки');const start=++pos;let balance=1;while(pos<source.length&&balance){if(source[pos]==='{')balance++;if(source[pos]==='}')balance--;pos++}if(balance)throw Error('Незакрытая фигурная скобка');return source.slice(start,pos-1)}
    function argument(){whitespace();if(source[pos]==='{'){pos++;return expression('}')}return atom()}
    function atom(){
      whitespace();if(++depth>64)throw Error('Слишком глубокая формула');let value='',large=false;
      const ch=source[pos++];if(!ch)throw Error('Неполная формула');
      if(ch==='{')value=expression('}');
      else if(ch==='\\'){
        const match=source.slice(pos).match(/^[a-zA-Z]+/);const command=match?match[0]:source[pos++]||'';if(match)pos+=command.length;
        if(['frac','dfrac','tfrac'].includes(command)){const a=argument(),b=argument();value=node('mfrac',a+b)}
        else if(command==='sqrt'){whitespace();let degree='';if(source[pos]==='['){const start=++pos;while(pos<source.length&&source[pos]!==']')pos++;if(source[pos]!==']')throw Error('Незакрытый индекс корня');degree=source.slice(start,pos++);degree=latexBody(degree)}const radicand=argument();value=node(degree?'mroot':'msqrt',radicand+degree)}
        else if(command==='text'||command==='mathrm'||command==='operatorname'){value=node('mtext',escape(rawGroup()),' mathvariant="normal"')}
        else if(command==='overline'||command==='bar')value=node('mover',argument()+node('mo','¯'),' accent="true"');
        else if(command==='left'||command==='right'){whitespace();let bracket=source[pos++];if(bracket==='\\')bracket=source[pos++];value=bracket==='.'?'':node('mo',escape(bracket),' stretchy="true"')}
        else if(command==='begin'){
          const env=rawGroup();if(env!=='cases')throw Error('Поддерживается окружение cases');const stop='\\end{cases}',end=source.indexOf(stop,pos);if(end<0)throw Error('Нет \\end{cases}');const rows=source.slice(pos,end).split(/\\\\/).filter(row=>row.trim());pos=end+stop.length;value=node('mrow',node('mo','{',' stretchy="true"')+node('mtable',rows.map(row=>node('mtr',row.split('&').map(cell=>node('mtd',latexBody(cell),' columnalign="left"')).join(''))).join(''),' columnalign="left"'));
        }
        else if(command==='lim'){value=node('mi','lim',' mathvariant="normal"');large=true}
        else if(['sin','cos','tan','log','ln','max','min'].includes(command))value=node('mi',command,' mathvariant="normal"');
        else if(command in symbols){value=node(command==='pi'||['alpha','beta','gamma','theta','delta','lambda','mu','sigma','omega'].includes(command)?'mi':'mo',symbols[command]);large=['sum','prod','int'].includes(command)}
        else if([',',';','!',' '].includes(command))value='<mspace width="0.2em"></mspace>';
        else if(['%','{','}','_','$','|'].includes(command))value=node('mo',escape(command));
        else throw Error('Неизвестная команда \\'+command);
      }else if(/[0-9]/.test(ch)){let number=ch;while(/[0-9.,]/.test(source[pos]||'')&&pos<source.length)number+=source[pos++];value=node('mn',escape(number))}
      else if(/[a-zA-Zа-яА-Я]/.test(ch))value=node('mi',escape(ch));
      else if(ch==='}')throw Error('Лишняя фигурная скобка');
      else value=node('mo',escape(ch));
      let sub='',sup='';whitespace();while(source[pos]==='_'||source[pos]==='^'){const marker=source[pos++];const script=argument();if(marker==='^')sup=script;else sub=script;whitespace()}
      if(sub&&sup)value=node(large?'munderover':'msubsup',value+sub+sup);else if(sub)value=node(large?'munder':'msub',value+sub);else if(sup)value=node(large?'mover':'msup',value+sup);depth--;return value;
    }
    function expression(end){let content='';while(pos<source.length){whitespace();if(source[pos]===end){pos++;return node('mrow',content)}if(pos>=source.length)break;content+=atom()}if(end)throw Error('Незакрытая фигурная скобка');return node('mrow',content)}
    const content=expression();return `<math xmlns="http://www.w3.org/1998/Math/MathML" display="${display?'block':'inline'}" aria-label="${escape(source)}">${content}</math>`;
  }
  function latexBody(value){return latex(value).replace(/^<math[^>]*>/,'').replace(/<\/math>$/,'')}
  function rich(text){
    text=String(text??'');let result='',last=0;const pattern=/\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$|\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g;let found=false;
    const render=(formula,display)=>{try{return latex(formula,display)}catch(error){return `<span class="math-error" title="${escape(error.message)}">${escape(formula)}</span>`}};
    for(const match of text.matchAll(pattern)){found=true;result+=escape(text.slice(last,match.index));result+=render(match[1]??match[2]??match[3]??match[4],match[1]!==undefined||match[4]!==undefined);last=match.index+match[0].length}
    if(!found&&/\\(?:frac|sqrt|sum|lim|angle|triangle|overline|begin)\b|[a-zA-Z0-9][_^]\{?[a-zA-Z0-9]/.test(text)&&!/[а-яА-Я]{2,}/.test(text))return render(text,false);
    return result+escape(text.slice(last));
  }
  function numeric(raw){
    if(typeof raw!=='string'||raw.length>2000||!raw.trim())return null;
    let s=raw.trim().replace(/^\$\$?|\$\$?$/g,'').replace(/\\(?:left|right)/g,'').replace(/\\(?:times|cdot)/g,'*').replace(/\\div/g,'/').replace(/\\pi\b/g,'pi').replace(/\\,/g,' ').replace(/\\%/g,'%').replace(/[×·∙]/g,'*').replace(/[÷:]/g,'/').replace(/[−–]/g,'-').replace(/(\d),(?=\d)/g,'$1.').replace(/²/g,'^2').replace(/³/g,'^3');
    const vulgar={'½':'(1/2)','¼':'(1/4)','¾':'(3/4)','⅓':'(1/3)','⅔':'(2/3)'};s=s.replace(/[½¼¾⅓⅔]/g,c=>vulgar[c]);
    if(/^[+-]?\d+\s+\d+\/\d+$/.test(s)){s=s.replace(/^([+-]?\d+)\s+(\d+\/\d+)$/,(_,a,b)=>Number(a)<0?`(${a}-(${b}))`:`(${a}+(${b}))`)}
    function expand(str,n=0){if(n>32)throw Error('depth');let out='';for(let i=0;i<str.length;){const m=str.slice(i).match(/^\\(frac|dfrac|tfrac|sqrt)\b/);if(!m){out+=str[i++];continue}i+=m[0].length;const group=()=>{while(/\s/.test(str[i]||'')&&i<str.length)i++;if(str[i++]!=='{')throw Error('group');const start=i;let level=1;while(i<str.length&&level){if(str[i]==='{')level++;if(str[i]==='}')level--;i++}if(level)throw Error('group');return expand(str.slice(start,i-1),n+1)};if(m[1]==='sqrt'){while(/\s/.test(str[i]||'')&&i<str.length)i++;let degree='';if(str[i]==='['){const start=++i;while(i<str.length&&str[i]!==']')i++;if(str[i]!==']')throw Error('root');degree=expand(str.slice(start,i++),n+1)}const value=group();out+=degree?`root((${value}),(${degree}))`:`sqrt(${value})`}else{const a=group(),b=group();out+=`((${a})/(${b}))`}}return out}
    try{s=expand(s).replace(/[{}]/g,c=>c==='{'?'(':')').replace(/π/g,'pi');const tokens=s.match(/(?:\d*\.\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?|[a-zA-Z]+|[()+\-*/^%,]/g)||[];if(tokens.join('')!==s.replace(/\s/g,''))return null;let i=0,budget=512,nesting=0;
      function guard(){if(--budget<0)throw Error('budget')}
      const constant={pi:Math.PI,e:Math.E};
      function primary(){guard();if(++nesting>64)throw Error('depth');let value,token=tokens[i++];if(token==='('){value=sum();if(tokens[i++]!==')')throw Error('parenthesis')}else if(token in constant)value=constant[token];else if(['sqrt','abs','root','sin','cos','tan','ln','log'].includes(token)){if(tokens[i++]!=='(')throw Error('function');const a=sum();let b=0;if(tokens[i]===','){i++;b=sum()}if(tokens[i++]!==')')throw Error('function');value=token==='sqrt'?Math.sqrt(a):token==='abs'?Math.abs(a):token==='root'?(a<0&&b%2===1?-Math.pow(-a,1/b):Math.pow(a,1/b)):token==='ln'?Math.log(a):token==='log'?Math.log10(a):Math[token](a)}else if(token&&/^(?:\d|\.)/.test(token))value=Number(token);else throw Error('token');nesting--;return value}
      function power(){let value=primary();while(tokens[i]==='%'){i++;value/=100}if(tokens[i]==='^'){i++;value=Math.pow(value,unary())}return value}
      function unary(){guard();if(tokens[i]==='+'){i++;return unary()}if(tokens[i]==='-'){i++;return -unary()}return power()}
      function product(){let value=unary();while(i<tokens.length){guard();const op=tokens[i];if(op==='*'||op==='/'){i++;const b=unary();value=op==='*'?value*b:value/b}else if(op==='('||op in constant||['sqrt','abs','root','sin','cos','tan','ln','log'].includes(op)){value*=unary()}else break}return value}
      function sum(){let value=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],b=product();value=op==='+'?value+b:value-b}return value}
      const value=sum();return i===tokens.length&&Number.isFinite(value)?value:null;
    }catch{return null}
  }
  function equivalent(a,b,tolerance=0){const av=numeric(String(a)),bv=numeric(String(b));return av!==null&&bv!==null&&Math.abs(av-bv)<=Math.max(tolerance,1e-10*Math.max(1,Math.abs(av),Math.abs(bv)))}
  return {rich,latex,numeric,equivalent};
})();
