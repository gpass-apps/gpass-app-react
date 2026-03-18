import { FormRule } from "antd";
import { Rols, TypeRute } from "../types";
import { Company, User, EventForm, Event } from "../interfaces";
import dayjs from "dayjs";

export const baseUrlStorage = "https://firebasestorage.googleapis.com/v0/b/gpass-apps.appspot.com/o/";
export const urlImageDefaultCompany = "https://firebasestorage.googleapis.com/v0/b/gpass-apps.appspot.com/o/company%2Fcompany.png?alt=media&token=4a25e724-96c5-4303-bbfd-0e2d03a2ccc1";
export const urlImageDefaultEvent = "https://firebasestorage.googleapis.com/v0/b/gpass-apps.appspot.com/o/Events%2Fevento.png?alt=media&token=43afcd4d-5e32-4569-8a45-502e78932e1d";
export const urlCloudFunction = "https://api-ixacg3o2ga-uc.a.run.app";

export const privateRoutesByUser: Record<Rols, string[]> = {
  'SuperAdministrador': [
    "/empresas",
    "/empresas/registrar",
    "/empresas/editar",
    "/eventos",
    "/eventos/registrar",
    "/eventos/editar",
    "/eventos/boletos",
    "/eventos/asignar-boletos",
    "/eventos/lectores",
    "/usuarios",
    "/usuarios/registrar",
    "/usuarios/editar",
    "/lector",
  ],
  'Administrador': ["/eventos", "/usuarios", "/usuarios/registrar", "/lector", "/eventos/boletos", "/eventos/registrar", "/eventos/asignar-boletos", "/eventos/lectores"],
  'Embajador': ["/eventos", "/lector", "/eventos/boletos"],
  'Lector': ["/eventos", "/lector"]
};

export const initEventForm: EventForm = {
  name: "",
  initialDate: dayjs(),
  finalDate: dayjs(),
  image: [],
  disabled: false,
  createAt: new Date(),
  total: 0,
  companyName: "",
  companyUid: "",
  userAmbassadorIds: [],
  ambassadorsRanges: [],
  userScannerIds: []
};

export const initEvent: Event = {
  name: "",
  initialDate: new Date(),
  finalDate: new Date(),
  image: [],
  disabled: false,
  createAt: new Date(),
  total: 0,
  companyName: "",
  companyUid: "",
  userAmbassadorIds: [],
  ambassadorsRanges: [],
  userScannerIds: []
};

export const initCompany: Company = {
  name: "",
  email: "",
  phone: "",
  image: [],
  address: "",
  disabled: false,
  createAt: new Date()
};

export const initUser: User = {
  name: "",
  email: "",
  phone: "",
  companyName: "",
  companyUid: "",
  password: "",
  confirmPassword: "",
  disabled: false,
  createAt: new Date()
};

export const rulePhoneInput: FormRule = {
  required: true,
  message: 'El número telefónico tiene que ser de 10 dígitos.',
  validator: (rule, value?: string) => value?.length !== 10 ? Promise.reject(rule.message) : Promise.resolve(),
} as const;
export const ruleMaxLength: FormRule = {
  max: 300,
  message: "El texto no puede tener más de 300 caracteres."
} as const;
export const ruleEmail: FormRule = {
  required: true,
  message: 'Favor de escribir un correo electrónico válido.',
  type: "email"
} as const;
export const rulePassword: FormRule = {
  required: true,
  min: 6,
  message: 'La contraseña tiene que ser de 6 dígitos o más.'
} as const;
export const titleForm: Record<TypeRute, string> = {
  create: "Registrar",
  update: "Editar"
} as const;
