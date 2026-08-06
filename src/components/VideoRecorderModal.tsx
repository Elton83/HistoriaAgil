import React, { useState, useRef, useEffect } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Square,
  Play,
  RotateCcw,
  Check,
  X,
  Monitor,
  Camera,
  AlertCircle,
} from "lucide-react";

interface VideoRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVideo: (videoBlob: Blob, defaultName: string) => void;
}

export const VideoRecorderModal: React.FC<VideoRecorderModalProps> = ({
  isOpen,
  onClose,
  onSaveVideo,
}) => {
  const [sourceType, setSourceType] = useState<"camera" | "screen">("camera");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen && !recordedBlob) {
      startCameraPreview(sourceType);
    }
    return () => {
      stopAllTracks();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isOpen, sourceType]);

  const stopAllTracks = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const startCameraPreview = async (type: "camera" | "screen") => {
    stopAllTracks();
    setErrorMessage(null);
    try {
      let stream: MediaStream;
      if (type === "camera") {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
      } else {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        stream = screenStream;
      }

      mediaStreamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error("Erro ao acessar mídia:", err);
      setErrorMessage(
        `Não foi possível acessar a ${type === "camera" ? "câmera" : "tela/áudio"}. Verifique as permissões do navegador.`
      );
    }
  };

  const startRecording = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];
    setRecordedBlob(null);
    setPreviewUrl(null);
    setRecordingTime(0);

    try {
      const options = { mimeType: "video/webm;codecs=vp9,opus" };
      let recorder: MediaRecorder;

      try {
        recorder = new MediaRecorder(mediaStreamRef.current, options);
      } catch {
        recorder = new MediaRecorder(mediaStreamRef.current);
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);

        // Disconnect stream from preview so recorded video can be watched
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
          videoPreviewRef.current.src = url;
          videoPreviewRef.current.controls = true;
        }
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(`Falha ao iniciar gravação: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      stopAllTracks();
    }
  };

  const handleReRecord = () => {
    setRecordedBlob(null);
    setPreviewUrl(null);
    setRecordingTime(0);
    if (videoPreviewRef.current) {
      videoPreviewRef.current.controls = false;
      videoPreviewRef.current.src = "";
    }
    startCameraPreview(sourceType);
  };

  const handleConfirmSave = () => {
    if (recordedBlob) {
      onSaveVideo(
        recordedBlob,
        `gravacao_escopo_${new Date().toISOString().slice(11, 19).replace(/:/g, "-")}.webm`
      );
      onClose();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-950/90 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Video className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Gravação de Vídeo / Escopo</h3>
              <p className="text-[11px] text-slate-400">
                Grave um vídeo explicando o requisito para extração automática pela IA
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopAllTracks();
              onClose();
            }}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Source Type Selector */}
          {!isRecording && !recordedBlob && (
            <div className="flex items-center justify-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800 max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => setSourceType("camera")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  sourceType === "camera"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Câmera</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceType("screen")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  sourceType === "screen"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Compartilhar Tela</span>
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-rose-950/60 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Video Viewport */}
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
            <video
              ref={videoPreviewRef}
              muted={!recordedBlob}
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Recording Indicator Badge */}
            {isRecording && (
              <div className="absolute top-3 left-3 bg-rose-950/90 border border-rose-600/80 text-rose-200 text-xs font-mono font-bold px-3 py-1 rounded-full flex items-center space-x-2 shadow-lg animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>GRAVANDO {formatTime(recordingTime)}</span>
              </div>
            )}
          </div>

          {/* Recording Controls */}
          <div className="flex items-center justify-center space-x-3 pt-2">
            {!isRecording && !recordedBlob && (
              <button
                type="button"
                onClick={startRecording}
                disabled={Boolean(errorMessage)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <span className="w-3 h-3 rounded-full bg-white animate-ping" />
                <span>Iniciar Gravação</span>
              </button>
            )}

            {isRecording && (
              <button
                type="button"
                onClick={stopRecording}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 shadow-lg transition flex items-center space-x-2 cursor-pointer"
              >
                <Square className="w-4 h-4 text-rose-400 fill-rose-400" />
                <span>Parar Gravação ({formatTime(recordingTime)})</span>
              </button>
            )}

            {recordedBlob && (
              <>
                <button
                  type="button"
                  onClick={handleReRecord}
                  className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Gravar Novamente</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center space-x-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Anexar Vídeo ao Escopo</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
