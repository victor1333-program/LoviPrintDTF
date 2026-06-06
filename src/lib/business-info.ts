export interface BusinessAddress {
  street: string
  postalCode: string
  city: string
  province: string
  country: string
}

export const BUSINESS = {
  legalName: "María Dolores Villena García",
  commercialName: "LoviPrintDTF",
  nif: "77598953N",
  email: "info@loviprintdtf.es",
  phone: "+34 614 051 291",
  phoneE164: "+34614051291",
  website: "www.loviprintdtf.es",
  fiscalAddress: {
    street: "Calle La Monecilla 10",
    postalCode: "02400",
    city: "Hellín",
    province: "Albacete",
    country: "España",
  },
  physicalAddress: {
    street: "Calle Antonio López del Oro 7",
    postalCode: "02400",
    city: "Hellín",
    province: "Albacete",
    country: "España",
  },
} as const satisfies {
  legalName: string
  commercialName: string
  nif: string
  email: string
  phone: string
  phoneE164: string
  website: string
  fiscalAddress: BusinessAddress
  physicalAddress: BusinessAddress
}

export function formatAddressOneLine(a: BusinessAddress): string {
  return `${a.street}, ${a.postalCode} ${a.city} (${a.province})`
}

export function formatAddressMultiLine(a: BusinessAddress): string {
  return `${a.street}\n${a.postalCode} ${a.city} (${a.province})`
}
