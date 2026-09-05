"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  FileText,
  FileUp,
  Image as ImageIcon,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { KycDocumentType, KycUploadResponse } from "@/lib/types";

interface KycUploadFormProps {
  onUploadSuccess?: () => void;
}

const DOCUMENT_TYPES: Array<{ value: KycDocumentType; label: string; description: string }> = [
  {
    value: "identity",
    label: "Documento de Identidad (General)",
    description: "DNI o documento nacional oficial completo",
  },
  {
    value: "dni_front",
    label: "DNI — Frente",
    description: "Frente de tu Documento Nacional de Identidad",
  },
  {
    value: "dni_back",
    label: "DNI — Dorso",
    description: "Dorso con código y huella de tu DNI",
  },
  {
    value: "selfie",
    label: "Selfie de Verificación",
    description: "Foto de tu rostro sosteniendo tu documento",
  },
  {
    value: "driver_license",
    label: "Licencia de Conducir",
    description: "Requerido si ofrecés transporte o servicios a domicilio con vehículo",
  },
  {
    value: "passport",
    label: "Pasaporte",
    description: "Página principal con foto y datos legibles",
  },
  {
    value: "professional_license",
    label: "Matrícula Profesional",
    description: "Credencial de matriculado (gasista, electricista, etc.)",
  },
  {
    value: "certificate",
    label: "Certificado de Antecedentes / Oficio",
    description: "Certificado de buena conducta o acreditación de formación",
  },
  {
    value: "other",
    label: "Otro Documento de Soporte",
    description: "Constancia de seguro, póliza o habilitación municipal",
  },
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

export function KycUploadForm({ onUploadSuccess }: KycUploadFormProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [documentType, setDocumentType] = useState<KycDocumentType>("dni_front");
  const [documentNumber, setDocumentNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    setFieldErrors({});

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage("El archivo supera el tamaño máximo permitido de 10MB.");
      return;
    }

    // Validar tipo MIME
    const isValidType =
      ALLOWED_MIME_TYPES.includes(file.type) ||
      /\.(jpe?g|png|pdf)$/i.test(file.name);

    if (!isValidType) {
      setErrorMessage("Formato inválido. Solo se admiten imágenes JPG, PNG o documentos PDF.");
      return;
    }

    setSelectedFile(file);

    // Si es imagen, crear preview local
    if (file.type.startsWith("image/")) {
      const preview = URL.createObjectURL(file);
      setFilePreviewUrl(preview);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const errors: Record<string, string> = {};

    // Validaciones client-side
    const cleanNumber = documentNumber.trim();
    if (!cleanNumber) {
      errors.document_number = "El número de documento es obligatorio.";
    } else if (!/^[0-9A-Za-z]+$/.test(cleanNumber)) {
      errors.document_number = "Solo se permiten caracteres alfanuméricos sin espacios ni guiones.";
    } else if (cleanNumber.length < 4 || cleanNumber.length > 50) {
      errors.document_number = "El número debe tener entre 4 y 50 caracteres.";
    }

    if (!selectedFile) {
      errors.file = "Debés seleccionar o tomar una foto de tu documento.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("document_type", documentType);
      formData.append("document_number", cleanNumber);
      if (selectedFile) {
        formData.append("document_file", selectedFile);
      }
      if (expiryDate) {
        formData.append("expiry_date", expiryDate);
      }

      await apiFetch<KycUploadResponse>(ENDPOINTS.KYC_DOCUMENTS, {
        method: "POST",
        body: formData,
      });

      showToast("Documento subido correctamente para revisión", "success");

      // Limpiar formulario tras éxito
      handleClearFile();
      setDocumentNumber("");
      setExpiryDate("");

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err: any) {
      if (err?.status === 409 || err?.message?.includes("Ya existe")) {
        setErrorMessage(
          err?.message || "Ya existe un documento registrado con este número y tipo para tu cuenta."
        );
      } else if (err?.errors) {
        const firstErrorKey = Object.keys(err.errors)[0];
        setErrorMessage(err.errors[firstErrorKey]?.[0] || "Datos inválidos en el formulario.");
      } else {
        setErrorMessage(err?.message || "Error al subir el documento. Verificá los datos e intentá de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[24px] bg-[#131318] border border-white/10 p-5 sm:p-6 space-y-5 shadow-xl">
      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-[#F4F3F7] flex items-center gap-2">
          <FileUp className="size-5 text-[#8B6BFF]" />
          <span>Subir Nuevo Documento</span>
        </h3>
        <p className="text-xs text-zinc-400">
          Tus archivos se resguardan de forma segura y privada para validar tu cuenta.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-start gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* TIPO DE DOCUMENTO */}
      <div className="space-y-1.5">
        <label htmlFor="kyc-doc-type" className="block text-[10.5px] font-mono tracking-wider uppercase text-zinc-400 font-semibold">
          Tipo de documento *
        </label>
        <select
          id="kyc-doc-type"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as KycDocumentType)}
          className="w-full rounded-2xl border border-white/12 bg-[#08080A] p-3.5 text-xs text-[#F4F3F7] focus:outline-none focus:border-[#7C5CFF] transition"
        >
          {DOCUMENT_TYPES.map((dt) => (
            <option key={dt.value} value={dt.value} className="bg-[#131318] text-white">
              {dt.label}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-zinc-500 pl-1">
          {DOCUMENT_TYPES.find((d) => d.value === documentType)?.description}
        </p>
      </div>

      {/* NÚMERO DE DOCUMENTO */}
      <div className="space-y-1.5">
        <label htmlFor="kyc-doc-number" className="block text-[10.5px] font-mono tracking-wider uppercase text-zinc-400 font-semibold">
          Número de documento / identificador *
        </label>
        <input
          id="kyc-doc-number"
          type="text"
          value={documentNumber}
          onChange={(e) => {
            setDocumentNumber(e.target.value);
            if (fieldErrors.document_number) {
              setFieldErrors((prev) => ({ ...prev, document_number: "" }));
            }
          }}
          placeholder="Ej: 38472910 o B912384"
          className={`w-full rounded-2xl border bg-[#08080A] p-3.5 text-xs text-[#F4F3F7] placeholder-zinc-500 focus:outline-none transition ${
            fieldErrors.document_number ? "border-red-500 focus:border-red-500" : "border-white/12 focus:border-[#7C5CFF]"
          }`}
        />
        {fieldErrors.document_number && (
          <p className="text-[11px] text-red-400 pl-1">{fieldErrors.document_number}</p>
        )}
      </div>

      {/* FECHA DE EXPIRACIÓN (OPCIONAL) */}
      <div className="space-y-1.5">
        <label htmlFor="kyc-expiry-date" className="block text-[10.5px] font-mono tracking-wider uppercase text-zinc-400 font-semibold">
          Fecha de vencimiento (Opcional)
        </label>
        <input
          id="kyc-expiry-date"
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          className="w-full rounded-2xl border border-white/12 bg-[#08080A] p-3.5 text-xs text-[#F4F3F7] focus:outline-none focus:border-[#7C5CFF] transition"
        />
      </div>

      {/* ZONA DRAG & DROP / SUBIDA DE ARCHIVO */}
      <div className="space-y-2">
        <label className="block text-[10.5px] font-mono tracking-wider uppercase text-zinc-400 font-semibold">
          Archivo o fotografía *
        </label>

        {selectedFile ? (
          <div className="rounded-2xl border border-[#3DDC84]/40 bg-[#3DDC84]/10 p-4 flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3 min-w-0">
              {filePreviewUrl ? (
                <div className="size-12 rounded-xl overflow-hidden border border-white/20 shrink-0 relative bg-black/40">
                  <img src={filePreviewUrl} alt="Vista previa" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="size-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-[#3DDC84]">
                  <FileText className="size-6" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-[#F4F3F7] truncate">{selectedFile.name}</p>
                  <CheckCircle2 className="size-3.5 text-[#3DDC84] shrink-0" />
                </div>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearFile}
              className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
              title="Quitar archivo"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? "border-[#7C5CFF] bg-[#7C5CFF]/15 scale-[1.01]"
                : fieldErrors.file
                ? "border-red-500/60 bg-red-500/5 hover:border-red-500"
                : "border-white/15 bg-white/3 hover:bg-white/6 hover:border-white/30"
            }`}
          >
            <div className="size-12 rounded-2xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 flex items-center justify-center text-[#8B6BFF] shadow-md">
              <UploadCloud className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#F4F3F7]">
                Arrastrá tu archivo aquí o <span className="text-[#8B6BFF] underline">explorá</span>
              </p>
              <p className="text-[11px] text-zinc-400">JPG, PNG o PDF (Máximo 10MB)</p>
            </div>

            {/* BOTÓN RÁPIDO PARA CÁMARA EN MÓVIL */}
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/6 hover:bg-white/12 text-xs font-semibold text-zinc-300 border border-white/10 transition cursor-pointer"
              >
                <Camera className="size-3.5 text-[#A8FF35]" />
                <span>Tomar foto con cámara</span>
              </button>
            </div>
          </div>
        )}

        {fieldErrors.file && <p className="text-[11px] text-red-400 pl-1">{fieldErrors.file}</p>}

        {/* Inputs de archivo ocultos */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* BOTÓN DE ENVÍO */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#7C5CFF] hover:bg-[#6b47ff] text-sm font-extrabold text-white transition shadow-[0_12px_32px_rgba(124,92,255,0.4)] cursor-pointer disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            <span>Subiendo documento...</span>
          </>
        ) : (
          <>
            <UploadCloud className="size-5" />
            <span>Enviar documento a revisión</span>
          </>
        )}
      </button>
    </form>
  );
}
