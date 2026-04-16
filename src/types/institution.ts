export interface InstitutionClassification {
  id: number;
  name: string;
  description?: string;
}

export interface InstitutionHead {
  id: number;
  full_name: string;
}

export interface InstitutionHeadTitle {
  id: number;
  name: string;
}

export interface AcademicInstitution {
  id: number;
  official_name: string;
  classification_id: number;
  classification_name?: string;
  head_person_id?: number | null;
  head_title?: string | null;
  institution_unique_identifier?: string | null;
  address_street?: string | null;
  address_municipality?: string | null;
  address_province_city?: string | null;
  address_region?: string | null;
  address_zip_code?: string | null;
  telephone_no?: string | null;
  fax_no?: string | null;
  head_telephone?: string | null;
  email_address?: string | null;
  website?: string | null;
  year_established?: number | null;
  latest_sec_registration?: string | null;
  date_granted_or_approved?: string | null;
  year_converted_to_college?: number | null;
  year_converted_to_university?: number | null;
  logo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type AcademicInstitutionPayload = Omit<AcademicInstitution, 'id' | 'created_at' | 'updated_at' | 'classification_name'>;
