'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInAction, signUpAction, verifyOtpAction, resendSignupOtp,
  requestResetAction, verifyRecoveryAction, updatePasswordAction,
} from '@/app/auth/actions';

export type Step = 'signin' | 'signup' | 'verify' | 'forgot' | 'reset' | 'changepw';

const input: React.CSSProperties = { width: '100%', height: 46, background: '#fff', border: '1px solid rgba(43,42,38,.14)', borderRadius: 12, padding: '0 14px', fontSize: 14, outline: 'none' };
const label: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#4a473f', marginBottom: 6 };
const primary: React.CSSProperties = { width: '100%', height: 48, borderRadius: 14, background: 'var(--color-accent)', border: 0, cursor: 'pointer', fontWeight: 600, fontSize: 15, color: '#fff', marginTop: 6 };
const ghost: React.CSSProperties = { width: '100%', height: 48, borderRadius: 14, background: '#fff', border: '1px solid rgba(43,42,38,.14)', cursor: 'pointer', fontWeight: 600, fontSize: 15, color: 'var(--color-text)' };

export function AuthModal({ initial, onClose }: { initial: Step; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initial);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const done = () => { router.refresh(); onClose(); };
  const run = (fn: () => Promise<any>) => {
    setErr(null); setMsg(null);
    start(async () => { await fn(); });
  };

  const titles: Record<Step, string> = {
    signin: 'Sign in', signup: 'Create your account', verify: 'Verify your email',
    forgot: 'Reset password', reset: 'Set a new password', changepw: 'Change password',
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'grid', placeItems: 'center', padding: 16, background: 'rgba(12,44,25,.45)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(440px,100%)', background: 'var(--color-surface)', borderRadius: 24, overflow: 'hidden', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px', background: 'var(--color-surface-2)' }}>
          <h3 style={{ fontSize: 21, margin: 0 }}>{titles[step]}</h3>
          <button onClick={onClose} aria-label="Close" style={{ width: 38, height: 38, borderRadius: 12, background: '#fff', border: 0, cursor: 'pointer', color: 'var(--muted)', display: 'grid', placeItems: 'center' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {err && <div style={{ background: '#fbecea', color: '#b23b2e', fontSize: 13, fontWeight: 600, padding: '10px 12px', borderRadius: 10 }}>{err}</div>}
          {msg && <div style={{ background: 'var(--color-accent-100)', color: 'var(--color-accent)', fontSize: 13, fontWeight: 600, padding: '10px 12px', borderRadius: 10 }}>{msg}</div>}

          {step === 'signup' && (
            <div><label style={label}>Full name</label><input style={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></div>
          )}
          {(step === 'signin' || step === 'signup' || step === 'forgot') && (
            <div><label style={label}>Email</label><input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
          )}
          {(step === 'signin' || step === 'signup') && (
            <div>
              <label style={label}>Password</label>
              <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={step === 'signin' ? 'current-password' : 'new-password'} />
            </div>
          )}
          {(step === 'verify' || step === 'reset') && (
            <>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Enter the 6-digit code we emailed to <b>{email}</b>.</p>
              <div><label style={label}>Verification code</label><input style={{ ...input, letterSpacing: '.4em', fontSize: 18, fontWeight: 600, textAlign: 'center' }} inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /></div>
            </>
          )}
          {(step === 'reset' || step === 'changepw') && (
            <div><label style={label}>New password</label><input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></div>
          )}

          {/* actions */}
          {step === 'signin' && (
            <>
              <button disabled={pending} style={primary} onClick={() => run(async () => {
                const r = await signInAction(email, password);
                if (r.error && r.needsVerify) { setStep('verify'); setMsg('Please verify your email first — enter the code below.'); }
                else if (r.error) setErr(r.error); else done();
              })}>{pending ? 'Signing in…' : 'Sign In'}</button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, fontWeight: 600 }}>
                <span onClick={() => { setStep('forgot'); setErr(null); }} style={{ cursor: 'pointer', color: 'var(--color-accent)' }}>Forgot password?</span>
              </div>
              <div style={{ textAlign: 'center', margin: '6px 0', fontSize: 12, color: 'var(--muted-2)' }}>New to Precision CNC Tools?</div>
              <button style={ghost} onClick={() => { setStep('signup'); setErr(null); }}>Create an account — join VIP free</button>
            </>
          )}

          {step === 'signup' && (
            <>
              <button disabled={pending} style={primary} onClick={() => run(async () => {
                const r = await signUpAction(email, password, name);
                if (r.error) setErr(r.error);
                else if (r.needsVerify) { setStep('verify'); setMsg('Check your email for a 6-digit verification code.'); }
                else done();
              })}>{pending ? 'Creating…' : 'Create account'}</button>
              <div style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 600 }}>
                <span onClick={() => { setStep('signin'); setErr(null); }} style={{ cursor: 'pointer', color: 'var(--color-accent)' }}>Already have an account? Sign in</span>
              </div>
            </>
          )}

          {step === 'verify' && (
            <>
              <button disabled={pending || code.length < 6} style={primary} onClick={() => run(async () => {
                const r = await verifyOtpAction(email, code);
                if (r.error) setErr(r.error); else done();
              })}>{pending ? 'Verifying…' : 'Verify & continue'}</button>
              <div style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 600 }}>
                <span onClick={() => run(async () => { const r = await resendSignupOtp(email); r.error ? setErr(r.error) : setMsg('New code sent.'); })} style={{ cursor: 'pointer', color: 'var(--color-accent)' }}>Resend code</span>
              </div>
            </>
          )}

          {step === 'forgot' && (
            <button disabled={pending} style={primary} onClick={() => run(async () => {
              const r = await requestResetAction(email);
              if (r.error) setErr(r.error); else { setStep('reset'); setMsg('We emailed you a 6-digit reset code.'); }
            })}>{pending ? 'Sending…' : 'Send reset code'}</button>
          )}

          {step === 'reset' && (
            <button disabled={pending || code.length < 6 || password.length < 6} style={primary} onClick={() => run(async () => {
              const v = await verifyRecoveryAction(email, code);
              if (v.error) { setErr(v.error); return; }
              const u = await updatePasswordAction(password);
              if (u.error) setErr(u.error); else done();
            })}>{pending ? 'Updating…' : 'Update password'}</button>
          )}

          {step === 'changepw' && (
            <button disabled={pending || password.length < 6} style={primary} onClick={() => run(async () => {
              const r = await updatePasswordAction(password);
              if (r.error) setErr(r.error); else { setMsg('Password updated.'); setTimeout(onClose, 900); }
            })}>{pending ? 'Updating…' : 'Update password'}</button>
          )}
        </div>
      </div>
    </div>
  );
}
