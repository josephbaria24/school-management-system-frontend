"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: Record<string, string>;
}

export function AddressFieldsGroup({ formData, onChange, errors }: Props) {
  const fields = [
    { name: "address_street", label: "(street)", className: "flex-[2]" },
    { name: "address_municipality", label: "(municipality)", className: "flex-[1.5]" },
    { name: "address_province_city", label: "(province/city)", className: "flex-[1.5]" },
    { name: "address_region", label: "(region)", className: "flex-[1]" },
    { name: "address_zip_code", label: "(Zip Code)", className: "flex-[0.8]" }
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Label className="w-48 text-right font-medium text-muted-foreground shrink-0 pr-4">
          Institutional Address
        </Label>
        
        <div className="flex-1 flex gap-2 overflow-hidden">
          {fields.map((field) => (
            <div key={field.name} className={`${field.className} min-w-0 transition-all duration-300`}>
              <div className="relative">
                <Input
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={onChange}
                  className={`h-9 px-2 rounded-sm border-muted-foreground/30 focus-visible:ring-primary/20 transition-all ${errors[field.name] ? "border-destructive/50 ring-destructive/20" : "hover:border-primary/40 focus:border-primary"}`}
                />
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-1 whitespace-nowrap overflow-hidden text-ellipsis italic">
                {field.label}
              </p>
              {errors[field.name] && <p className="text-[10px] font-medium text-destructive mt-0.5">{errors[field.name]}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
