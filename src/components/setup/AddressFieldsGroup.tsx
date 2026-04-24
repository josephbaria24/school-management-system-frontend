"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Props {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: Record<string, string>;
}

function Field({
  label,
  name,
  formData,
  onChange,
  errors,
  className,
}: {
  label: string;
  name: string;
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: Record<string, string>;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-[11px] text-muted-foreground font-medium pl-0.5">
        {label}
      </Label>
      <Input
        name={name}
        value={formData[name] || ""}
        onChange={onChange}
        className={cn(
          "h-9 rounded-xl border-border/60 bg-background shadow-sm",
          errors[name] && "border-destructive ring-1 ring-destructive/30"
        )}
      />
      {errors[name] && (
        <p className="text-[11px] text-destructive font-medium mt-1">
          {errors[name]}
        </p>
      )}
    </div>
  );
}

export function AddressFieldsGroup({ formData, onChange, errors }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label="Street / Building"
          name="address_street"
          formData={formData}
          onChange={onChange}
          errors={errors}
          className="md:col-span-2"
        />
        <Field
          label="Municipality / City"
          name="address_municipality"
          formData={formData}
          onChange={onChange}
          errors={errors}
        />
        <Field
          label="Province"
          name="address_province_city"
          formData={formData}
          onChange={onChange}
          errors={errors}
        />
        <Field
          label="Region"
          name="address_region"
          formData={formData}
          onChange={onChange}
          errors={errors}
        />
        <Field
          label="Zip Code"
          name="address_zip_code"
          formData={formData}
          onChange={onChange}
          errors={errors}
        />
      </div>
    </div>
  );
}
