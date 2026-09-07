import {createHmac,timingSafeEqual,createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
export interface CampaignToken {v:1; purpose:'campaign'; signal:string; contact:string; audience:'seller'|'broker'; step:0|1|2; exp:number}
export interface OptOutToken {v:1; purpose:'unsubscribe'; contact:string}
export type Token = CampaignToken | OptOutToken;
export const idPattern=/^[a-zA-Z0-9_-]{3,64}$/;
export function signToken(payload:Token,secret:string){
  if(secret.length<32) throw new Error('A dedicated signing secret of at least 32 characters is required');
  const body=Buffer.from(JSON.stringify(payload)).toString('base64url');
  return body+'.'+createHmac('sha256',secret).update(body).digest('base64url');
}
export function verifyToken(token:unknown,secret:string,purpose:Token['purpose'],now=Date.now()):Token|null{
  if(typeof token!=='string'||token.length>1000||secret.length<32) return null;
  const pieces=token.split('.'); if(pieces.length!==2) return null;
  const [body,signature]=pieces;
  const expected=createHmac('sha256',secret).update(body).digest('base64url');
  if(signature.length!==expected.length||!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return null;
  try{
    const p=JSON.parse(Buffer.from(body,'base64url').toString()) as Token;
    if(p.v!==1||p.purpose!==purpose||!idPattern.test(p.contact)) return null;
    if(p.purpose==='campaign'&&(!idPattern.test(p.signal)||!['seller','broker'].includes(p.audience)||![0,1,2].includes(p.step)||!Number.isFinite(p.exp)||p.exp*1000<=now))return null;
    return p;
  }catch{return null;}
}
export function contactHash(email:string,secret:string){
  if(secret.length<32)throw new Error('Dedicated suppression key required');
  return createHmac('sha256',secret).update(email.trim().toLowerCase()).digest('hex');
}
function emailKey(secret:string){if(secret.length<32)throw new Error('Signing secret required');return createHmac('sha256',secret).update('stalled-exit-email-encryption-v1').digest();}
export function encryptEmail(email:string,secret:string){const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',emailKey(secret),iv);const body=Buffer.concat([cipher.update(email.trim().toLowerCase(),'utf8'),cipher.final()]);return [iv,cipher.getAuthTag(),body].map(b=>b.toString('base64url')).join('.');}
export function decryptEmail(value:string,secret:string){const [iv,tag,body]=value.split('.').map(s=>Buffer.from(s,'base64url'));const cipher=createDecipheriv('aes-256-gcm',emailKey(secret),iv);cipher.setAuthTag(tag);return Buffer.concat([cipher.update(body),cipher.final()]).toString('utf8');}
