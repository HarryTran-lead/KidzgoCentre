'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { getAccessToken } from '@/lib/store/authToken';
import { DEFAULT_LOCALE, localizePath } from '@/lib/i18n';
import Image from 'next/image';
import { LOGO } from '@/lib/theme/theme';

type Status = 'loading' | 'success' | 'error';

export default function ActivateProfileClient() {
  const searchParams = useSearchParams();
  const profileId = searchParams.get('id');
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const calledRef = useRef(false);

  useEffect(() => {
    // Guard: only run once
    if (calledRef.current) return;
    calledRef.current = true;

    if (!profileId) {
      setErrorMessage('Link xác minh không hợp lệ hoặc thiếu thông tin.');
      setStatus('error');
      return;
    }

    const token = getAccessToken();

    if (!token) {
      // Not logged in — redirect to login with the full activate-profile URL as the redirect target
      const redirectPath = `/activate-profile?id=${encodeURIComponent(profileId)}`;
      const loginPath = localizePath(
        `/auth/login?redirect=${encodeURIComponent(redirectPath)}`,
        DEFAULT_LOCALE
      );
      window.location.replace(loginPath);
      return;
    }

    // Logged in — call the reactivate API once
    axios
      .put(
        `/api/profiles/${profileId}/reactivate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setStatus('success');
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          'Link xác minh không hợp lệ hoặc đã hết hạn.';
        setErrorMessage(msg);
        setStatus('error');
      });
  }, [profileId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 via-white to-rose-50 px-4">
      <div className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden bg-white">
        {/* Header */}
        <div className="bg-linear-to-r from-red-600 to-red-700 px-8 py-6 flex flex-col items-center gap-3">
          {LOGO ? (
            <Image src={LOGO} alt="KidzGo" width={48} height={48} className="rounded-xl" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-lg">
              K
            </div>
          )}
          <h1 className="text-white text-xl font-bold tracking-wide">KidzGo</h1>
          <p className="text-red-100 text-sm">Xác minh hồ sơ học viên</p>
        </div>

        {/* Body */}
        <div className="px-8 py-10 flex flex-col items-center gap-6 text-center">
          {status === 'loading' && <LoadingState />}
          {status === 'success' && <SuccessState />}
          {status === 'error' && <ErrorState message={errorMessage} />}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <>
      <div className="w-16 h-16 rounded-full border-4 border-red-200 border-t-red-600 animate-spin" />
      <div>
        <p className="text-slate-700 font-semibold text-lg">Đang xác minh hồ sơ...</p>
        <p className="text-slate-400 text-sm mt-1">Vui lòng chờ trong giây lát</p>
      </div>
    </>
  );
}

function SuccessState() {
  return (
    <>
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 mb-1">🎉 Thành công!</p>
        <p className="text-slate-600 text-base font-medium">
          Hồ sơ đã được xác minh thành công
        </p>
        <p className="text-slate-400 text-sm mt-2">
          Học viên có thể tiếp tục sử dụng tài khoản bình thường.
        </p>
      </div>
      <a
        href="/"
        className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-linear-to-r from-red-600 to-red-700 text-white font-semibold text-sm shadow hover:opacity-90 transition-opacity"
      >
        Về trang chủ
      </a>
    </>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <>
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>
      <div>
        <p className="text-xl font-bold text-slate-800 mb-1">Xác minh thất bại</p>
        <p className="text-slate-500 text-sm leading-relaxed">
          {message || 'Link xác minh không hợp lệ hoặc đã hết hạn.'}
        </p>
      </div>
      <a
        href="/"
        className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors"
      >
        Về trang chủ
      </a>
    </>
  );
}
