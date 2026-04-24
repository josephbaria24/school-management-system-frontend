"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { uploadImageToCloudinary } from "@/lib/uploadImage";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Cloudinary folder path (no leading/trailing slashes). */
  folder?: string;
}

export function LogoUploadField({
  value,
  onChange,
  folder = "sms/institution-logos",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const pickAndUpload = () => {
    setUploadError(null);
    inputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const { url } = await uploadImageToCloudinary(file, folder);
      onChange(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        className="sr-only"
        onChange={onFileChange}
      />

      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 bg-muted/30">
          <p className="text-sm font-semibold tracking-tight">Institution logo</p>
          <p className="text-xs text-muted-foreground">
            Used on reports, IDs, and printable forms.
          </p>
        </div>
        <div className="p-4">
          <div
            className={cn(
              "w-full aspect-square max-w-60 mx-auto rounded-2xl",
              "border border-dashed border-border/70 bg-background/60",
              "grid place-items-center overflow-hidden",
              "transition-colors"
            )}
          >
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value}
                alt="Institution Logo"
                className="h-full w-full object-contain p-4"
              />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <p className="mt-3 text-xs font-semibold">Drop your logo here</p>
                <p className="text-[11px] text-muted-foreground/80">
                  PNG, JPG, WEBP, SVG
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              onClick={pickAndUpload}
              disabled={uploading}
              className="flex-1 h-9 rounded-xl text-xs font-semibold gap-2"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Uploading…" : value ? "Replace logo" : "Upload logo"}
            </Button>
            <Button
              type="button"
              onClick={() => onChange("")}
              disabled={!value || uploading}
              variant="outline"
              className="h-9 rounded-xl text-xs font-semibold gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      </div>
      {uploadError && (
        <p className="text-xs text-destructive leading-snug">
          {uploadError}
        </p>
      )}
    </div>
  );
}
