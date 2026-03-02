"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  label?: string;
}

export default function ImageUpload({
  value,
  onChange,
  folder,
  label = "Image",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    // Preview locale immédiate
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'upload.");
        setPreview(value ?? null);
        return;
      }

      setPreview(data.url);
      onChange(data.url);
    } catch {
      setError("Erreur réseau lors de l'upload.");
      setPreview(value ?? null);
    } finally {
      setIsUploading(false);
      // Reset input pour pouvoir re-sélectionner le même fichier
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRemove() {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-muted-foreground">
        {label}
      </label>

      {preview ? (
        <div className="relative inline-block">
          <Image
            src={preview}
            alt="Aperçu"
            width={80}
            height={80}
            className="rounded-md border border-border object-contain"
            unoptimized
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-white shadow-sm hover:bg-destructive/90"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-usap-sang hover:text-foreground disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          {isUploading ? "Upload en cours..." : "Choisir une image"}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Hidden input pour envoyer l'URL dans le FormData */}
      <input type="hidden" name="logoUrl" value={preview ?? ""} />

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}

      <p className="mt-1 text-xs text-muted-foreground">
        JPG, PNG, WebP ou SVG. Max 2 Mo.
      </p>
    </div>
  );
}
