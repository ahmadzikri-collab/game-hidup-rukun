import React, { useState } from 'react';
import { Shield, Lock, X, KeyRound, AlertCircle, CheckCircle2, Globe } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { gameDb } from '../services/db';
import { signInTeacherWithGoogle } from '../services/firebase';

interface TeacherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TeacherAuthModal: React.FC<TeacherAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInTeacherWithGoogle();
      if (user) {
        // Validasi apakah email Google terdaftar sebagai Guru/Admin
        const isAuthorized = gameDb.isAuthorizedTeacherEmail(user.email);
        if (isAuthorized) {
          soundManager.playSuccess();
          onSuccess();
        } else {
          // Bukan email guru yang terdaftar
          soundManager.playEncourage();
          setErrorMsg(
            `Akses Ditolak: Akun Google (${user.email || 'tanpa email'}) bukan akun Guru terdaftar. Siswa tidak diizinkan masuk ke Dashboard Guru.`
          );
        }
      } else {
        setErrorMsg('Login Google dibatalkan atau belum berhasil. Silakan coba lagi atau gunakan PIN.');
      }
    } catch (e) {
      setErrorMsg('Gagal masuk dengan Google. Gunakan PIN Guru.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameDb.verifyTeacherPin(pinInput)) {
      soundManager.playSuccess();
      setErrorMsg(null);
      setPinInput('');
      onSuccess();
    } else {
      soundManager.playEncourage();
      setErrorMsg('PIN Guru salah! Area ini hanya untuk Bapak/Ibu Guru.');
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 rounded-3xl p-6 border-2 border-amber-500/50 shadow-2xl space-y-5 text-white">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 flex items-center justify-center shadow-lg">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-amber-400">
              <Lock className="w-7 h-7" />
            </div>
          </div>
          <h3 className="text-xl font-black text-white">
            Akses Khusus Bapak/Ibu Guru
          </h3>
          <p className="text-xs text-slate-300">
            Halaman ini dilindungi autentikasi Firebase & kata sandi agar siswa tidak dapat membuka dashboard guru.
          </p>
        </div>

        {/* Google Sign-in button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isGoogleLoading ? 'Menghubungkan ke Google...' : 'Masuk dengan Google (Firebase Auth)'}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">atau dengan PIN</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Masukkan PIN / Kata Sandi Guru:</span>
            </label>
            <input
              type="password"
              autoFocus
              maxLength={12}
              placeholder="Masukkan PIN (Default: 1234)"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full bg-slate-800 border-2 border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-3 text-center text-lg font-mono font-black tracking-widest text-white focus:outline-none shadow-inner"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
              <span>💡 PIN Awal Pengujian: <strong>1234</strong></span>
              <span>Dapat diubah di Dashboard</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
            >
              Kembali
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-transform active:scale-95"
            >
              Masuk Dashboard Guru
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
