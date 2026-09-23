import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, RefreshCw } from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    startScanner();

    return () => {
      stopScanner();
    };
  }, [isOpen, facingMode]);

  const startScanner = async () => {
    setErrorMsg(null);
    try {
      if (scannerRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode('qr-reader-container');
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 180 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: facingMode },
        config,
        (decodedText) => {
          onScanSuccess(decodedText);
          stopScanner();
          onClose();
        },
        () => {
          // ignore frame errors
        }
      );
      setIsScanning(true);
    } catch (err: unknown) {
      console.warn('Scanner camera error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg('ไม่สามารถเปิดกล้องได้ โปรดอนุญาตสิทธิ์การใช้กล้อง (Camera Permission): ' + msg);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Stop scanner error:', e);
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="qr-scanner-modal"
      className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 px-4 py-3 flex justify-between items-center text-white">
          <h3 className="font-bold text-sm font-heading flex items-center gap-2">
            <Camera className="w-4 h-4 text-blue-400" />
            <span>สแกน บาร์โค้ด / QR Code ครุภัณฑ์</span>
          </h3>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Preview */}
        <div className="p-4 flex flex-col items-center">
          {errorMsg ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-2 text-center w-full">
              <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
              <p>{errorMsg}</p>
              <button
                onClick={startScanner}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          ) : (
            <div className="w-full relative">
              <div
                id="qr-reader-container"
                className="w-full rounded-xl overflow-hidden bg-black aspect-square flex items-center justify-center"
              />
              <p className="text-xs text-slate-500 mt-2.5 text-center">
                ถือกล้องส่องให้บาร์โค้ดหรือ QR Code พัสดุอยู่ภายในกรอบสี่เหลี่ยม
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
            }
            className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-200/60"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>สลับกล้อง ({facingMode === 'environment' ? 'หลัง' : 'หน้า'})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
