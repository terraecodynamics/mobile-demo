"use client";

import { SoftButton, SoftChip, SoftRaised } from "@/components/ui/SoftUi";
import { kronis } from "@/lib/kronis";
import {
  AlertCircle,
  ArrowLeft,
  CameraOff,
  KeyRound,
  Keyboard,
  QrCode,
  RefreshCw,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Mode = "scan" | "code";

function parseQRData(qrText: string): { scratch_code: string } {
  try {
    let scratchCodeValue = "";
    try {
      const parsed = JSON.parse(qrText) as { scratch_code?: unknown };
      if (parsed.scratch_code != null) {
        scratchCodeValue = String(parsed.scratch_code).trim();
      } else {
        throw new Error("No scratch_code found in JSON");
      }
    } catch {
      scratchCodeValue = String(qrText).trim();
    }
    if (!scratchCodeValue || scratchCodeValue === "[object Object]") {
      throw new Error("No valid scratch code found in QR code");
    }
    return { scratch_code: scratchCodeValue };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    throw new Error(`Invalid QR code format: ${msg}`);
  }
}

/** Demo-valid scratch codes */
const DEMO_CODES = new Set([
  "SCRATCH-PUMP-001",
  "KRONIS-DEMO-007",
  "DEMO-PUMP-1",
]);

export default function AddPumpPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  const [mode, setMode] = useState<Mode>("scan");
  const [scratchCode, setScratchCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (scanLoopRef.current != null) {
      window.clearInterval(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setHasPermission(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setHasPermission(true);
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => undefined);
      }
    } catch {
      setHasPermission(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (mode === "scan") startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [mode, startCamera, stopCamera]);

  const verifyCode = useCallback(
    async (code: string) => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed) {
        setError("Please enter a scratch code.");
        return;
      }
      setIsVerifying(true);
      setError("");
      await new Promise((r) => setTimeout(r, 700));

      if (!DEMO_CODES.has(trimmed) && trimmed.length < 6) {
        setError("Invalid scratch code. Please check the code.");
        setIsVerifying(false);
        setScanned(false);
        return;
      }

      // Demo: accept known codes or any code ≥ 6 chars
      if (!DEMO_CODES.has(trimmed) && trimmed.length < 8) {
        setError("Invalid scratch code. Please check the code.");
        setIsVerifying(false);
        setScanned(false);
        return;
      }

      setIsVerifying(false);
      setToast(`Pump added · "${trimmed}" is ready on your farm`);
      setScratchCode("");
      setScanned(false);
      window.setTimeout(() => router.push("/home"), 900);
    },
    [router]
  );

  const handleQRPayload = useCallback(
    async (data: string) => {
      if (scanned) return;
      try {
        setScanned(true);
        const qrData = parseQRData(data);
        const extracted = String(qrData.scratch_code).trim();
        if (!extracted || extracted === "[object Object]") {
          throw new Error("Invalid scratch code format");
        }
        setScratchCode(extracted);
        await verifyCode(extracted);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(`Invalid QR code: ${msg}`);
        setScanned(false);
      }
    },
    [scanned, verifyCode]
  );

  // Optional BarcodeDetector loop when camera is live
  useEffect(() => {
    if (mode !== "scan" || !hasPermission || scanned || isVerifying) return;
    const BD =
      typeof window !== "undefined"
        ? (
            window as unknown as {
              BarcodeDetector?: new (opts: {
                formats: string[];
              }) => {
                detect: (src: ImageBitmapSource) => Promise<{ rawValue: string }[]>;
              };
            }
          ).BarcodeDetector
        : undefined;
    if (!BD) return;

    let cancelled = false;
    const detector = new BD({ formats: ["qr_code"] });
    scanLoopRef.current = window.setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || cancelled) return;
      try {
        const codes = await detector.detect(video);
        if (codes[0]?.rawValue) {
          await handleQRPayload(codes[0].rawValue);
        }
      } catch {
        /* ignore frame errors */
      }
    }, 500);

    return () => {
      cancelled = true;
      if (scanLoopRef.current != null) {
        window.clearInterval(scanLoopRef.current);
        scanLoopRef.current = null;
      }
    };
  }, [mode, hasPermission, scanned, isVerifying, handleQRPayload]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setScanned(false);
  };

  const resetScanner = () => {
    setScanned(false);
    setError("");
    setScratchCode("");
  };

  const simulateScan = () => {
    void handleQRPayload(
      JSON.stringify({ scratch_code: "KRONIS-DEMO-007" })
    );
  };

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      style={{ background: kronis.background }}
    >
      <header className="flex items-center gap-2 px-3 pb-2.5 pt-1">
        <SoftChip
          icon={ArrowLeft}
          onClick={() => router.back()}
          label="Back"
        />
        <div
          className="flex-1 text-center text-[18px] font-extrabold tracking-[-0.2px]"
          style={{ color: kronis.ink }}
        >
          Add a pump
        </div>
        <div className="h-[42px] w-[42px]" />
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-[18px] pb-8 pt-1">
        <p
          className="mb-4 text-[15px] font-semibold leading-[22px]"
          style={{ color: kronis.inkMuted }}
        >
          Scan the QR on your control unit, or type the scratch code from the
          device pack.
        </p>

        {error ? (
          <SoftRaised className="mb-3.5" radius={14}>
            <div className="flex items-center gap-2.5 px-3.5 py-3">
              <AlertCircle size={20} color={kronis.alert} className="shrink-0" />
              <span
                className="min-w-0 flex-1 text-[14px] font-semibold leading-5"
                style={{ color: kronis.alert }}
              >
                {error}
              </span>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setError("")}
                className="shrink-0"
              >
                <X size={18} color={kronis.alert} />
              </button>
            </div>
          </SoftRaised>
        ) : null}

        {/* Mode tabs */}
        <div
          className="mb-4 flex overflow-hidden rounded-2xl border"
          style={{
            background: kronis.surfaceMuted,
            borderColor: kronis.border,
          }}
        >
          <button
            type="button"
            onClick={() => switchMode("scan")}
            className="flex flex-1 items-center justify-center gap-2 py-3.5"
            style={{
              background: mode === "scan" ? kronis.surface : "transparent",
            }}
          >
            <QrCode
              size={18}
              color={mode === "scan" ? kronis.lime : kronis.inkMuted}
            />
            <span
              className="text-[15px]"
              style={{
                fontWeight: mode === "scan" ? 700 : 600,
                color: mode === "scan" ? kronis.ink : kronis.inkMuted,
              }}
            >
              Scan QR
            </span>
          </button>
          <button
            type="button"
            onClick={() => switchMode("code")}
            className="flex flex-1 items-center justify-center gap-2 py-3.5"
            style={{
              background: mode === "code" ? kronis.surface : "transparent",
            }}
          >
            <Keyboard
              size={18}
              color={mode === "code" ? kronis.lime : kronis.inkMuted}
            />
            <span
              className="text-[15px]"
              style={{
                fontWeight: mode === "code" ? 700 : 600,
                color: mode === "code" ? kronis.ink : kronis.inkMuted,
              }}
            >
              Enter code
            </span>
          </button>
        </div>

        {mode === "scan" ? (
          <SoftRaised className="p-4" radius={22}>
            {hasPermission === null ? (
              <div className="flex items-center justify-center py-16">
                <span
                  className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
                  style={{
                    borderTopColor: kronis.lime,
                    borderRightColor: kronis.lime,
                  }}
                />
              </div>
            ) : hasPermission === false ? (
              <div className="flex flex-col items-center px-3 py-7 text-center">
                <div
                  className="mb-3.5 flex h-16 w-16 items-center justify-center rounded-[20px]"
                  style={{ background: kronis.surfaceMuted }}
                >
                  <CameraOff size={32} color={kronis.inkMuted} />
                </div>
                <div
                  className="mb-1.5 text-[17px] font-extrabold"
                  style={{ color: kronis.ink }}
                >
                  Camera access needed
                </div>
                <p
                  className="mb-4 text-[14px] font-semibold leading-5"
                  style={{ color: kronis.inkMuted }}
                >
                  Allow camera to scan the QR code on your pump control unit.
                </p>
                <SoftButton
                  label="Allow camera"
                  variant="ink"
                  className="w-full"
                  onClick={() => void startCamera()}
                />
                <SoftButton
                  label="Simulate QR scan (demo)"
                  variant="soft"
                  size="pill"
                  className="mt-3"
                  onClick={simulateScan}
                />
              </div>
            ) : (
              <>
                <div
                  className="relative h-[320px] overflow-hidden rounded-[18px]"
                  style={{ background: kronis.ink }}
                >
                  <video
                    ref={videoRef}
                    className="absolute inset-0 h-full w-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                  <div
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(23,26,18,0.28)" }}
                  >
                    <div className="relative h-[220px] w-[220px]">
                      <span
                        className="absolute left-0 top-0 h-7 w-7 rounded-tl-lg border-l-[3px] border-t-[3px]"
                        style={{ borderColor: kronis.lime }}
                      />
                      <span
                        className="absolute right-0 top-0 h-7 w-7 rounded-tr-lg border-r-[3px] border-t-[3px]"
                        style={{ borderColor: kronis.lime }}
                      />
                      <span
                        className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-lg border-b-[3px] border-l-[3px]"
                        style={{ borderColor: kronis.lime }}
                      />
                      <span
                        className="absolute bottom-0 right-0 h-7 w-7 rounded-br-lg border-b-[3px] border-r-[3px]"
                        style={{ borderColor: kronis.lime }}
                      />
                    </div>
                  </div>
                </div>
                <p
                  className="mt-3.5 text-center text-[13px] font-semibold"
                  style={{ color: kronis.inkMuted }}
                >
                  Align the QR code inside the frame
                </p>
                <div className="mt-3 flex flex-col items-center gap-2">
                  <SoftButton
                    label="Reset scanner"
                    icon={RefreshCw}
                    size="pill"
                    variant="soft"
                    onClick={resetScanner}
                  />
                  <SoftButton
                    label="Simulate QR scan (demo)"
                    size="pill"
                    variant="soft"
                    onClick={simulateScan}
                  />
                </div>
              </>
            )}
          </SoftRaised>
        ) : (
          <SoftRaised className="p-4" radius={22}>
            <div
              className="mb-2 text-[13px] font-bold tracking-[0.2px]"
              style={{ color: kronis.inkMuted }}
            >
              Scratch code
            </div>
            <div
              className="mb-4 flex items-center gap-2.5 rounded-[14px] px-3.5 py-3"
              style={{ background: kronis.surfaceMuted }}
            >
              <KeyRound size={20} color={kronis.inkMuted} className="shrink-0" />
              <input
                className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold outline-none"
                style={{ color: kronis.ink }}
                placeholder="e.g. SCRATCH-PUMP-001"
                value={scratchCode}
                disabled={isVerifying}
                autoCapitalize="characters"
                autoCorrect="off"
                onChange={(e) => {
                  setScratchCode(e.target.value.toUpperCase());
                  setError("");
                }}
              />
              {scratchCode.length > 0 ? (
                <button
                  type="button"
                  aria-label="Clear"
                  onClick={() => {
                    setScratchCode("");
                    setError("");
                  }}
                >
                  <X size={20} color={kronis.inkMuted} />
                </button>
              ) : null}
            </div>
            <SoftButton
              label={isVerifying ? "Verifying…" : "Verify & add"}
              variant="ink"
              className="w-full"
              onClick={() => void verifyCode(scratchCode)}
            />
          </SoftRaised>
        )}

        {isVerifying && mode === "scan" ? (
          <div className="mt-4 flex justify-center">
            <SoftRaised className="rounded-full" radius={999}>
              <div className="flex items-center gap-2.5 px-4 py-2.5">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-transparent"
                  style={{
                    borderTopColor: kronis.lime,
                    borderRightColor: kronis.lime,
                  }}
                />
                <span
                  className="text-[13px] font-bold"
                  style={{ color: kronis.inkMuted }}
                >
                  Verifying…
                </span>
              </div>
            </SoftRaised>
          </div>
        ) : null}
      </div>

      {toast ? (
        <div
          className="pointer-events-none absolute inset-x-4 top-16 z-20 rounded-2xl px-4 py-3 text-center text-[13px] font-bold text-white shadow-lg"
          style={{ background: "rgba(23,26,18,0.92)" }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
