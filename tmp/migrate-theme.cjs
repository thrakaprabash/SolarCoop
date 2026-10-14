const fs=require('fs'),path=require('path'),parser=require('@babel/parser'),traverse=require('@babel/traverse').default;
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const targets=['App.js',...files('src').filter(f=>f.endsWith('.js')&&!f.includes(path.sep+'theme'+path.sep)&&!f.endsWith('technician/theme.js')&&!f.endsWith('ThemeSwitcher.js'))];
function component(p){for(let q=p.parentPath;q;q=q.parentPath){if(q.isFunction()){const n=q.node.id?.name||(q.parentPath.isVariableDeclarator()?q.parentPath.node.id.name:null);if(n&&/^[A-Z]/.test(n)&&q.node.body.type==='BlockStatement')return q;}}}
const props=new Set(['color','backgroundColor','borderColor','borderTopColor','borderBottomColor','borderLeftColor','borderRightColor','placeholderTextColor','tintColor','fill','stroke']);
let total=0;
for(const file of targets){
 const src=fs.readFileSync(file,'utf8'),ast=parser.parse(src,{sourceType:'module',plugins:['jsx']});
 const edits=[],needs=new Map(),renamed=new Set();let lastImport=0;
 function need(p,name){const c=component(p);if(!c)return null;if(!needs.has(c.node))needs.set(c.node,new Set());needs.get(c.node).add(name);return c;}
 traverse(ast,{
  ImportDeclaration(p){lastImport=Math.max(lastImport,p.node.end);},
  ReferencedIdentifier(p){
   const n=p.node.name,b=p.scope.getBinding(n);if(!b||b.scope.path.type!=='Program')return;
   if(n==='styles'&&b.path.isVariableDeclarator()&&b.path.node.init?.type==='CallExpression'&&b.path.node.init.callee?.object?.name==='StyleSheet'){
    if(need(p,'styles')&&!renamed.has(b.identifier.start)){renamed.add(b.identifier.start);edits.push([b.identifier.start,b.identifier.end,'baseStyles']);}
   }else if(['COLORS','GLASS','colors','TECH'].includes(n)&&b.path.isImportSpecifier()){
    const source=b.path.parent.source.value;
    if(/theme/.test(source))need(p,n);
   }
  },
  StringLiteral(p){
   const v=p.node.value;if(!/^(#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})|rgba?\()/i.test(v))return;
   let prop;
   if(p.parentPath.isObjectProperty()&&p.key==='value') prop=p.parent.key.name||p.parent.key.value;
   else if(p.parentPath.isJSXAttribute())prop=p.parent.name.name;
   if(!props.has(prop))return;
   if(!need(p,'themeColor'))return;
   const code=`themeColor(${JSON.stringify(v)}, ${JSON.stringify(prop)})`;
   edits.push([p.node.start,p.node.end,p.parentPath.isJSXAttribute()?`{${code}}`:code]);
  }
 });
 if(!needs.size)continue;
 for(const [node,names] of needs){
  let s='\n';if(names.has('styles'))s+='  const styles = useThemedStyles(baseStyles);\n';
  const tokens=[...names].filter(n=>n!=='styles');if(tokens.length)s+=`  const { ${tokens.join(', ')} } = useLegacyTheme();\n`;
  edits.push([node.body.start+1,node.body.start+1,s]);
 }
 let relative=path.relative(path.dirname(file),'src/theme/useLegacyTheme').replace(/\\/g,'/');if(!relative.startsWith('.'))relative='./'+relative;
 const hookNames=[];if([...needs.values()].some(s=>s.has('styles')))hookNames.push('useThemedStyles');if([...needs.values()].some(s=>[...s].some(n=>n!=='styles')))hookNames.push('useLegacyTheme');
 edits.push([lastImport,lastImport,`\nimport { ${hookNames.join(', ')} } from '${relative}';`]);
 let result=src;for(const [a,b,s]of edits.sort((a,b)=>b[0]-a[0]))result=result.slice(0,a)+s+result.slice(b);
 parser.parse(result,{sourceType:'module',plugins:['jsx']});fs.writeFileSync(file,result);total++;
}
console.log('Connected theme presentation in',total,'files');
