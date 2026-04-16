export interface Campus {
  id: number;
  institution_id: number | null;
  acronym: string;
  campus_name: string | null;
  short_name: string | null;
  short_name_by_site: string | null;

  // Registrar Office
  registrar_office_name: string | null;
  registrar_name: string | null;
  registrar_title: string | null;
  registrar_applies_to_all: boolean;

  // Accounting Office
  accounting_office_name: string | null;
  accountant_name: string | null;
  accountant_title: string | null;
  accounting_applies_to_all: boolean;

  // Cashier Office
  cashier_office_name: string | null;
  cashier_name: string | null;
  cashier_title: string | null;
  cashier_applies_to_all: boolean;

  // Location
  barangay: string | null;
  town_city: string | null;
  district_id: string | null;
  zip_code: string | null;
  province: string | null;
  region: string | null;
  mailing_address: string | null;
  email: string | null;
  website: string | null;
  telephone_no: string | null;
  fax_no: string | null;

  created_at?: string;
  updated_at?: string;
}

export type CampusPayload = Omit<Campus, 'id' | 'created_at' | 'updated_at'>;

export const emptyCampus: CampusPayload = {
  institution_id: null,
  acronym: "",
  campus_name: "",
  short_name: "",
  short_name_by_site: "",
  registrar_office_name: "",
  registrar_name: "",
  registrar_title: "",
  registrar_applies_to_all: false,
  accounting_office_name: "",
  accountant_name: "",
  accountant_title: "",
  accounting_applies_to_all: false,
  cashier_office_name: "",
  cashier_name: "",
  cashier_title: "",
  cashier_applies_to_all: false,
  barangay: "",
  town_city: "",
  district_id: "",
  zip_code: "",
  province: "",
  region: "",
  mailing_address: "",
  email: "",
  website: "",
  telephone_no: "",
  fax_no: "",
};
