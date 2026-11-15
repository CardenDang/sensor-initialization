import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccountService, accountUser } from '../src/api/accounts.js';
test('missing configuration fails clearly',async()=>{
  await assert.rejects(createAccountService(null).authenticate('login',{email:'a@b.com',password:'test'}),/not configured/);
});
test('registration passes profile and confirmation URL, without pretending to sign in',async()=>{
  let received;
  const service=createAccountService({auth:{signUp:async values=>{received=values;return {data:{session:null},error:null};}}});
  const result=await service.authenticate('register',{name:' Test Sleeper ',email:' TEST@example.com ',password:'long-password-123'},'http://localhost:5173/login');
  assert.equal(result.confirmationRequired,true);
  assert.equal(result.session,null);
  assert.equal(received.email,'test@example.com');
  assert.deepEqual(received.options,{data:{full_name:'Test Sleeper'},emailRedirectTo:'http://localhost:5173/login'});
});
test('validation prevents invalid registration requests',async()=>{
  const service=createAccountService({auth:{signUp:()=>{throw Error('Should not call');}}});
  await assert.rejects(service.authenticate('register',{name:'A',password:'short'}),/12–128/);
  await assert.rejects(service.authenticate('register',{name:'',password:'long-password-123'}),/name/);
});
test('login returns session, logout and provider failures propagate',async()=>{
  const session={user:{id:'user-a',email:'a@example.com',user_metadata:{full_name:'Sleeper A'}}};
  let signedOut=false;
  const service=createAccountService({auth:{signInWithPassword:async()=>({data:{session},error:null}),signOut:async()=>{signedOut=true;return {error:null};}}});
  assert.equal((await service.authenticate('login',{email:'a@example.com',password:'password'})).session,session);
  assert.deepEqual(accountUser(session.user),{id:'user-a',email:'a@example.com',name:'Sleeper A'});
  assert.equal(accountUser(null),null);
  await service.logout();assert.ok(signedOut);
  const failure=createAccountService({auth:{signInWithPassword:async()=>({error:new Error('Invalid credentials')}),signOut:async()=>({error:new Error('Offline')})}});
  await assert.rejects(failure.authenticate('login',{email:'a@example.com',password:'wrong'}),/Invalid credentials/);
  await assert.rejects(failure.logout(),/Offline/);
});
