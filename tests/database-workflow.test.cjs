const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {projectRef,requireBaseline,requireLinkedProject}=require('../scripts/database.cjs');
const ref='abcdefghijklmnopqrst';
test('database commands target the app project and reject a different configured project',()=>{
  assert.equal(projectRef({EXPO_PUBLIC_SUPABASE_URL:`https://${ref}.supabase.co`}),ref);
  assert.throws(()=>projectRef({EXPO_PUBLIC_SUPABASE_URL:`https://${ref}.supabase.co`,SUPABASE_PROJECT_REF:'wrong-project'}),/differs/);
  assert.throws(()=>projectRef({EXPO_PUBLIC_SUPABASE_URL:'https://example.com'}),/hosted/);
});
test('migration pushes require a captured baseline for the same database',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'solarcoop-db-workflow-')),file=path.join(dir,'baseline.json');
  try{
    assert.throws(()=>requireBaseline(ref,file),/Capture/);
    fs.writeFileSync(file,JSON.stringify({projectRef:'wrong-project',files:['20261008000000_existing_schema.sql']}));
    assert.throws(()=>requireBaseline(ref,file),/different/);
    fs.writeFileSync(file,JSON.stringify({projectRef:ref,files:['../unrelated.sql']}));
    assert.throws(()=>requireBaseline(ref,file),/Invalid/);
    fs.writeFileSync(file,JSON.stringify({projectRef:ref,files:['20261008000000_existing_schema.sql']}));
    assert.equal(requireBaseline(ref,file).files.length,1);
    const linked=path.join(dir,'project-ref');
    assert.throws(()=>requireLinkedProject(ref,linked),/db:link/);
    fs.writeFileSync(linked,'wrong-project');
    assert.throws(()=>requireLinkedProject(ref,linked),/differs/);
    fs.writeFileSync(linked,ref+'\n');
    assert.doesNotThrow(()=>requireLinkedProject(ref,linked));
  }finally{
    const resolved=fs.realpathSync(dir);
    assert(resolved.startsWith(path.join(os.tmpdir(),'solarcoop-db-workflow-')));
    fs.rmSync(resolved,{recursive:true});
  }
});
