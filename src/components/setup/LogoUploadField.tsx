"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { uploadImageToCloudinary } from "@/lib/uploadImage";

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
    <div className="flex flex-col items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        className="sr-only"
        onChange={onFileChange}
      />

      <div className="w-52 h-52 border-2 border-muted-foreground/30 rounded-lg bg-white overflow-hidden flex items-center justify-center p-2 shadow-inner group transition-all hover:border-primary/50 dark:bg-background">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Institution Logo"
            className="max-w-full max-h-full object-contain animate-in fade-in zoom-in-95 duration-500"
          />
        ) : (
          <div className="flex flex-col items-center text-muted-foreground/40 animate-pulse">
            <ImageIcon className="h-16 w-16 mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest italic">
              Official Logo Area
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2 w-full max-w-52">
        <Button
          type="button"
          onClick={() => onChange("")}
          disabled={!value || uploading}
          variant="outline"
          size="sm"
          className="flex-1 h-7 text-[10px] font-bold uppercase border-2 border-muted-foreground/30 rounded hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all active:scale-95"
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
        <Button
          type="button"
          onClick={pickAndUpload}
          disabled={uploading}
          variant="outline"
          size="sm"
          className="flex-1 h-7 text-[10px] font-bold uppercase border-2 border-muted-foreground/30 rounded hover:bg-primary/10 hover:text-primary hover:border-primary transition-all active:scale-95 bg-white shadow-sm dark:bg-background"
        >
          {uploading ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Upload className="h-3 w-3 mr-1" />
          )}
          {uploading ? "Uploading…" : "Upload Logo"}
        </Button>
      </div>
      {uploadError && (
        <p className="text-[10px] text-destructive text-center max-w-52 leading-snug">
          {uploadError}
        </p>
      )}
    </div>
  );
}
